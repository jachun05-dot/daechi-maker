/* =========================================================
   게임 상태 · 저장소
   - game.state 는 엔진이 직접 수정하는 평범한 객체
   - 수정 후 refresh() 를 부르면 화면이 다시 그려진다
   - 저장·불러오기는 save/ (저장 위치는 platform/storage.ts)
   ========================================================= */
import type { BaseStat, Bond, CharId, Effect, GameState, MetaState, Settings, SkillKey } from './types';
import { BALANCE } from '@/config/balance';
import { CHAR_ORDER } from '@/content/characters';
import { SKILL_KEYS } from '@/content/careers';
import { ERA } from '@/content/eras';
import { SAVE_VERSION } from './save/migrate';
import { saves } from './save';
import { applyRomance } from './romance';

export { saves };

const perChar = <T,>(f: () => T) => Object.fromEntries(CHAR_ORDER.map(c => [c, f()])) as Record<CharId, T>;
export const newBond = (): Bond => ({ stage: 0, keys: [], locked: [], likes: [], rumor: 0, confess: 'none', waitUntil: 0, lastSeen: 0, dates: { great: 0, ok: 0, fail: 0 }, jealousUntil: 0 });
export const defaultMeta = (): MetaState => ({ memories: {}, album: {}, endings: {}, plays: 0, clears: 0, lastName: '' });
export const defaultSettings = (): Settings => ({ textSpeed: 1, fx: true, showSlots: true });

/** 저장된 기록은 시작할 때 save/loadPersisted() 가 채운다 */
export const game = {
  state: null as GameState | null,
  meta: defaultMeta(),
  settings: defaultSettings(),
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
    version: SAVE_VERSION, era: ERA.id, name, turn: 0,
    hp: BALANCE.start.hp, stress: BALANCE.start.stress, money: BALANCE.start.money,
    stat: { ...BALANCE.start.stat },
    skill: Object.fromEntries(SKILL_KEYS.map(k => [k, 0])) as Record<SkillKey, number>,
    goal: null, goalHint: null, pastRole: null,
    aff: perChar(() => 0), met: {}, bond: perChar(newBond), lover: null, mainStep: perChar(() => 0), vacStage: perChar(() => ({ summer: 0, winter: 0 })),
    sightings: {}, memories: { self1: true }, flags: {},
    timetable: Array(10).fill(null), lastTimetable: null, club: null, clubTerm: -1, focus: null,
    chats: {}, unread: {}, pending: {}, chatQueue: [], day: 0, phoneTime: BALANCE.phone.callsPerMonth, presence: {}, promiseNext: [], newMemory: false, placeVisits: {}, promiseLog: {}, tally: {}, savedAt: Date.now(),
  };
}

export const hpMax = (st: GameState = S()) => Math.min(BALANCE.hpMax.cap, BALANCE.hpMax.base + Math.floor(st.stat.fit / BALANCE.hpMax.fitPerHp));
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** 앨범에 기록 (회차를 넘어 남는다) */
export function unlockAlbum(key: string) {
  if (game.meta.album[key]) return;
  game.meta.album[key] = true;
  saves.saveMeta();
}

/** 호감도(♥) 변화 — 질투는 자동 감점 대신 소문 사건으로 (engine/romance.ts) */
export function addAff(st: GameState, c: CharId, v: number) {
  st.aff[c] = clamp(st.aff[c] + v, 0, 100);
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
  applyRomance(st, e);
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
