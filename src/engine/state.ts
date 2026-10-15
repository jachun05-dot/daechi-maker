/* =========================================================
   게임 상태 · 저장소
   - game.state 는 엔진이 직접 수정하는 평범한 객체
   - 수정 후 refresh() 를 부르면 화면이 다시 그려진다
   ========================================================= */
import type { BaseStat, CharId, Effect, GameState, MetaState, Settings, SkillKey } from './types';
import { BALANCE } from '@/config/balance';
import { CHAR_ORDER } from '@/content/characters';
import { SKILL_KEYS } from '@/content/careers';

const KEY = { auto: 'ehwa3_auto', slot: (i: number) => `ehwa3_slot${i}`, meta: 'ehwa3_meta', settings: 'ehwa3_settings' };
const SAVE_VERSION = 3;

function lsGet<T>(k: string): T | null { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : null; } catch { return null; } }
function lsSet(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } }
function lsDel(k: string) { try { localStorage.removeItem(k); } catch { /* 무시 */ } }

const perChar = <T,>(f: () => T) => Object.fromEntries(CHAR_ORDER.map(c => [c, f()])) as Record<CharId, T>;
const defaultMeta = (): MetaState => ({ memories: {}, endings: {}, plays: 0, clears: 0, lastName: '' });

export const game = {
  state: null as GameState | null,
  meta: { ...defaultMeta(), ...(lsGet<MetaState>(KEY.meta) ?? {}) } as MetaState,
  settings: { textSpeed: 1, fx: true, showSlots: true, ...(lsGet<Settings>(KEY.settings) ?? {}) } as Settings,
  /** 한 달이 진행 중이면 true — 이때는 자동 저장하지 않는다 (달 시작 시점으로만 저장) */
  midMonth: false,
};

/* 화면 갱신 콜백 — store/game.ts 에서 연결 */
let onChange: () => void = () => {};
export const setChangeListener = (fn: () => void) => { onChange = fn; };
export const refresh = () => onChange();

export function S(): GameState {
  if (!game.state) throw new Error('게임이 시작되지 않았습니다');
  return game.state;
}

export function newState(name: string): GameState {
  return {
    version: SAVE_VERSION, name, turn: 0,
    hp: BALANCE.start.hp, stress: BALANCE.start.stress, money: BALANCE.start.money,
    stat: { ...BALANCE.start.stat },
    skill: Object.fromEntries(SKILL_KEYS.map(k => [k, 0])) as Record<SkillKey, number>,
    goal: null, goalHint: null, pastRole: null,
    aff: perChar(() => 0), met: {}, mainStep: perChar(() => 0), vacStage: perChar(() => ({ summer: 0, winter: 0 })),
    sightings: {}, memories: { self1: true }, flags: {},
    timetable: Array(10).fill(null), lastTimetable: null, club: null, clubTerm: -1, focus: null,
    chats: {}, unread: {}, replies: {}, phoneStep: {}, newMemory: false, savedAt: Date.now(),
  };
}

export const hpMax = (st: GameState = S()) => Math.min(BALANCE.hpMax.cap, BALANCE.hpMax.base + Math.floor(st.stat.fit / BALANCE.hpMax.fitPerHp));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 호감도 변화 — 이안·무진은 한쪽이 오르면 다른 쪽이 질투한다 */
export function addAff(st: GameState, c: CharId, v: number) {
  st.aff[c] = clamp(st.aff[c] + v, 0, 100);
  if (v > 0 && (c === 'ian' || c === 'mujin')) {
    const other: CharId = c === 'ian' ? 'mujin' : 'ian';
    if (st.met[other]) st.aff[other] = clamp(st.aff[other] - BALANCE.affection.jealousy, 0, 100);
  }
}

/** 스토리 선택지 등의 효과 적용 (보정 없음) */
export function applyEffect(e: Effect, st: GameState = S()) {
  for (const [k, v] of Object.entries(e.stat ?? {})) st.stat[k as BaseStat] = Math.max(0, st.stat[k as BaseStat] + v);
  for (const [k, v] of Object.entries(e.skill ?? {})) st.skill[k as SkillKey] = Math.max(0, st.skill[k as SkillKey] + v);
  for (const [k, v] of Object.entries(e.aff ?? {})) addAff(st, k as CharId, v);
  const r = e.res ?? {};
  if (r.hp) st.hp = clamp(st.hp + r.hp, 0, hpMax(st));
  if (r.stress) st.stress = clamp(st.stress + r.stress, 0, 100);
  if (r.money) st.money = Math.max(0, st.money + r.money);
  for (const f of e.flags ?? []) st.flags[f] = true;
}

/* ---------- 저장 ---------- */
export const saves = {
  autosave() { if (game.state && !game.midMonth) { game.state.savedAt = Date.now(); lsSet(KEY.auto, game.state); } },
  clearAuto() { lsDel(KEY.auto); },
  readAuto: () => lsGet<GameState>(KEY.auto),
  readSlot: (i: number) => lsGet<GameState>(KEY.slot(i)),
  writeSlot(i: number) { if (!game.state || game.midMonth) return false; game.state.savedAt = Date.now(); return lsSet(KEY.slot(i), game.state); },
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
  const base = newState(d.name ?? '나');
  return {
    ...base, ...d,
    stat: { ...base.stat, ...d.stat }, skill: { ...base.skill, ...d.skill },
    aff: { ...base.aff, ...d.aff }, mainStep: { ...base.mainStep, ...d.mainStep }, vacStage: { ...base.vacStage, ...d.vacStage },
  };
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
export function addSighting(st: GameState, c: CharId, place: string) {
  const list = (st.sightings[c] ??= []);
  if (!list.includes(place)) list.push(place);
}
