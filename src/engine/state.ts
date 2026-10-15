/* =========================================================
   게임 상태 · 저장소
   - game.state 는 엔진이 직접 수정하는 평범한 객체
   - 수정 후 refresh() 를 부르면 화면이 다시 그려진다
   ========================================================= */
import type { CharId, Effect, GameState, MetaState, RouteId, Settings, StatKey } from './types';
import { BALANCE } from '@/config/balance';
import { ROUTES } from '@/content/routes';
import { CHAR_ORDER } from '@/content/characters';

const KEY = { auto: 'ehwa2_auto', slot: (i: number) => `ehwa2_slot${i}`, meta: 'ehwa2_meta', settings: 'ehwa2_settings' };
const SAVE_VERSION = 2;

function lsGet<T>(k: string): T | null { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
function lsDel(k: string) { try { localStorage.removeItem(k); } catch { /* 무시 */ } }

const zeroAff = () => Object.fromEntries(CHAR_ORDER.map(c => [c, 0])) as Record<CharId, number>;
const defaultMeta = (): MetaState => ({ memories: {}, endings: {}, plays: 0, clears: 0, lastName: '', lastRoute: 'med' });

export const game = {
  state: null as GameState | null,
  meta: { ...defaultMeta(), ...(lsGet<MetaState>(KEY.meta) ?? {}) } as MetaState,
  settings: { textSpeed: 1, fx: true, showSlots: true, ...(lsGet<Settings>(KEY.settings) ?? {}) } as Settings,
};

/* 화면 갱신 콜백 — store/game.ts 에서 연결 */
let onChange: () => void = () => {};
export const setChangeListener = (fn: () => void) => { onChange = fn; };
export const refresh = () => onChange();

export function S(): GameState {
  if (!game.state) throw new Error('게임이 시작되지 않았습니다');
  return game.state;
}

export function newState(name: string, route: RouteId): GameState {
  const R = ROUTES[route];
  const stat = { ...BALANCE.start.stat };
  for (const k in R.bonus) stat[k as StatKey] += R.bonus[k as StatKey]!;
  return {
    version: SAVE_VERSION, name, route, goal: route, turn: 0,
    hp: BALANCE.start.hp, stress: BALANCE.start.stress, money: BALANCE.start.money + R.bonusMoney,
    stat, aff: zeroAff(), encounterStep: zeroAff(), met: {}, memories: { self1: true }, flags: {},
    plan: [null, null, null, null, null], lastPlan: null,
    chats: {}, unread: {}, replies: {}, phoneStep: {}, newMemory: false, savedAt: Date.now(),
  };
}

export const hpMax = (st: GameState = S()) => Math.min(BALANCE.hpMax.cap, BALANCE.hpMax.base + Math.floor(st.stat.fit / BALANCE.hpMax.fitPerHp));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 스토리 선택지 등의 효과 적용 (보정 없음) */
export function applyEffect(e: Effect, st: GameState = S()) {
  for (const [k, v] of Object.entries(e.stat ?? {})) st.stat[k as StatKey] = Math.max(0, st.stat[k as StatKey] + v);
  for (const [k, v] of Object.entries(e.aff ?? {})) st.aff[k as CharId] = clamp(st.aff[k as CharId] + v, 0, 100);
  const r = e.res ?? {};
  if (r.hp) st.hp = clamp(st.hp + r.hp, 0, hpMax(st));
  if (r.stress) st.stress = clamp(st.stress + r.stress, 0, 100);
  if (r.money) st.money = Math.max(0, st.money + r.money);
  for (const f of e.flags ?? []) st.flags[f] = true;
}

/* ---------- 저장 ---------- */
export const saves = {
  autosave() { if (game.state) { game.state.savedAt = Date.now(); lsSet(KEY.auto, game.state); } },
  clearAuto() { lsDel(KEY.auto); },
  readAuto: () => lsGet<GameState>(KEY.auto),
  readSlot: (i: number) => lsGet<GameState>(KEY.slot(i)),
  writeSlot(i: number) { if (!game.state) return false; game.state.savedAt = Date.now(); return lsSet(KEY.slot(i), game.state); },
  saveMeta() { lsSet(KEY.meta, game.meta); },
  saveSettings() { lsSet(KEY.settings, game.settings); },
  wipeAll() {
    [KEY.auto, KEY.slot(1), KEY.slot(2), KEY.slot(3), KEY.meta].forEach(lsDel);
    game.meta = defaultMeta();
    game.state = null;
  },
};

/** 이전 버전 저장 데이터에 빠진 필드를 기본값으로 채운다 */
export function migrate(d: GameState): GameState {
  const base = newState(d.name ?? '나', d.route ?? 'med');
  return { ...base, ...d, stat: { ...base.stat, ...d.stat }, aff: { ...base.aff, ...d.aff }, encounterStep: { ...base.encounterStep, ...d.encounterStep } };
}

export function unlockMemory(id: string) {
  const st = S();
  const first = !st.memories[id];
  st.memories[id] = true;
  if (!game.meta.memories[id]) { game.meta.memories[id] = true; saves.saveMeta(); }
  return first;
}
export function recordEnding(id: string) {
  game.meta.endings[id] = true;
  saves.saveMeta();
}
