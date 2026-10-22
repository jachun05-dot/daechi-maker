/* =========================================================
   연애 규칙 — 관계 단계 · 열쇠 · 취향 · 소문 · 고백 조건 · 데이트 판정
   화면(장면·기록)을 띄우는 쪽은 engine/love.ts. 여기는 상태만 바꾸는 순수한 규칙.
   설계: docs/romance/README.md
   ========================================================= */
import type { Bond, CareerId, CharId, Effect, GameState, SkillKey, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { TURNS } from '@/content/calendar';
import { CAREERS } from '@/content/careers';
import { CHARACTERS, CHAR_ORDER, ROMANCEABLE } from '@/content/characters';
import { ROMANCE, STAGE, STAGES, stageOf, type DateStat, type Taste } from '@/content/romance';
import { SCENES } from './story/library';
import { emit } from './triggers';

const B = () => BALANCE.romance;
const yearOf = (st: GameState) => TURNS[Math.min(st.turn, TURNS.length - 1)].year;
export const bondOf = (st: GameState, c: CharId): Bond => st.bond[c];

/* ---------- 알림 — 엔진이 진행 기록·토스트로 내보낸다 (engine/love.ts flushNews) ---------- */
export interface RomanceNews { c: CharId; kind: 'stage' | 'key' | 'like'; text: string }
let NEWS: RomanceNews[] = [];
export const takeNews = () => { const n = NEWS; NEWS = []; return n; };

/* ---------- 하트 · 단계 ---------- */
export const hearts = (st: GameState, c: CharId) => Math.max(0, Math.min(5, Math.floor(st.aff[c] / B().hearts + 1e-9)));
export const stageName = (n: number) => STAGES[Math.max(0, Math.min(STAGES.length - 1, n))];

/** 단계 올리기 — 장면으로만 오른다. 사귀는 사람이 있으면 다른 사람은 친구까지 */
export function raiseStage(st: GameState, c: CharId, n: number) {
  const b = st.bond[c];
  if (st.lover && st.lover !== c && n >= STAGE.some) n = STAGE.friend;
  if (n === STAGE.lover && st.lover !== c) n = STAGE.some;     // 연인은 고백으로만
  if (n <= b.stage) return;
  b.stage = n;
  if (n > STAGE.met) NEWS.push({ c, kind: 'stage', text: `${CHARACTERS[c].name} · ${stageName(n)}` });   // 첫 만남은 장면이 이미 말해 준다
  emit(st, `stage:${c}`);
}
/** 메인 이벤트를 마쳤을 때 — 머리말 stage= 가 있으면 그 단계, 없으면 첫 만남 */
export function stageAfterMain(st: GameState, c: CharId, sceneId: string) {
  const v = SCENES[sceneId]?.attrs.stage;
  raiseStage(st, c, Math.max(STAGE.met, v ? stageOf(v) : STAGE.met));
}

/* ---------- 열쇠 ---------- */
/** 이야기 안에 실제로 들어 있는 열쇠 — 플롯을 다시 쓰는 동안은 열쇠가 없는 인물도 있다 */
let AVAILABLE: Record<string, Set<string>> | null = null;
function scanKeys() {
  const out: Record<string, Set<string>> = {};
  const add = (e: Effect) => { for (const k of [...(e.keys ?? []), ...(e.locks ?? [])]) { const [c, id] = k.split('.'); (out[c] ??= new Set()).add(id); } };
  const walk = (ns: StoryNode[]) => {
    for (const n of ns) {
      if (n.t === 'effect') add(n.eff);
      if (n.t === 'choice') for (const o of n.options) { add(o.eff); walk(o.body); }
      if (n.t === 'if') for (const b of n.branches) walk(b.body);
    }
  };
  for (const s of Object.values(SCENES)) walk(s.nodes);
  return out;
}
/** 이 인물에게 지금 이야기에 들어 있는 열쇠 (정의 순서) */
export function availableKeys(c: CharId) {
  AVAILABLE ??= scanKeys();
  const used = AVAILABLE[c] ?? new Set<string>();
  return ROMANCE[c].keys.filter(k => used.has(k.id));
}
export const keyTitle = (c: CharId, id: string) => ROMANCE[c].keys.find(k => k.id === id)?.title ?? id;
export const openKeys = (st: GameState, c: CharId) => st.bond[c].keys.length;
/** 진 엔딩 조건 — 이야기에 있는 열쇠를 전부 열었다 (열쇠가 없는 인물은 통과) */
export const allKeysOpen = (st: GameState, c: CharId) => availableKeys(c).every(k => st.bond[c].keys.includes(k.id));

export function openKey(st: GameState, c: CharId, id: string) {
  const b = st.bond[c];
  if (b.keys.includes(id) || b.locked.includes(id)) return;
  b.keys.push(id);
  NEWS.push({ c, kind: 'key', text: `🔑 ${CHARACTERS[c].name} — 속마음 하나가 열렸다 · ${keyTitle(c, id)}` });
  // 열쇠 뒤에 숨어 있던 취향이 드러난다
  for (const t of ROMANCE[c].tastes) if (t.after === id) discover(st, c, t.id);
  emit(st, `key:${c}`);
}
export function lockKey(st: GameState, c: CharId, id: string) {
  const b = st.bond[c];
  if (b.keys.includes(id) || b.locked.includes(id)) return;
  b.locked.push(id);
}

/* ---------- 취향 ---------- */
export const tasteOf = (c: CharId, id: string): Taste | undefined => ROMANCE[c].tastes.find(t => t.id === id);
export function discover(st: GameState, c: CharId, id: string) {
  const t = tasteOf(c, id), b = st.bond[c];
  if (!t || b.likes.includes(id)) return;
  if (t.after && !b.keys.includes(t.after)) return;
  b.likes.push(id);
  NEWS.push({ c, kind: 'like', text: `${CHARACTERS[c].name}의 취향 · ${t.label}` });
}
/** 그 사람이 좋아하는 곳 (숨은 곳은 열쇠를 연 뒤에) */
export const likedPlaces = (st: GameState, c: CharId) =>
  ROMANCE[c].tastes.filter(t => t.kind === 'place' && t.place && (!t.after || st.bond[c].keys.includes(t.after))).map(t => t.place!);

/** 스토리 효과 중 연애 부분 — state.applyEffect 가 부른다 */
export function applyRomance(st: GameState, e: Effect) {
  const split = (s: string) => s.split('.') as [CharId, string];
  for (const k of e.keys ?? []) { const [c, id] = split(k); if (st.bond[c]) openKey(st, c, id); }
  for (const k of e.locks ?? []) { const [c, id] = split(k); if (st.bond[c]) lockKey(st, c, id); }
  for (const [c, n] of Object.entries(e.stage ?? {})) if (st.bond[c as CharId]) raiseStage(st, c as CharId, n!);
  for (const k of e.likes ?? []) { const [c, id] = split(k); if (st.bond[c]) discover(st, c, id); }
}

/* ---------- 함께한 시간 · 소문 ---------- */
export const isSchool = (st: GameState, c: CharId) => {
  const s = ROMANCE[c].school, y = yearOf(st);
  return !!s && y >= s.from && y <= s.to;
};
/** 같이 시간을 보냈다 — 연인 소홀 판정 · 학교 안 인물이면 소문 */
export function spentTime(st: GameState, c: CharId, rumor: number) {
  const b = st.bond[c];
  b.lastSeen = st.day;
  delete st.flags[`neglect_${c}`];
  if (rumor > 0 && isSchool(st, c)) b.rumor += rumor;
}

/** 달마다 소문이 조금씩 가라앉는다 */
export function decayRumor(st: GameState) {
  for (const c of CHAR_ORDER) st.bond[c].rumor = Math.floor(st.bond[c].rumor * B().rumor.decay * 10) / 10;
}

/** 이번 달 질투할 사람 — 소문 난 학교 안 인물(who) 때문에, 가까운 다른 사람(by)이.
 *  by 는 연인이 먼저, 그다음 같은 학교에서 친구 이상인 사람 중 단계·호감이 높은 쪽 */
export function pickJealousy(st: GameState): { who: CharId; by: CharId } | null {
  const R = B().rumor;
  const whos = CHAR_ORDER.filter(c => st.met[c] && isSchool(st, c) && st.bond[c].rumor >= R.threshold)
    .sort((a, b) => st.bond[b].rumor - st.bond[a].rumor);
  for (const who of whos) {
    const bys = ROMANCEABLE.filter(c => c !== who && st.met[c] && st.bond[c].confess !== 'no' && st.turn >= st.bond[c].jealousUntil && st.bond[c].stage >= R.minStage && st.aff[c] >= R.minAff
      && (st.lover === c || isSchool(st, c)) && st.lover !== who)
      .sort((a, b) => Number(st.lover === b) - Number(st.lover === a) || st.bond[b].stage - st.bond[a].stage || st.aff[b] - st.aff[a]);
    if (bys.length) return { who, by: bys[0] };
  }
  return null;
}

/* ---------- 고백 ---------- */
const turnAt = ([y, m]: [number, number]) => TURNS.findIndex(t => t.year === y && t.month === m);
export const inConfessWindow = (st: GameState) => st.turn >= turnAt(B().confess.from) && st.turn <= turnAt(B().confess.to);
/** 고백할 수 있는 열쇠 수 — 이야기에 열쇠가 모자라면 있는 만큼만 */
export const keysForConfess = (c: CharId) => Math.min(B().confess.minKeys, availableKeys(c).length);
export function canConfess(st: GameState, c: CharId) {
  const b = st.bond[c], C = B().confess;
  if (!ROMANCEABLE.includes(c) || st.lover || !st.met[c] || b.stage !== STAGE.some) return false;
  if (b.confess === 'no' || b.confess === 'yes' || b.confess === 'broke') return false;
  if (b.confess === 'wait' && st.turn < b.waitUntil) return false;
  return inConfessWindow(st) && st.aff[c] >= C.minAff && openKeys(st, c) >= keysForConfess(c);
}
/** 고백을 받았다 — 사귀고, 다른 썸은 친구로 정리 */
export function becomeLovers(st: GameState, c: CharId): CharId[] {
  st.lover = c;
  const b = st.bond[c];
  b.confess = 'yes';
  b.stage = STAGE.lover;
  b.lastSeen = st.day;
  NEWS.push({ c, kind: 'stage', text: `${CHARACTERS[c].name} · 연인` });
  const ended = CHAR_ORDER.filter(x => x !== c && st.bond[x].stage === STAGE.some);
  for (const x of ended) st.bond[x].stage = STAGE.friend;
  emit(st, `stage:${c}`);
  return ended;
}
export function declineConfess(st: GameState, c: CharId) {
  const b = st.bond[c];
  b.confess = 'no';
  b.stage = STAGE.friend;
  st.aff[c] = Math.max(0, st.aff[c] - B().confess.decline);
}
export function waitConfess(st: GameState, c: CharId) {
  const b = st.bond[c];
  b.confess = 'wait';
  b.waitUntil = st.turn + B().confess.waitMonths;
}
export function breakUp(st: GameState, c: CharId) {
  const b = st.bond[c];
  if (st.lover === c) st.lover = null;
  b.confess = 'broke';
  b.stage = STAGE.friend;
  st.aff[c] = Math.max(0, st.aff[c] - B().neglect.breakAff);
}
/** 연인을 얼마나 못 봤는지 (게임 속 날짜) */
export const daysApart = (st: GameState) => (st.lover ? st.day - st.bond[st.lover].lastSeen : 0);

/* ---------- 데이트 판정 ---------- */
const LEVEL_NEED = (turn: number) => BALANCE.roll.base + turn * BALANCE.roll.perTurn;
const goalSkill = (st: GameState): SkillKey | 'cha' => {
  const g: CareerId | null = st.goal ?? st.goalHint ?? st.pastRole;
  return g ? CAREERS[g].skills[0] : 'cha';
};
/** 지금 데이트에서 보는 능력 */
export function dateStats(st: GameState, c: CharId): (Exclude<DateStat, 'goal'>)[] {
  const d = ROMANCE[c].date;
  const list = d.later && st.bond[c].keys.includes(d.later.after) ? d.later.stats : d.stats;
  return list.map(k => (k === 'goal' ? goalSkill(st) : k));
}
const valueOf = (st: GameState, k: string) => (k in st.stat ? st.stat[k as 'int'] : st.skill[k as SkillKey] ?? 0);
/** 대성공·실수 확률 — 평일 판정과 같은 모양 */
export function dateOdds(st: GameState, c: CharId, place: string, hpRatio: number) {
  const r = BALANCE.roll, D = B().date;
  const need = LEVEL_NEED(st.turn);
  const ks = dateStats(st, c);
  const lv = ks.reduce((a, k) => a + valueOf(st, k), 0) / Math.max(1, ks.length);
  const x = lv / need - 1;
  let great = r.great.base + r.great.slope * x, fail = r.fail.base - r.fail.slope * x;
  if (likedPlaces(st, c).includes(place)) great += D.star;
  if (st.stat.style >= need) great += D.style;
  if (hpRatio < 0.3) { fail += r.tired.fail; great += r.tired.great; }
  if (st.stress >= 70) fail += r.stressed.fail;
  const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  return { great: cl(great, r.great.min, r.great.max + D.star), fail: cl(fail, r.fail.min, r.fail.max) };
}
export type DateResult = 'great' | 'ok' | 'fail';
export function rollDate(odds: { great: number; fail: number }, rnd = Math.random()): DateResult {
  return rnd < odds.great ? 'great' : rnd < odds.great + odds.fail ? 'fail' : 'ok';
}
/** 데이트 결과를 기록하고 취향을 알아낸다 — 대성공이면 좋아하는 모습, 그 사람이 좋아하는 곳이면 그곳 */
export function recordDate(st: GameState, c: CharId, place: string, res: DateResult) {
  const b = st.bond[c];
  b.dates[res]++;
  if (res === 'great') for (const t of ROMANCE[c].tastes) if (t.kind === 'stat') discover(st, c, t.id);
  for (const t of ROMANCE[c].tastes) if (t.kind === 'place' && t.place === place) discover(st, c, t.id);
}
