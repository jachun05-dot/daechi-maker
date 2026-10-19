/* =========================================================
   커리어 엔딩 판정 — 목록과 조건은 content/careerEndings.ts
   꿈 대성공 → 꿈 → 능력치·전생 엔딩(가장 잘 맞는 것) → 번아웃 → 아쉬운 엔딩 → 웃픈 엔딩 → 새내기
   ========================================================= */
import type { BaseStat, CareerId, GameState, SkillKey } from './types';
import { BASE_KEYS } from '@/content/careers';
import { CAREER_ENDINGS, type CareerEnding, type StatReq } from '@/content/careerEndings';
import { careerFit, isBase } from './timetable';

/** 엔딩 조건이 보는 3년의 기록 */
export interface Hist {
  v(k: BaseStat | SkillKey): number;
  t(key: string): number;
  visits(place: string): number;
  /** 가 본 서로 다른 장소 수 */
  places: number;
  money: number; stress: number;
  goal: CareerId | null; goalFit: number;
  past: CareerId | null;
  /** 가장 높은 기초 능력 (감응 제외 — 감응은 꿈과 만남으로 저절로 크게 자란다) */
  top: BaseStat;
  /** 감응을 뺀 기초 능력의 최대/최소, 그 비율 */
  maxBase: number; minBase: number; spread: number;
  /** 가장 높은 특기 */
  maxSkill: number;
}

export function hist(st: GameState): Hist {
  const v = (k: BaseStat | SkillKey) => (isBase(k) ? st.stat[k] : st.skill[k as SkillKey]);
  const life = BASE_KEYS.filter(k => k !== 'spirit').map(k => st.stat[k]);
  const maxBase = Math.max(...life), minBase = Math.min(...life);
  return {
    v, t: k => st.tally?.[k] ?? 0, visits: p => st.placeVisits[p] ?? 0,
    places: Object.values(st.placeVisits).filter(n => n > 0).length,
    money: st.money, stress: st.stress,
    goal: st.goal, goalFit: st.goal ? careerFit(st, st.goal) : 0, past: st.pastRole,
    top: BASE_KEYS.filter(k => k !== 'spirit').sort((a, b) => st.stat[b] - st.stat[a])[0],
    maxBase, minBase, spread: maxBase / Math.max(1, minBase),
    maxSkill: Math.max(...Object.values(st.skill)),
  };
}

const meets = (h: Hist, req?: StatReq) => !req || Object.entries(req).every(([k, n]) => h.v(k as BaseStat) >= n!);
const under = (h: Hist, max?: StatReq) => !max || Object.entries(max).every(([k, n]) => h.v(k as BaseStat) < n!);
/** 조건을 얼마나 넘었나 — 1 = 딱 맞음 */
const fitOf = (h: Hist, req?: StatReq) => {
  const r = Object.entries(req ?? {});
  return r.length ? r.reduce((s, [k, n]) => s + Math.min(2, h.v(k as BaseStat) / n!), 0) / r.length : 1;
};

export function eligible(e: CareerEnding, h: Hist) {
  return meets(h, e.req) && under(h, e.max) && (!e.need || e.need(h));
}

/** 판정 점수 — 높을수록 먼저. 꿈 > (아주 아깝게 놓친 꿈) > 다른 길·전생 > 번아웃 > 아쉬움 > 웃픈 > 새내기 */
function rank(e: CareerEnding, h: Hist): number {
  switch (e.kind) {
    case 'great': return 100;
    case 'dream': return 90;
    case 'stat': return 10 + fitOf(h, e.req);
    case 'past': return 10.2 + fitOf(h, e.req);
    // 정말 아깝게(92% 이상) 놓쳤으면 그 아쉬움이 다른 길보다 먼저 — "2점 차 재수"
    case 'near': return e.key === 'burnout' ? 6 : h.goalFit >= 0.92 ? 12 : 5 + h.goalFit;
    case 'fun': return 3 + fitOf(h, e.req) * 0.5;
    default: return 0;
  }
}

export interface CareerVerdict {
  ending: CareerEnding;
  /** 정한 꿈이 아닌 4대 진로를 이뤘을 때 'other' (꿈 장면에서 한 줄 바뀐다) */
  kind: 'dream' | 'other' | 'none';
  /** 이런 길도 열려 있었어요 — 함께 조건을 넘은 다른 엔딩 */
  also: CareerEnding[];
  /** 조금만 더 했으면 — 가장 가까웠던 못 연 엔딩 */
  close: CareerEnding[];
}

export function judgeCareer(st: GameState): CareerVerdict {
  const h = hist(st);
  const pool: CareerEnding[] = [];
  for (const e of CAREER_ENDINGS) {
    if (e.kind === 'great' || e.kind === 'dream') {
      // 정한 꿈을 이뤘으면 꿈, 다른 꿈의 관문을 넘었으면 그 꿈 엔딩(다른 길)
      const fit = careerFit(st, e.dream!);
      if (e.kind === 'great' ? st.goal === e.dream && fit >= 1.25 : fit >= 1) pool.push(e);
    } else if (e.kind !== 'base' && eligible(e, h)) pool.push(e);
  }
  // 정한 꿈이 아닌 4대 진로는 다른 길 점수로 내린다
  const score = (e: CareerEnding) => (e.kind === 'dream' && st.goal !== e.dream ? 10.5 + careerFit(st, e.dream!) : rank(e, h));
  pool.sort((a, b) => score(b) - score(a));
  const ending = pool[0] ?? CAREER_ENDINGS.find(e => e.kind === 'base')!;
  const kind = ending.kind === 'dream' || ending.kind === 'great' ? (st.goal === ending.dream ? 'dream' : 'other') : ending.kind === 'base' ? 'none' : 'other';
  const also = pool.filter(e => e !== ending && e.kind !== 'great').slice(0, 2);
  const close = CAREER_ENDINGS
    .filter(e => (e.kind === 'stat' || e.kind === 'past') && !pool.includes(e) && under(h, e.max) && (!e.need || e.need(h)) && e.req)
    .map(e => ({ e, f: Math.min(...Object.entries(e.req!).map(([k, n]) => h.v(k as BaseStat) / n!)) }))
    .filter(x => x.f >= 0.75).sort((a, b) => b.f - a.f).slice(0, 2).map(x => x.e);
  return { ending, kind, also, close };
}
