/* 평일 시간표 · 스탯 계산 · 진로 적합도 */
import type { BaseStat, CareerId, CharId, GameState, ResKey, SkillKey } from './types';
import { BALANCE } from '@/config/balance';
import { AFTER_SCHOOL, NIGHT, CLUBS } from '@/content/timetable';
import { BASE_LABEL, CAREERS, CAREER_ORDER, SKILL_LABEL } from '@/content/careers';
import { clamp, hpMax } from './state';

export type Delta = Partial<Record<BaseStat | SkillKey | ResKey, number>>;

export interface TimetableOption {
  id: string; name: string; place: string; days: number[]; delta: Delta; desc: string;
  heavy?: boolean; who?: CharId;
}
export interface Club {
  id: string; name: string; days: number[]; delta: Delta; desc: string;
  who?: CharId; whoYears?: number[];
}

export const SLOT_LABEL = ['방과후', '야간'] as const;
export const SLOT_TIME = ['16~19시', '19~23시'] as const;
export const optionsFor = (slot: 0 | 1) => (slot === 0 ? AFTER_SCHOOL : NIGHT);
export const findOption = (slot: 0 | 1, id: string | null) => optionsFor(slot).find(o => o.id === id);
export const findClub = (id: string | null) => CLUBS.find(c => c.id === id);

/** 이 칸이 동아리로 고정돼 있으면 그 동아리 */
export function clubAt(st: GameState, day: number, slot: 0 | 1) {
  const c = findClub(st.club);
  return slot === 0 && c && c.days.includes(day) ? c : undefined;
}

/** 시간표가 다 찼는지 (동아리 칸 제외) */
export function timetableReady(st: GameState) {
  for (let d = 0; d < 5; d++) for (const s of [0, 1] as const) {
    if (clubAt(st, d, s)) continue;
    const o = findOption(s, st.timetable[d * 2 + s]);
    if (!o || !o.days.includes(d)) return false;
  }
  return true;
}

export const isBase = (k: string): k is BaseStat => k in BASE_LABEL;
export const isSkill = (k: string): k is SkillKey => k in SKILL_LABEL;

export function growthMult(st: GameState) {
  const g = BALANCE.growth;
  return st.stress >= g.stressHigh ? g.multHigh : st.stress >= g.stressMid ? g.multMid : 1;
}

/** 변화량을 적용하고 실제로 변한 값을 돌려준다. 성장(양수 스탯·특기)에는 mult × 전체 배율(growth.scale)을 곱한다 */
export function applyDelta(st: GameState, d: Delta, mult = 1): Delta {
  const out: Delta = {};
  for (const [k, raw] of Object.entries(d) as [keyof Delta, number][]) {
    let v = raw;
    if (isBase(k)) { if (v > 0) v *= mult * BALANCE.growth.scale; st.stat[k] = Math.max(0, st.stat[k] + v); }
    else if (isSkill(k)) { if (v > 0) v *= mult * BALANCE.growth.scale; st.skill[k] = Math.max(0, st.skill[k] + v); }
    else if (k === 'hp') { const b = st.hp; st.hp = clamp(st.hp + v, 0, hpMax(st)); v = st.hp - b; }
    else if (k === 'stress') { const b = st.stress; st.stress = clamp(st.stress + v, 0, 100); v = st.stress - b; }
    else if (k === 'money') { const b = st.money; st.money = Math.max(0, st.money + v); v = st.money - b; }
    out[k] = (out[k] ?? 0) + v;
  }
  return out;
}
export function addDelta(a: Delta, b: Delta) {
  for (const [k, v] of Object.entries(b) as [keyof Delta, number][]) a[k] = (a[k] ?? 0) + v;
  return a;
}

/** 한 달 예상 변화 (시간표만, 수업·보정 제외) */
export function monthPreview(st: GameState) {
  const total: Delta = {};
  for (let d = 0; d < 5; d++) for (const s of [0, 1] as const) {
    const c = clubAt(st, d, s);
    const o = c ?? findOption(s, st.timetable[d * 2 + s]);
    if (o) for (let w = 0; w < 4; w++) addDelta(total, o.delta);
  }
  for (const k of Object.keys(total) as (keyof Delta)[]) if ((isBase(k) || isSkill(k)) && total[k]! > 0) total[k]! *= BALANCE.growth.scale;
  return total;
}

/* ---------- 진로 ---------- */
const value = (st: GameState, k: BaseStat | SkillKey) => (isBase(k) ? st.stat[k] : st.skill[k]);

/** 0~1+ — 1 이상이면 마지막 관문 통과 */
export function careerFit(st: GameState, c: CareerId) {
  let f = Infinity;
  for (const [k, v] of Object.entries(BALANCE.careers[c])) f = Math.min(f, value(st, k as BaseStat) / v);
  return f;
}
export const bestCareers = (st: GameState) => [...CAREER_ORDER].sort((a, b) => careerFit(st, b) - careerFit(st, a));

/** 엔딩 커리어 판정: 꿈을 이룸 / 다른 길 / 아직 찾는 중 */
export function careerResult(st: GameState): { career: CareerId | 'none'; kind: 'dream' | 'other' | 'none' } {
  if (st.goal && careerFit(st, st.goal) >= 1) return { career: st.goal, kind: 'dream' };
  const other = bestCareers(st).find(c => careerFit(st, c) >= 1);
  return other ? { career: other, kind: 'other' } : { career: 'none', kind: 'none' };
}

/** 지금 가장 잘 자라는 재능 (꿈 후보 · 전생 공개용) */
export function topTalent(st: GameState): CareerId {
  const score = (c: CareerId) => CAREERS[c].skills.reduce((a, s) => a + st.skill[s], 0);
  return [...CAREER_ORDER].sort((a, b) => score(b) - score(a))[0];
}

/* ---------- 시간표 추천 ---------- */
export function recommendTimetable(st: GameState): (string | null)[] {
  const target = st.goal ?? topTalent(st);
  const want = new Set<string>([...CAREERS[target].skills]);
  const result: (string | null)[] = Array(10).fill(null);
  let heavyRun = 0;
  for (let d = 0; d < 5; d++) {
    for (const s of [0, 1] as const) {
      if (clubAt(st, d, s)) continue;
      const opts = optionsFor(s).filter(o => o.days.includes(d));
      let best = opts[0], bestScore = -Infinity;
      for (const o of opts) {
        let sc = 0;
        for (const [k, v] of Object.entries(o.delta)) {
          if (want.has(k)) sc += v * 6;
          else if (isBase(k) || isSkill(k)) sc += v * 1.5;
        }
        if ((o.delta.money ?? 0) < 0 && st.money < 100_000) sc += (o.delta.money ?? 0) / 5000;
        if (o.heavy && heavyRun >= 2) sc -= 4;
        if (o.id === 'rest' || o.id === 'home') sc += st.hp < hpMax(st) * 0.5 ? 4 : 0.5;
        sc += Math.random() * 0.5;
        if (sc > bestScore) { bestScore = sc; best = o; }
      }
      result[d * 2 + s] = best.id;
    }
    const heavyToday = [0, 1].some(s => findOption(s as 0 | 1, result[d * 2 + s])?.heavy || (s === 0 && clubAt(st, d, 0)));
    heavyRun = heavyToday ? heavyRun + 1 : 0;
  }
  return result;
}
