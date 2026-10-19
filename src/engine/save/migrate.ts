/* =========================================================
   세이브 호환 — 예전 세이브를 지금 게임에 맞게 고친다
   1) 버전 변환: 세이브 구조가 바뀔 때마다 MIGRATIONS 에 한 단계 추가하고 SAVE_VERSION 을 올린다
   2) 빈 칸 채우기: 새로 생긴 필드는 새 게임 기본값으로
   3) 내용 정리: 이름이 바뀐 id 는 따라가고(content/renames.ts), 없어진 장면·장소·일정은 정리한다
   이야기·설계를 고쳐도 세이브가 깨지지 않게 하는 곳. 엔진은 정리된 세이브만 받는다.
   ========================================================= */
import type { CharId, GameState, MetaState } from '../types';
import { CHAR_ORDER, isCharId } from '@/content/characters';
import { CAREERS, SUBJECT_LABEL } from '@/content/careers';
import { TURNS } from '@/content/calendar';
import { PLACES } from '@/content/places';
import { AFTER_SCHOOL, CLUBS, NIGHT } from '@/content/timetable';
import { RENAMES } from '@/content/renames';
import { DREAMS, hasScene, mainEventsOf } from '../story/library';
import { newState } from '../state';

/** 지금 세이브 구조 버전 */
export const SAVE_VERSION = 5;

type Raw = Record<string, any>;

/** 세이브 구조 변환 단계. to = 이 단계를 거치면 되는 버전. 오래된 것부터 차례로 적용된다 */
export const MIGRATIONS: { to: number; note: string; run(d: Raw): void }[] = [
  {
    to: 4, note: '전생 시대 기록 · 톡 답장 내용 기록',
    run(d) {
      d.era ??= 'joseon';
      for (const p of Object.values<Raw>(d.pending ?? {})) p.picked ??= [];
    },
  },
  {
    to: 5, note: '스타일 능력치 · 생활 기록(tally)',
    run(d) {
      // 스타일은 지금까지 사교·감성으로 꾸며 온 만큼 조금 얹어 시작한다
      if (d.stat && d.stat.style === undefined) d.stat.style = 10 + Math.floor(((d.stat.cha ?? 10) + (d.stat.sense ?? 10) - 20) * 0.2);
      d.tally ??= {};
    },
  },
];

const ROOMS = new Set<string>([...CHAR_ORDER, 'jiyu', 'mom']);
export const renamed = (map: Record<string, string>, id: string) => {
  let x = id;
  for (let i = 0; i < 10 && map[x]; i++) x = map[x];
  return x;
};
const isObj = (v: unknown): v is Raw => !!v && typeof v === 'object' && !Array.isArray(v);

export interface Migrated { state: GameState; notes: string[] }

/** 불러온 세이브 → 지금 게임이 쓸 수 있는 세이브 (원본은 건드리지 않는다) */
export function migrate(raw: unknown): Migrated {
  const notes: string[] = [];
  const d: Raw = isObj(raw) ? JSON.parse(JSON.stringify(raw)) : {};
  const from = Number(d.version) || 3;
  if (from > SAVE_VERSION) notes.push(`더 새 버전(${from})에서 만든 기록이에요. 일부가 맞지 않을 수 있어요`);
  for (const m of MIGRATIONS) if (from < m.to) { m.run(d); d.version = m.to; }

  // 빈 칸 채우기 — 모양이 다르면 기본값으로
  const base = newState(typeof d.name === 'string' ? d.name : '나') as unknown as Raw;
  for (const [k, v] of Object.entries(base)) {
    if (d[k] === undefined || (v !== null && d[k] !== null && typeof d[k] !== typeof v) || Array.isArray(v) !== Array.isArray(d[k])) d[k] = v;
    else if (isObj(v) && isObj(d[k]) && ['stat', 'skill', 'aff', 'mainStep', 'vacStage'].includes(k)) d[k] = { ...v, ...d[k] };
  }
  d.version = SAVE_VERSION;
  const st = d as unknown as GameState;
  notes.push(...sanitize(st));
  return { state: st, notes };
}

