/* =========================================================
   주말 — 계획판에서 토·일 × (낮·저녁) 4칸을 채우고 출발
   - 약속: 호감도가 일정 이상인 인물이 연락해 온다. 수락하면 그 칸이 약속으로 고정
   - 흔적: 인물이 이번 주말 있는 장소를 누르면 흔적 한 줄 (이름은 안 보인다)
   - 단골: 같은 장소에 자주 가면 효율이 오르고 새 일정이 열린다
   - 날씨: 비·눈 오면 야외 효율이 떨어지고, 날씨 전용 장면이 나오기도 한다
   - 길거리 사건: 아무도 안 만난 칸에서 가끔 (stories/street/)
   ========================================================= */
import type { CharId, GameState, Season, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import type { Turn } from '@/content/calendar';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { PLACES, placeById, type Place, type PlaceAction } from '@/content/places';
import { WEEKEND_PLACES } from '@/content/presence';
import { CAREERS } from '@/content/careers';
import { INVITES, INVITE_REPLY, DECLINE_REPLY, MY_ACCEPT, MY_DECLINE, TRACES, WEATHER_ICON, WEATHER_LABEL, type Weather } from '@/content/weekend';
import { ui } from '@/store/ui';
import { applyDelta, growthMult, isBase, isSkill, topTalent, type Delta } from './timetable';
import { deltaChips } from './chips';
import { addAff, addSighting, hpMax, refresh, unlockAlbum } from './state';
import { getScene, hasScene, scenesWithPrefix } from './story/library';
import { evalCond, fill, josa } from './story/context';
import { dayOf, dayTick, pushMsg } from './phone';
import { emit } from './triggers';
import { basicMeet, logAff, nextMain, playMain } from './people';
import { slump } from './crisis';
import { checkMilestones, gainChips, snap } from './progress';
import type { MainEvent } from './story/library';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const W = () => BALANCE.weekend;

export const DAY_NAMES = ['토요일', '일요일'] as const;
export const SLOT_NAMES = ['낮', '저녁'] as const;
export const slotLabel = (i: number) => `${DAY_NAMES[i >> 1]} ${SLOT_NAMES[i & 1]}`;

/* ---------- 계획판 데이터 ---------- */
export interface Invite { id: string; c: CharId; place: string; slot: number; text: string; clash?: string; fixed?: boolean }
export interface SlotPick { place: string; action: number; cont?: boolean; invite?: string }
export type Plan = (SlotPick | null)[];
export interface WeekendSpec {
  title: string; sub: string; month: number;
  weather: [Weather, Weather];
  markers: string[]; visible: string[]; visited: string[];
  traces: Record<string, string[]>;
  invites: Invite[];
}
export interface WeekendResult { plan: Plan; accepted: string[] }

/* ---------- 순수 계산 (화면에서도 씀) ---------- */
export function regularLevel(st: GameState, place: string) {
  const v = st.placeVisits[place] ?? 0, [a, b] = W().regular;
  return v >= b ? 3 : v >= a ? 2 : 1;
}

/** 지도에 보이는가 */
export function placeVisible(st: GameState, p: Place, T: Turn, turn: number) {
  const o = p.open;
  if (!o) return true;
  if (o.turn !== undefined && turn < o.turn) return false;
  if (o.year !== undefined && T.year < o.year) return false;
  if (o.months && !o.months.includes(T.month)) return false;
  if (o.spirit !== undefined && st.stat.spirit < o.spirit) return false;
  return true;
}

export interface ActionView { a: PlaceAction; i: number; locked: string | null }
/** 이번 달 이 장소에서 보이는 일정 (단골 레벨이 모자라면 locked 에 이유) */
export function actionsOf(st: GameState, p: Place, month: number): ActionView[] {
  const lv = regularLevel(st, p.id);
  return p.actions
    .map((a, i) => ({ a, i, locked: a.unlock && lv < a.unlock ? `단골 Lv.${a.unlock}에 열림` : null }))
    .filter(x => !x.a.months || x.a.months.includes(month));
}

/** 칸 하나의 실제 변화량 (낮/저녁 배율·하루 종일 배율) — 성장 보정은 applyDelta 에서 */
export function scaledDelta(a: PlaceAction, regular = 1): Delta {
  const sc = a.long ? W().fullDay : W().halfDay;
  const out: Delta = {};
  for (const [k, v] of Object.entries(a.delta) as [keyof Delta, number][]) {
    let x = v * sc;
    if (k === 'money') x = Math.round(x > 0 ? x * regular : x);
    out[k] = x;
  }
  return out;
}

/** 하루 동선: 집 → 칸들 → 집. 구역이 바뀐 횟수 */
export function dayMoves(plan: Plan, day: number) {
  const route: string[] = [W().homeDistrict];
  for (const s of [0, 1]) {
    const p = plan[day * 2 + s];
    const d = p ? placeById(p.place)!.district : W().homeDistrict;
    if (d !== route[route.length - 1]) route.push(d);
  }
  if (route[route.length - 1] !== W().homeDistrict) route.push(W().homeDistrict);
  return { moves: route.length - 1, route };
}
export function travelCost(plan: Plan) {
  const m = dayMoves(plan, 0).moves + dayMoves(plan, 1).moves;
  return { moves: m, money: m * W().fare, hp: m * W().moveHp };
}

/** 빈 칸을 추천으로 채운다 */
export function recommendPlan(st: GameState, spec: WeekendSpec, plan: Plan): Plan {
  const out = [...plan];
  const want = new Set<string>(CAREERS[st.goal ?? topTalent(st)].skills);
  const used = new Set(out.filter(Boolean).map(p => p!.place));
  const tired = st.hp < hpMax(st) * 0.4;
  for (let i = 0; i < 4; i++) {
    if (out[i]) continue;
    let best: SlotPick | null = null, bestSc = -Infinity;
    for (const id of spec.visible) {
      const p = placeById(id)!;
      for (const { a, i: ai, locked } of actionsOf(st, p, spec.month)) {
        if (locked) continue;
        if (a.long && ((i & 1) === 1 || out[i + 1])) continue;
        let sc = 0;
        for (const [k, v] of Object.entries(a.delta)) {
          if (want.has(k)) sc += v * 6; else if (isBase(k) || isSkill(k)) sc += v * 1.5;
        }
        if (spec.markers.includes(id) && !used.has(id)) sc += 25;
        sc += (a.delta.hp ?? 0) * (1 - st.hp / hpMax(st)) * 1.5;
        sc -= (a.delta.stress ?? 0) * (st.stress / 100) * 2;
        if ((a.delta.money ?? 0) < 0 && st.money < 80_000) sc += (a.delta.money ?? 0) / 4000;
        if ((a.delta.money ?? 0) > 0 && st.money < 50_000) sc += 6;
        if (id === 'home') sc += tired ? 30 : -4;
        if (used.has(id)) sc -= 12;   // 주말 네 칸을 한 곳에서 보내지 않게
        if (p.outdoor && spec.weather[i >> 1] !== 'sun' && spec.weather[i >> 1] !== 'cloud') sc -= 3;
        if (a.long) sc *= 1.4;
        sc += Math.random();
        if (sc > bestSc) { bestSc = sc; best = { place: id, action: ai }; }
      }
    }
    if (!best) continue;
    out[i] = best;
    used.add(best.place);
    if (placeById(best.place)!.actions[best.action].long) out[i + 1] = { ...best, cont: true };
  }
  return out;
}

/* ---------- 이번 주말 준비 ---------- */
function rollWeather(season: Season): Weather {
  const p = W().weather[season], r = Math.random();
  let acc = 0;
  for (const w of ['rain', 'snow', 'cloud'] as const) { acc += p[w] ?? 0; if (r < acc) return w; }
  return 'sun';
}

/** 인물마다 이번 주말 있을 곳 한 군데 — 주가 시작될 때 정한다 (메신저 대화가 참고한다) */
export function computePresence(st: GameState, T: Turn, turn: number) {
  st.presence = {};
  for (const c of CHAR_ORDER) {
    const fixed = st.promiseNext.find(p => p.c === c);
    if (fixed) { st.presence[c] = fixed.place; continue; }
    const list = WEEKEND_PLACES[c][T.year].filter(id => placeVisible(st, placeById(id)!, T, turn));
    const all = WEEKEND_PLACES[c][T.year];
    const where = list.length ? pick(list) : all.length ? pick(all) : null;
    if (where) st.presence[c] = where;
  }
}
const presenceMap = (st: GameState) => {
  const at: Record<string, CharId[]> = {};
  for (const [c, p] of Object.entries(st.presence) as [CharId, string][]) (at[p] ??= []).push(c);
  return at;
};

function makeInvites(st: GameState, presence: Record<string, CharId[]>): Invite[] {
  const P = BALANCE.promise;
  const where = (c: CharId) => Object.keys(presence).find(k => presence[k].includes(c));
  // 메신저에서 이미 잡은 약속
  const fixed: Invite[] = st.promiseNext.map(f => ({ id: `fix_${f.c}`, c: f.c, place: f.place, slot: f.slot, text: '톡으로 잡은 약속', fixed: true }));
  const taken = fixed.map(f => f.slot);
  const free = [0, 1, 2, 3].filter(x => !taken.includes(x));
  if (!free.length) return fixed;
  const cands = CHAR_ORDER.filter(c => st.met[c] && st.aff[c] >= P.minAff && where(c) && !fixed.some(f => f.c === c) && Math.random() < P.chance)
    .sort(() => Math.random() - 0.5).slice(0, Math.max(0, P.maxPerWeek - fixed.length));
  const out: Invite[] = cands.map((c, n) => {
    const place = where(c)!, slot = free[Math.floor(Math.random() * free.length)];
    const name = placeById(place)!.name;
    const text = pick(INVITES[c]).replace('{when}', slotLabel(slot)).replace('{place}', name);
    return { id: `inv${n}_${c}`, c, place, slot, text: fill(text, { state: st, name: st.name, vars: {} }) };
  });
  // 이안·무진이 같은 주에 부르면 같은 시간이 겹치기도 한다 — 하나만 고를 수 있다
  const a = out.find(i => i.c === 'ian'), b = out.find(i => i.c === 'mujin');
  if (a && b && Math.random() < P.clashChance) {
    b.slot = a.slot;
    b.text = fill(pick(INVITES.mujin).replace('{when}', slotLabel(b.slot)).replace('{place}', placeById(b.place)!.name), { state: st, name: st.name, vars: {} });
  }
  for (const x of out) { const y = out.find(z => z !== x && z.slot === x.slot); if (y) x.clash = y.id; }
  return [...fixed, ...out];
}

/* =========================================================
   주말 실행
   ========================================================= */
export async function runWeekend(st: GameState, T: Turn, week: number, turn: number) {
  const presence = presenceMap(st);
  const mains: Record<string, MainEvent> = {};
  for (const c of CHAR_ORDER) {
    const e = nextMain(st, c);
    if (e && !e.auto && e.place && !mains[e.place] && placeVisible(st, placeById(e.place)!, T, turn)) mains[e.place] = e;
  }
  const weather: [Weather, Weather] = [rollWeather(T.season), rollWeather(T.season)];
  const invites = makeInvites(st, presence);
  for (const inv of invites) if (!inv.fixed) pushMsg(st, inv.c, inv.text);

  const visible = PLACES.filter(p => placeVisible(st, p, T, turn) || invites.some(i => i.place === p.id)).map(p => p.id);
  const newly = visible.filter(id => !st.flags[`seen_${id}`]);
  newly.forEach(id => { st.flags[`seen_${id}`] = true; });
  if (newly.length && turn > 0) ui.toast(`지도에 새 장소 · ${newly.map(id => placeById(id)!.name).join(', ')}`);

  const traces: Record<string, string[]> = {};
  // 흔적은 이미 만난 사람만 (처음 보는 사람은 "!" 첫 만남 이벤트로 나온다)
  for (const [place, cs] of Object.entries(presence)) { const known = cs.filter(c => st.met[c]); if (known.length) traces[place] = known.map(c => pick(TRACES[c])); }

  const r = await ui.planWeekend({
    title: `${T.label} · ${week + 1}주차 주말`, sub: '토·일 낮과 저녁, 어디로 갈까?', month: T.month,
    weather, markers: Object.keys(mains), visible, visited: PLACES.filter(p => st.placeVisits[p.id]).map(p => p.id),
    traces, invites,
  });

  // 약속 답장
  const P = BALANCE.promise;
  const promises: Record<number, CharId> = {};
  for (const inv of invites) {
    const log = (st.promiseLog[inv.c] ??= { kept: 0, broken: 0, declined: 0 });
    if (inv.fixed) { promises[inv.slot] = inv.c; continue; }
    if (r.accepted.includes(inv.id)) {
      promises[inv.slot] = inv.c;
      st.chats[inv.c].push({ from: 'me', text: MY_ACCEPT[inv.c] ?? '좋아. 갈게.', day: st.day }, { from: 'them', text: INVITE_REPLY[inv.c], day: st.day });
    } else {
      const lost = inv.clash && r.accepted.includes(inv.clash) ? P.conflict : P.decline;
      addAff(st, inv.c, -lost);
      log.declined++;
      st.chats[inv.c].push({ from: 'me', text: MY_DECLINE[inv.c] ?? '미안, 그날은 안 될 것 같아.', day: st.day }, { from: 'them', text: DECLINE_REPLY[inv.c], day: st.day });
      emit(st, `promise:declined:${inv.c}`);
    }
  }
  st.promiseNext = [];
  refresh();

  // 토·일을 한 화면에 — 요일 구분선 아래로 그날 한 일이 쌓인다
  const played = new Set<string>(), metNow = new Set<CharId>(), done = new Set<string>();
  ui.runOpen(`${T.label} · ${week + 1}주차 주말`, weather.map((w, i) => `${DAY_NAMES[i].slice(0, 1)} ${WEATHER_ICON[w]} ${WEATHER_LABEL[w]}`).join('  ·  '));
  const before = snap(st);
  for (let day = 0; day < 2; day++) {
    ui.runLog({ kind: 'day', title: DAY_NAMES[day], tag: `${WEATHER_ICON[weather[day]]} ${WEATHER_LABEL[weather[day]]}` });
    const { moves, route } = dayMoves(r.plan, day);
    if (moves) {
      const d = applyDelta(st, { money: -moves * W().fare, hp: moves * W().moveHp });
      ui.runLog({ title: '이동', body: route.join(' → '), chips: deltaChips(d), mark: '🚇' });
    }
    for (const s of [0, 1]) {
      const pickS = r.plan[day * 2 + s] ?? { place: 'home', action: 0 };
      if (pickS.cont) continue;
      await visitSlot(st, T, day * 2 + s, pickS, weather[day], { presence, mains, promises, played, metNow, done });
    }
    const w = weather[day];
    if (w === 'rain' || w === 'snow') emit(st, `weather:${w}`);
    await dayTick(st, dayOf(turn, week, 5 + day), true);
  }
  const total = gainChips(before, snap(st));
  if (total.length) ui.runLog({ title: '이번 주말', chips: total, tone: 'sum', mark: '週' });
  for (const m of checkMilestones(st)) ui.runLog({ kind: 'grade', title: m.title, body: m.body, mark: m.mark });
  refresh();
  await ui.runWait(week < 3 ? '다음 주' : '한 달 정리');
  ui.runClose();
}

interface Ctx {
  presence: Record<string, CharId[]>; mains: Record<string, MainEvent>; promises: Record<number, CharId>;
  played: Set<string>; metNow: Set<CharId>;
  /** 이번 주말에 이미 한 일 (같은 일을 또 하면 다른 문장) */
  done: Set<string>;
}

const AGAIN = ['같은 곳에서 한 번 더. 아까보다 손에 익었다.', '자리를 옮기지 않았다. 하던 걸 마저 했다.', '같은 곳, 다른 시간. 아까 못 본 것들이 보였다.'];

async function visitSlot(st: GameState, T: Turn, slot: number, sp: SlotPick, weather: Weather, x: Ctx) {
  const place = placeById(sp.place)!;
  const a = place.actions[sp.action] ?? place.actions[0];
  const lv = regularLevel(st, place.id);
  const regMult = W().regularMult[lv - 1];
  const bad = place.outdoor && (weather === 'rain' || weather === 'snow');
  const d = scaledDelta(a, regMult);
  const when = a.long ? DAY_NAMES[slot >> 1] + ' 하루' : slotLabel(slot);

  if ((d.money ?? 0) < 0 && st.money + d.money! < 0) {
    ui.runLog({ title: `${when} · ${place.name}`, body: '용돈이 모자라 그냥 돌아왔다.', tone: 'warn', mark: place.name[0] });
  } else {
    const got = applyDelta(st, d, growthMult(st) * regMult * (bad ? W().badWeather : 1));
    const key = `${place.id}:${sp.action}`;
    const notes = [x.done.has(key) ? pick(AGAIN) : a.line];
    x.done.add(key);
    if (bad) notes.push(weather === 'rain' ? '비 때문에 반은 처마 밑에 서 있었다.' : '눈발이 굵어져 일찍 접었다.');
    ui.runLog({ title: `${when} · ${place.name}`, tag: a.label + (lv > 1 ? ` · 단골 Lv.${lv}` : ''), body: notes.join(' '), chips: deltaChips(got), mark: place.name[0] });
  }
  st.placeVisits[place.id] = (st.placeVisits[place.id] ?? 0) + 1;
  st.flags[`v_${place.id}`] = true;
  const lv2 = regularLevel(st, place.id);
  if (lv2 > lv) {
    const opened = place.actions.filter(o => o.unlock === lv2).map(o => o.label);
    ui.runLog({ title: `${place.name} 단골 Lv.${lv2}`, body: `얼굴을 알아보는 사람이 생겼다.${opened.length ? ` 새 일정: ${opened.join(', ')}` : ' 이곳에서 얻는 게 늘어난다.'}`, mark: '★' });
  }
  refresh();

  // 장면을 보는 동안만 진행 화면을 숨긴다 (그날 기록은 그대로)
  const reopen = () => ui.runShow();
  let met = false;
  // 1. 메인 이벤트
  const main = x.mains[place.id];
  if (main && !x.played.has(main.id) && nextMain(st, main.ch as CharId)?.id === main.id) {
    x.played.add(main.id);
    ui.runHide(); await playMain(st, main, 'day', place.name); reopen();
    x.metNow.add(main.ch as CharId); met = true;
  }
  // 2. 약속
  const pc = x.promises[slot];
  if (pc) {
    ui.runHide(); await promiseMeet(st, pc, place, x.metNow.has(pc)); reopen();
    x.metNow.add(pc); met = true;
  }
  // 3. 출몰 — 이번 주말 아직 못 본 사람
  const here = (x.presence[place.id] ?? []).filter(c => st.met[c] && !x.metNow.has(c));
  if (!met && here.length) {
    const c = pick(here);
    const wid = `weather.${c}.${weather}`;
    ui.runHide();
    if (hasScene(wid)) await weatherMeet(st, c, place, wid);
    else await basicMeet(st, c, place.name, place.bg);
    reopen();
    x.metNow.add(c); met = true;
  }
  // 4. 길거리 사건
  if (!met && Math.random() < W().streetChance) {
    const pool = scenesWithPrefix(`street.${place.id}.`).filter(s =>
      !st.flags[`st_${s.id}`] && (!s.attrs.weather || s.attrs.weather === weather) && (!s.attrs.year || T.year >= Number(s.attrs.year)) && (!s.attrs.if || evalCond(s.attrs.if, { state: st, name: st.name, vars: {} })));
    if (pool.length) {
      const s = pick(pool);
      st.flags[`st_${s.id}`] = true;
      ui.runHide();
      await ui.playScene(s.id, { theme: 'day', bg: place.bg });
      ui.setTheme('day');
      reopen();
      ui.runLog({ title: s.attrs.title ?? '길에서 생긴 일', body: place.name, mark: '路' });
      refresh();
    }
  }
  if (st.stress >= 100) await slump(st);
}

/** 약속 — promise.{인물} 장면 한 줄 + 호감도 */
async function promiseMeet(st: GameState, c: CharId, place: Place, already: boolean) {
  const before = { ...st.aff };
  addAff(st, c, BALANCE.promise.aff);
  addSighting(st, c, place.name);
  (st.promiseLog[c] ??= { kept: 0, broken: 0, declined: 0 }).kept++;
  emit(st, `promise:kept:${c}`);
  if (!already) {
    const lead: StoryNode = { t: 'say', text: `약속한 ${place.name}. ${josa(CHARACTERS[c].name, '이/가')} 먼저 와 있었다.`, line: 0 };
    const nodes = hasScene(`promise.${c}`) ? [lead, pick(getScene(`promise.${c}`).nodes)] : [lead];
    await ui.playScene(nodes, { theme: 'day', bg: place.bg });
    ui.setTheme('day');
  }
  logAff(st, before, `${josa(CHARACTERS[c].name, '과/와')}의 약속`, c, place.name);
}

/** 날씨 전용 장면 — 기본 만남 대신, 호감도 조금 더 */
async function weatherMeet(st: GameState, c: CharId, place: Place, scene: string) {
  const before = { ...st.aff };
  addAff(st, c, BALANCE.affection.basic + 1);
  st.stat.spirit += BALANCE.affection.spiritOnMeet;
  addSighting(st, c, place.name);
  const lead: StoryNode = { t: 'say', text: `${place.name}에서 ${josa(CHARACTERS[c].name, '과/와')} 마주쳤다.`, line: 0 };
  unlockAlbum(`scene:${scene}`);
  emit(st, `meet:${c}`);
  await ui.playScene([lead, ...getScene(scene).nodes], { theme: 'day', bg: place.bg });
  ui.setTheme('day');
  logAff(st, before, `${josa(CHARACTERS[c].name, '을/를')} 만났다`, c, place.name);
}
