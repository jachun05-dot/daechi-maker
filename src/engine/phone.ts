/* =========================================================
   메신저 엔진 — 톡 하나 = 짧은 대화 한 판 (stories/chat/*.story)
   - 사건(triggers.ts emit)을 들으면 그 키를 기다리는 대화를 도착 예정 목록에 올린다 (chatEvent)
   - dayTick(날짜): 게임 속 하루가 지날 때마다 대화가 도착하고, 답장 기한이 지난 대화는 읽씹·안읽씹 처리
   - 대화는 첫 답장 선택지까지 한꺼번에 도착하고, 답장을 고르면 상대가 입력 중… 후 이어서 보낸다
   - 먼저 연락하기: startCall(인물, 주제) → call.{인물}.{주제} 장면이 답한다
   ========================================================= */
import type { CharId, ChatMsg, GameState, PendingChat, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { CHARACTERS, CHAR_ORDER, NPCS, isCharId } from '@/content/characters';
import { HABIT, IGNORE, POLITE, TOPICS, type Room, type Topic } from '@/content/phone';
import { placeById } from '@/content/places';
import { WEEKEND_PLACES } from '@/content/presence';
import { TURNS } from '@/content/calendar';
import { ui, sleep } from '@/store/ui';
import { ScenePlayer, type View } from './story/player';
import { SCENES, getScene, hasScene } from './story/library';
import { evalCond, josa, type StoryCtx } from './story/context';
import { applyEffect, clamp, game, refresh, saves, unlockAlbum } from './state';
import { onTrigger } from './triggers';

export type { Room };
export const ROOMS: Room[] = [...CHAR_ORDER, 'jiyu', 'mom'];
export const isRoom = (r: string): r is Room => (ROOMS as string[]).includes(r);
export const roomName = (r: string) => (isCharId(r) ? CHARACTERS[r].name : NPCS[r]?.name ?? r);
const roomOf = (id: string) => id.split('.')[1] as Room;
const WD = '월화수목금토일';

/* ---------- 대화 목록 (장면 머리말에서) ---------- */
export interface ChatDef { id: string; room: Room; on: string[]; cond: string | null; aff: number; delay: number; time: string | null; repeat: boolean }
export const CHATS: ChatDef[] = Object.values(SCENES)
  .filter(s => s.id.startsWith('chat.'))
  .map(s => ({
    id: s.id, room: roomOf(s.id), on: (s.attrs.on ?? '').split(',').filter(Boolean), cond: s.attrs.if ?? null,
    aff: Number(s.attrs.aff ?? 0), delay: Number(s.attrs.delay ?? 1), time: s.attrs.time ?? null, repeat: s.attrs.repeat === '1',
  }));

/** 대화 속 사진 — 앨범에 쓴다 */
export interface Photo { id: string; room: Room; caption: string; scene: string }
export const PHOTOS: Photo[] = [];
{
  const walk = (scene: string, nodes: StoryNode[]) => nodes.forEach(n => {
    if (n.t === 'cmd' && n.name === 'photo' && n.args[0] && !PHOTOS.some(p => p.id === n.args[0])) PHOTOS.push({ id: n.args[0], room: roomOf(scene), caption: n.args.slice(1).join(' '), scene });
    if (n.t === 'if') n.branches.forEach(b => walk(scene, b.body));
    if (n.t === 'choice') n.options.forEach(o => walk(scene, o.body));
  });
  for (const s of Object.values(SCENES)) if (s.id.startsWith('chat.') || s.id.startsWith('call.')) walk(s.id, s.nodes);
}

/* ---------- 시각 ---------- */
/** 날짜 구분선: "1학년 3월 2주 · 화요일" */
export function dayTitle(day: number) {
  const T = TURNS[Math.min(TURNS.length - 1, Math.max(0, Math.floor(day / 28)))];
  return `${T.label} ${Math.floor((day % 28) / 7) + 1}주 · ${WD[((day % 7) + 7) % 7]}요일`;
}
export const dayOf = (turn: number, week: number, d: number) => turn * 28 + week * 7 + d;
function stamp(room: Room, day: number, fixed?: string | null) {
  const [a, b] = HABIT[room].hours;
  const h = fixed ? fixed : `${String(Math.min(23, a + Math.floor(Math.random() * Math.max(1, b - a))) % 24).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
  return `${WD[((day % 7) + 7) % 7]} ${h}`;
}

/* ---------- 대화 재생 ---------- */
interface Session { player: ScenePlayer; ctx: StoryCtx; view: View }
const sessions = new Map<string, Session>();
export const resetSessions = () => sessions.clear();

function ctxFor(st: GameState, room: Room): StoryCtx {
  const vars: Record<string, string | number> = {};
  if (isCharId(room)) {
    const fixed = st.promiseNext.find(p => p.c === room);
    const where = fixed?.place ?? st.presence[room];
    if (where) vars.where = placeById(where)?.name ?? '';
    if (fixed) vars.when = slotLabel(fixed.slot);
  }
  return { state: st, name: st.name, vars };
}
const slotLabel = (i: number) => `${i < 2 ? '토요일' : '일요일'} ${i % 2 ? '저녁' : '낮'}`;

function makePlayer(st: GameState, id: string, replay: boolean): Session {
  const room = roomOf(id);
  const ctx = ctxFor(st, room);
  const player = new ScenePlayer(getScene(id).nodes, ctx, {
    replay,
    onCmd: (name, _args, rp) => {
      if (name === 'promise' && isCharId(room)) {
        let fixed = st.promiseNext.find(p => p.c === room);
        if (!fixed && !rp) {
          const used = st.promiseNext.map(p => p.slot);
          const free = [0, 1, 2, 3].filter(s => !used.includes(s));
          const place = st.presence[room] ?? WEEKEND_PLACES[room][TURNS[Math.min(st.turn, TURNS.length - 1)].year][0];
          if (free.length && place) { fixed = { c: room, place, slot: free[Math.floor(Math.random() * free.length)] }; st.promiseNext.push(fixed); }
        }
        if (fixed) { ctx.vars.when = slotLabel(fixed.slot); ctx.vars.where = placeById(fixed.place)?.name ?? ''; }
      }
    },
  }, e => {
    applyEffect(e, st);
    const up = Object.entries(e.aff ?? {}).filter(([, v]) => v > 0);
    if (up.length) ui.toast(up.map(([k, v]) => `${CHARACTERS[k as CharId].name} ♥+${v}`).join(' · '));
    refresh();
  });
  return { player, ctx, view: player.view };
}

/** 지금 화면(View)을 말풍선으로 */
function toMsg(st: GameState, v: View, time?: string): ChatMsg | null {
  if (v.photo) { unlockAlbum(`photo:${v.photo.id}`); return { from: 'them', text: v.photo.caption, photo: v.photo.id, time }; }
  if (v.mode !== 'say' || !v.text) return null;
  if (v.speaker === null) return { from: 'sys', text: v.text };
  if (v.speaker === st.name) return { from: 'me', text: v.text };
  return { from: 'them', text: v.text, time };
}

/** 다음 선택지(또는 끝)까지 말풍선을 모은다. live 면 입력 중… 연출 */
async function run(st: GameState, room: Room, s: Session, v: View, live: boolean, time?: string) {
  let n = 0;
  while (v.mode !== 'choice' && v.mode !== 'done') {
    const m = toMsg(st, v, time);
    if (m) {
      if (live && m.from === 'them') {
        ui.setTyping(room);
        await sleep(Math.min(1500, 450 + m.text.length * 28) * [1.4, 1, 0.5][game.settings.textSpeed]);
      }
      (st.chats[room] ??= []).push({ ...m, day: st.day });
      if (m.from === 'them') n++;
      if (live) { ui.setTyping(null); refresh(); }
    }
    v = s.player.next();
  }
  s.view = v;
  return { end: v.mode as 'choice' | 'done', n };
}

/** 이어 갈 수 없는 대화 — 기록은 남기고 답장 대기만 푼다 (읽씹 벌점 없음) */
function drop(st: GameState, room: Room) {
  delete st.pending[room];
  sessions.delete(room);
}

function finish(st: GameState, room: Room) {
  delete st.pending[room];
  sessions.delete(room);
  refresh();
}

/** 대화 도착 — 첫 선택지까지 한꺼번에 */
async function deliver(st: GameState, id: string, live = false) {
  const room = roomOf(id);
  const def = CHATS.find(c => c.id === id);
  const time = stamp(room, st.day, def?.time);
  const s = makePlayer(st, id, false);
  const { end, n } = await run(st, room, s, s.player.next(), live, time);
  if (!live) st.unread[room] = (st.unread[room] ?? 0) + n;
  if (!def?.repeat && id.startsWith('chat.')) st.flags[`chat_${id}`] = true;
  if (end === 'choice') {
    st.pending[room] = { id, arrived: st.day, time, opened: live, path: [], picked: [] };
    sessions.set(room, s);
  }
  return n;
}

/** 방을 연다 — 읽음 처리, 답장 대기 중이면 대화를 이어 붙일 준비 */
export function openRoom(st: GameState, room: Room) {
  st.unread[room] = 0;
  const p = st.pending[room];
  if (p) { p.opened = true; ensureSession(st, room, p); }
  refresh();
}

/** 불러오기 뒤에는 대화를 처음부터 빨리 감아 지금 선택지까지 온다 (효과는 다시 적용하지 않는다)
 *  업데이트로 대화가 바뀌었으면 고른 답장을 글로 찾고, 그래도 못 찾으면 그 대화는 벌점 없이 닫는다 */
function ensureSession(st: GameState, room: Room, p: PendingChat) {
  if (sessions.has(room)) return;
  if (!hasScene(p.id)) { drop(st, room); return; }
  const s = makePlayer(st, p.id, true);
  let v = s.player.next(), k = 0;
  while (v.mode !== 'done') {
    if (v.mode === 'choice') {
      if (k >= p.path.length) break;
      const texts = v.choices.map(c => c.text);
      const byText = p.picked?.[k] ? texts.indexOf(p.picked[k]) : -1;
      const i = byText >= 0 ? byText : p.path[k];
      if (i < 0 || i >= texts.length) { drop(st, room); return; }
      v = s.player.choose(i); k++;
    } else v = s.player.next();
  }
  s.player.setReplay(false);
  s.view = v;
  if (v.mode === 'done') { finish(st, room); return; }
  sessions.set(room, s);
}

/** 지금 고를 수 있는 답장 */
export function choicesOf(st: GameState, room: string): string[] {
  const p = st.pending[room];
  if (!p || !isRoom(room)) return [];
  ensureSession(st, room, p);
  const s = sessions.get(room);
  return s?.view.mode === 'choice' ? s.view.choices.map(c => c.text) : [];
}

let replying = false;
/** 답장을 고른다 → 내 말풍선 → 상대가 이어서 보낸다 */
export async function reply(st: GameState, room: Room, i: number) {
  const p = st.pending[room], s = sessions.get(room);
  if (!p || !s || s.view.mode !== 'choice' || replying) return;
  replying = true;
  try {
    (st.chats[room] ??= []).push({ from: 'me', text: s.view.choices[i].text, day: st.day });
    p.path.push(i);
    (p.picked ??= []).push(s.view.choices[i].text);
    p.opened = true;
    refresh();
    await sleep(350);
    const { end } = await run(st, room, s, s.player.choose(i), true);
    if (end === 'done') finish(st, room);
    saves.autosave();
  } finally { replying = false; ui.setTyping(null); refresh(); }
}

/* ---------- 사건 → 대화 ---------- */
/** key 를 기다리는 대화를 도착 예정에 올린다. 방마다 하나 (후보가 여럿이면 무작위) */
export function chatEvent(st: GameState, key: string, only?: Room) {
  const byRoom: Partial<Record<Room, ChatDef[]>> = {};
  for (const d of CHATS) {
    if (!d.on.includes(key) || (only && d.room !== only)) continue;
    if (!d.repeat && st.flags[`chat_${d.id}`]) continue;
    if (st.chatQueue.some(q => q.id === d.id) || st.pending[d.room]?.id === d.id) continue;
    if (isCharId(d.room) && (!st.met[d.room] || st.aff[d.room] < d.aff)) continue;
    if (d.cond && !evalCond(d.cond, ctxFor(st, d.room))) continue;
    (byRoom[d.room] ??= []).push(d);
  }
  for (const list of Object.values(byRoom)) {
    const d = list![Math.floor(Math.random() * list!.length)];
    st.chatQueue.push({ id: d.id, due: st.day + d.delay });
    if (!d.repeat) st.flags[`chat_${d.id}`] = true;
  }
}
onTrigger((st, key, { room }) => {
  // 질투 톡은 한 달에 한 번만
  if (key.startsWith('jealous:')) { const f = `jl_${key}_${st.turn}`; if (st.flags[f]) return; st.flags[f] = true; }
  chatEvent(st, key, room as Room | undefined);
});

/** 기한이 지난 대화 — 읽씹 · 안읽씹 */
function expire(st: GameState) {
  for (const [room, p] of Object.entries(st.pending) as [Room, PendingChat][]) {
    if (st.day - p.arrived < BALANCE.phone.deadline) continue;
    const rule = IGNORE[room][p.opened ? 'read' : 'unread'];
    if (isCharId(room) && rule.aff) st.aff[room] = clamp(st.aff[room] - rule.aff, 0, 100);
    if (rule.stress) st.stress = clamp(st.stress + rule.stress, 0, 100);
    const time = stamp(room, st.day);
    for (const l of rule.lines) {
      const sys = l.startsWith('"');
      st.chats[room].push(sys ? { from: 'sys', text: l.slice(1), day: st.day } : { from: 'them', text: l, time, day: st.day });
      if (!sys) st.unread[room] = (st.unread[room] ?? 0) + 1;
    }
    st.flags[`ignored_${room}`] = true;
    st.flags[`${p.opened ? 'readignore' : 'unreadignore'}_${room}`] = true;
    finish(st, room);
  }
}

/** 게임 속 하루가 지났다. interactive 면 도착 알림을 띄워 바로 볼 수 있게 한다 */
export async function dayTick(st: GameState, day: number, interactive: boolean) {
  st.day = Math.max(st.day, day);
  expire(st);
  const arrived: Room[] = [];
  for (const q of [...st.chatQueue].sort((a, b) => a.due - b.due)) {
    if (q.due > st.day || arrived.length >= BALANCE.phone.perDay) continue;
    const room = roomOf(q.id);
    if (st.pending[room] || arrived.includes(room) || !hasScene(q.id)) { if (!hasScene(q.id)) st.chatQueue.splice(st.chatQueue.indexOf(q), 1); continue; }
    st.chatQueue.splice(st.chatQueue.indexOf(q), 1);
    const n = await deliver(st, q.id);
    if (n) arrived.push(room);
  }
  refresh();
  if (!arrived.length) return;
  if (!interactive) { ui.toast(`새 메시지 · ${arrived.map(roomName).join(', ')}`); return; }
  for (const room of arrived) {
    const msgs = st.chats[room];
    const last = [...msgs].reverse().find(m => m.from === 'them');
    const go = await ui.notify({ room, name: roomName(room), time: last?.time ?? '', text: last?.photo ? '사진' : last?.text ?? '' });
    if (go) { openRoom(st, room); await ui.openChat(room); }
  }
}

/** 방학처럼 날짜를 건너뛸 때 */
export const skipTo = (st: GameState, day: number) => dayTick(st, day, false);

/** 줄거리 없이 한 줄만 남기는 알림 (방학 제안·약속 답장 등) */
export function pushMsg(st: GameState, room: string, text: string) {
  (st.chats[room] ??= []).push({ from: 'them', text, time: isRoom(room) ? stamp(room, st.day) : undefined, day: st.day });
  st.unread[room] = (st.unread[room] ?? 0) + 1;
}

/* ---------- 먼저 연락하기 ---------- */
export function topicsFor(st: GameState, c: CharId): { topic: Topic; ok: boolean; why?: string }[] {
  const has = (t: Topic) => hasScene(`call.${c}.${t}`);
  const out: { topic: Topic; ok: boolean; why?: string }[] = [];
  const add = (topic: Topic, why: string | null) => { if (has(topic)) out.push({ topic, ok: !why, why: why ?? undefined }); };
  add('hello', null);
  add('promise', st.aff[c] < 15 ? '조금 더 친해지면' : st.promiseNext.some(p => p.c === c) ? '이미 약속이 있다' : st.promiseNext.length >= 2 ? '주말이 꽉 찼다' : null);
  add('worry', st.stress < 50 ? '스트레스 50 이상일 때' : null);
  add('dream', !st.memories[`${c}1`] ? '그 사람의 전생 기억을 봐야' : null);
  return out;
}

export async function startCall(st: GameState, c: CharId, topic: Topic) {
  if (st.phoneTime <= 0 || st.pending[c] || replying) return;
  replying = true;
  try {
    st.phoneTime--;
    (st.chats[c] ??= []).push({ from: 'me', text: POLITE.includes(c) ? TOPICS[topic].polite : TOPICS[topic].text, time: stamp(c, st.day, '22:10'), day: st.day });
    refresh();
    const id = `call.${c}.${topic}`;
    const delay = HABIT[c].replyDelay;
    if (delay > 0) {
      st.chatQueue.push({ id, due: st.day + delay });
      st.chats[c].push({ from: 'sys', text: '읽음' });
      refresh();
      ui.toast(`${josa(CHARACTERS[c].name, '은/는')} 답이 늦는 편이다. 내일쯤 다시 보자.`);
      return;
    }
    await sleep(700);
    const n = await deliver(st, id, true);
    if (!n) st.chats[c].push({ from: 'sys', text: '읽음' });   // 읽씹당했다
    saves.autosave();
  } finally { replying = false; ui.setTyping(null); refresh(); }
}