/** 지금 콘텐츠에 없는 id 를 정리하고 무엇을 고쳤는지 돌려준다 */
export function sanitize(st: GameState): string[] {
  const notes: string[] = [];
  const S = RENAMES.scenes, P = RENAMES.places, O = RENAMES.options;
  const dreamIds = new Set(DREAMS.map(x => x.id));
  const placeIds = new Set(PLACES.map(p => p.id));
  const note = (n: number, what: string) => { if (n) notes.push(`${what} ${n}개`); };

  // 인물별 기록 — 없는 인물 지우기
  for (const k of ['aff', 'mainStep', 'vacStage', 'met', 'sightings', 'promiseLog', 'presence'] as const) {
    const rec = st[k] as Raw;
    for (const c of Object.keys(rec)) if (!isCharId(c)) delete rec[c];
  }
  // 메인 이벤트 단계가 지금 이벤트 수보다 크면 끝으로
  for (const c of CHAR_ORDER) st.mainStep[c] = Math.max(0, Math.min(st.mainStep[c] ?? 0, mainEventsOf(c).length));

  // 꿈(전생 기억)
  let n = 0;
  for (const id of Object.keys(st.memories)) {
    const to = renamed(S, id);
    if (to !== id) { delete st.memories[id]; st.memories[to] = true; }
    if (!dreamIds.has(to)) { delete st.memories[to]; n++; }
  }
  note(n, '없어진 전생 기억');

  // 톡 플래그(한 번만 오는 톡)도 이름을 따라간다
  for (const f of Object.keys(st.flags)) {
    if (!f.startsWith('chat_')) continue;
    const to = renamed(S, f.slice(5));
    if (to !== f.slice(5)) { delete st.flags[f]; st.flags[`chat_${to}`] = true; }
  }

  // 메신저 — 방, 답장 대기, 도착 예정
  for (const k of ['chats', 'unread', 'pending'] as const) for (const r of Object.keys(st[k])) if (!ROOMS.has(r)) delete st[k][r];
  n = 0;
  for (const [room, p] of Object.entries(st.pending)) {
    p.id = renamed(S, p.id);
    p.path = Array.isArray(p.path) ? p.path : [];
    p.picked = Array.isArray(p.picked) ? p.picked : [];
    if (!hasScene(p.id)) { delete st.pending[room]; n++; }
  }
  note(n, '없어진 답장 대기 톡');
  const q = st.chatQueue.length;
  st.chatQueue = st.chatQueue.map(x => ({ ...x, id: renamed(S, x.id) })).filter(x => hasScene(x.id));
  note(q - st.chatQueue.length, '없어진 도착 예정 톡');

  // 주말 장소
  n = 0;
  for (const [id, v] of Object.entries(st.placeVisits)) {
    const to = renamed(P, id);
    delete st.placeVisits[id];
    if (placeIds.has(to)) st.placeVisits[to] = (st.placeVisits[to] ?? 0) + v; else n++;
  }
  note(n, '없어진 장소 기록');
  st.promiseNext = st.promiseNext.map(x => ({ ...x, place: renamed(P, x.place) })).filter(x => placeIds.has(x.place) && isCharId(x.c));
  for (const [c, id] of Object.entries(st.presence)) {
    const to = renamed(P, id as string);
    if (placeIds.has(to)) st.presence[c as CharId] = to; else delete st.presence[c as CharId];
  }

  // 평일 시간표 · 동아리
  const opts = [new Set(AFTER_SCHOOL.map(o => o.id)), new Set(NIGHT.map(o => o.id))];
  const fixRow = (row: (string | null)[] | null) => {
    if (!row) return { row, bad: 0 };
    let bad = 0;
    const out = Array.from({ length: 10 }, (_, i) => {
      const id = row[i] ? renamed(O, row[i]!) : null;
      if (id && !opts[i % 2].has(id)) { bad++; return null; }
      return id;
    });
    return { row: out, bad };
  };
  const tt = fixRow(st.timetable);
  st.timetable = tt.row ?? Array(10).fill(null);
  note(tt.bad, '없어진 시간표 일정');
  st.lastTimetable = fixRow(st.lastTimetable).row;
  if (st.club) {
    const to = renamed(O, st.club);
    if (CLUBS.some(c => c.id === to)) st.club = to;
    else { st.club = null; st.clubTerm = -1; notes.push('없어진 동아리 (다음 학기에 다시 고르기)'); }
  }

  // 진로 · 과목 · 시기
  for (const k of ['goal', 'goalHint', 'pastRole'] as const) if (st[k] && !(st[k]! in CAREERS)) st[k] = null;
  if (st.focus && !(st.focus in SUBJECT_LABEL)) st.focus = null;
  st.turn = Math.max(0, Math.min(Number(st.turn) || 0, TURNS.length - 1));
  return notes;
}

/** 회차 기록(도감·앨범)도 이름이 바뀐 장면을 따라간다. 없어진 것은 남겨 둔다 (다시 생길 수도 있어서) */
export function migrateMeta(m: MetaState): MetaState {
  const S = RENAMES.scenes;
  for (const id of Object.keys(m.memories)) { const to = renamed(S, id); if (to !== id) { delete m.memories[id]; m.memories[to] = true; } }
  for (const key of Object.keys(m.album)) {
    const [kind, id] = [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)];
    const map = kind === 'scene' ? S : kind === 'photo' ? RENAMES.photos : null;
    if (!map) continue;
    const to = renamed(map, id);
    if (to !== id) { delete m.album[key]; m.album[`${kind}:${to}`] = true; }
  }
  return m;
}
