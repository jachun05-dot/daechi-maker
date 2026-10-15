/* 스케줄 타입과 계산 */
import type { CharId, GameState, ResKey, StatKey } from './types';
import { BALANCE } from '@/config/balance';
import { SLOTS } from '@/content/schedule';
import { clamp, hpMax } from './state';

export type Delta = Partial<Record<StatKey | ResKey, number>>;

export interface ScheduleOption {
  id: string;
  name: string;
  place: string;
  bg: string;
  who?: CharId;
  delta: Delta;
  desc: string;
  logs: string[];
}
export interface Slot { key: string; label: string; time: string; options: ScheduleOption[] }

export const STAT_LABEL: Record<StatKey, string> = { int: '학업', art: '예술', sense: '감수성', cha: '화술', charm: '매력', spirit: '감응력', fit: '근력' };
export const STAT_FULL: Record<StatKey, string> = { int: '학업(지력)', art: '예술(음악)', sense: '감수성(연기)', cha: '화술·카리스마', charm: '매력', spirit: '전생 감응력', fit: '체력 단련(근력)' };
export const RES_LABEL: Record<ResKey, string> = { hp: '체력', stress: '스트레스', money: '용돈' };
export const STAT_KEYS = Object.keys(STAT_LABEL) as StatKey[];

export const getOption = (slot: number, id: string | null) => SLOTS[slot].options.find(o => o.id === id);

export function growthMult(st: GameState) {
  const g = BALANCE.growth;
  let m = st.stress >= g.stressHigh ? g.multHigh : st.stress >= g.stressMid ? g.multMid : 1;
  if (st.hp < g.lowHp) m *= g.multLowHp;
  return m;
}

/** 변화량을 적용하고 실제로 변한 값을 돌려준다. scaled=true면 성장 효율 보정 */
export function applyDelta(st: GameState, d: Delta, scaled = true): Delta {
  const out: Delta = {};
  const mult = scaled ? growthMult(st) : 1;
  for (const [k, raw] of Object.entries(d) as [keyof Delta, number][]) {
    let v = raw;
    if (k in STAT_LABEL) {
      if (v > 0) v = Math.max(1, Math.round(v * mult));
      st.stat[k as StatKey] = Math.max(0, st.stat[k as StatKey] + v);
    } else if (k === 'hp') { const b = st.hp; st.hp = clamp(st.hp + v, 0, hpMax(st)); v = st.hp - b; }
    else if (k === 'stress') { const b = st.stress; st.stress = clamp(st.stress + v, 0, 100); v = st.stress - b; }
    else if (k === 'money') { const b = st.money; st.money = Math.max(0, st.money + v); v = st.money - b; }
    out[k] = v;
  }
  return out;
}

export function planTotals(st: GameState) {
  let hp = 0, stress = 0, money = 0;
  st.plan.forEach((id, i) => { const o = getOption(i, id); if (o) { hp += o.delta.hp ?? 0; stress += o.delta.stress ?? 0; money += o.delta.money ?? 0; } });
  return { hp, stress, money };
}

/* ---------- 진로 ---------- */
export function careerFit(st: GameState, route: GameState['goal']) {
  const req = BALANCE.careers[route];
  let f = Infinity;
  for (const [k, v] of Object.entries(req)) f = Math.min(f, st.stat[k as StatKey] / v);
  return f;
}
export function careerResult(st: GameState): GameState['goal'] | 'none' {
  if (careerFit(st, st.goal) >= 1) return st.goal;
  const ok = (Object.keys(BALANCE.careers) as GameState['goal'][]).filter(k => careerFit(st, k) >= 1).sort((a, b) => careerFit(st, b) - careerFit(st, a));
  return ok[0] ?? 'none';
}

/* ---------- 꿈 맞춤 추천 ---------- */
const WEIGHTS: Record<GameState['goal'], Partial<Record<StatKey, number>>> = {
  med: { int: 1, spirit: 0.6 }, idol: { art: 1, charm: 0.8 }, actor: { sense: 1, charm: 0.8 }, ceo: { cha: 1, int: 0.7 },
};
export function recommendPlan(st: GameState): string[] {
  const W = WEIGHTS[st.goal];
  let hp = st.hp, stress = st.stress, money = st.money;
  return SLOTS.map(slot => {
    let best = slot.options[0], bestScore = -Infinity;
    for (const o of slot.options) {
      const d = o.delta;
      let sc = 0;
      for (const k of STAT_KEYS) sc += (d[k] ?? 0) * (W[k] ? W[k]! * 3 : 0.4);
      const nhp = hp + (d.hp ?? 0), nst = stress + (d.stress ?? 0), nmo = money + (d.money ?? 0);
      if (nmo < 0) sc -= 100;
      if (nhp < 30) sc -= (30 - nhp) * 2.2;
      if (nst > 65) sc -= (nst - 65) * 1.6;
      if (o.who && st.aff[o.who] > 0) sc += 2.5;
      sc += Math.random() * 2;
      if (sc > bestScore) { bestScore = sc; best = o; }
    }
    hp += best.delta.hp ?? 0; stress += best.delta.stress ?? 0; money += best.delta.money ?? 0;
    return best.id;
  });
}
