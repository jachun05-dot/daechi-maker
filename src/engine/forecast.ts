/* =========================================================
   시간표 예측 · 추천 · 이달의 목표
   - forecastMonth: 지금 시간표로 한 달을 미리 돌려 본다 (실제 진행과 같은 weekdayStep 사용)
     주말은 "하루는 집에서 쉰다"고 보고 계산한다
   - recommendTimetable: 프리셋(공부·재능·균형·회복)대로 짜고, 예산·체력 안에 들어오게 고친다
   - monthGoal: 이번 달 말 이벤트까지 무엇이 얼마나 필요한지
   ========================================================= */
import type { CareerId, GameState } from './types';
import type { Chip } from '@/store/ui';
import { BALANCE } from '@/config/balance';
import { TURNS, type Turn } from '@/content/calendar';
import { CAREERS, BASE_LABEL, SKILL_LABEL } from '@/content/careers';
import { placeById } from '@/content/places';
import { applyDelta, careerFit, clubAt, findOption, isBase, isSkill, optionsFor, topTalent, bestCareers, type TimetableOption } from './timetable';
import { hpMax } from './state';
import { weekdayStep } from './weekday';
import { gainChips, reqMet, shown, snap } from './progress';

export interface Forecast {
  hpEnd: number; hpMin: number; hpMax: number; stressEnd: number; moneyEnd: number;
  doze: number; collapse: number; broke: number; strain: number;
  gains: Chip[]; intEnd: number;
}

/** 지금(또는 주어진) 시간표로 한 달을 미리 돌려 본다 — 상태는 바꾸지 않는다 */
export function forecastMonth(st: GameState, timetable: (string | null)[] = st.timetable): Forecast {
  const sim: GameState = JSON.parse(JSON.stringify(st));
  sim.timetable = [...timetable];
  const rest = placeById('home')?.actions[0].delta ?? { hp: 18, stress: -10 };
  const f: Forecast = { hpEnd: 0, hpMin: sim.hp, hpMax: hpMax(sim), stressEnd: 0, moneyEnd: 0, doze: 0, collapse: 0, broke: 0, strain: 0, gains: [], intEnd: 0 };
  let streak = 0;
  for (let w = 0; w < 4; w++) {
    for (let d = 0; d < 5; d++) {
      const { res, heavyStreak } = weekdayStep(sim, d, streak);
      streak = heavyStreak;
      if (res.school !== 'ok') f.doze++;
      if (res.collapse) f.collapse++;
      if (res.strain) f.strain++;
      f.broke += res.slots.filter(s => s.state === 'broke').length;
      f.hpMin = Math.min(f.hpMin, sim.hp);
    }
    // 주말 — 하루는 집에서 쉰다고 본다 (낮·저녁 두 칸)
    for (let k = 0; k < 2; k++) applyDelta(sim, rest, BALANCE.weekend.halfDay);
  }
  Object.assign(f, { hpEnd: sim.hp, stressEnd: sim.stress, moneyEnd: sim.money, intEnd: sim.stat.int, gains: gainChips(snap(st), snap(sim), { res: false }) });
  return f;
}

/* ---------- 추천 ---------- */
export type Preset = 'study' | 'talent' | 'balance' | 'rest';
export const PRESETS: { id: Preset; label: string; desc: string }[] = [
  { id: 'study', label: '공부', desc: '시험·지성 위주' },
  { id: 'talent', label: '재능', desc: '꿈(후보)의 특기 위주' },
  { id: 'balance', label: '균형', desc: '고르게 · 무리 없이' },
  { id: 'rest', label: '회복', desc: '체력·스트레스 회복' },
];

const ACADEMIC = new Set(['int', 'science', 'language']);
function score(st: GameState, o: TimetableOption, preset: Preset, want: Set<string>) {
  let sc = 0;
  for (const [k, v] of Object.entries(o.delta) as [string, number][]) {
    if (k === 'hp') sc += v * (preset === 'rest' ? 1.2 : st.hp < hpMax(st) * 0.5 ? 0.5 : 0.1);
    else if (k === 'stress') sc -= v * (preset === 'rest' ? 1.2 : st.stress > 60 ? 0.6 : 0.15);
    else if (k === 'money') sc += v / (st.money < 60_000 ? 6000 : 20000);
    else if (!(isBase(k) || isSkill(k))) continue;
    else if (preset === 'study') sc += v * (k === 'int' ? 7 : ACADEMIC.has(k) ? 3 : 0.4);
    else if (preset === 'talent') sc += v * (want.has(k) ? 7 : 1);
    else if (preset === 'balance') sc += v * (isBase(k) ? 3 : want.has(k) ? 3 : 1.2);
    else sc += v * 0.5;
  }
  return sc + Math.random() * 0.3;
}

/** 프리셋대로 시간표를 짠 뒤, 돈이 모자라거나 쓰러질 것 같으면 무거운·비싼 칸부터 바꾼다 */
export function recommendTimetable(st: GameState, preset: Preset = 'talent', target: CareerId = st.goal ?? st.goalHint ?? topTalent(st)): (string | null)[] {
  // 꿈의 마지막 관문에 필요한 것 전부 (특기 + 기초 능력 — 배우는 감성, 리더는 사교도 필요하다)
  const want = new Set<string>([...CAREERS[target].skills, ...Object.keys(BALANCE.careers[target])]);
  const out: (string | null)[] = Array(10).fill(null);
  for (let d = 0; d < 5; d++) for (const s of [0, 1] as const) {
    if (clubAt(st, d, s)) continue;
    const opts = optionsFor(s).filter(o => o.days.includes(d) && reqMet(st, o.req));
    out[d * 2 + s] = opts.sort((a, b) => score(st, b, preset, want) - score(st, a, preset, want))[0].id;
  }
  // 고치기: 쓰러짐·졸음이 많으면 가장 무거운 칸을 쉬기로, 돈이 모자라면 가장 비싼 칸을 무료 일정으로
  // 돈이 모자랄 때 바꿔 넣을 후보 — 무료 일정과 돈 버는 일정(알바)
  const free = (s: 0 | 1, d: number) => optionsFor(s).filter(o => o.days.includes(d) && reqMet(st, o.req) && !(o.delta.money! < 0));
  const earn = (o: TimetableOption) => (o.delta.money ?? 0) > 0 ? 4 : 0;
  for (let k = 0; k < 12; k++) {
    const f = forecastMonth(st, out);
    const tooTired = f.collapse > 0 || f.doze > (preset === 'rest' ? 0 : 4) || f.stressEnd >= 85;
    const tooPoor = f.broke > 0 || f.moneyEnd < 20_000;
    if (!tooTired && !tooPoor) break;
    const cells = out.map((id, i) => ({ i, o: id ? findOption((i % 2) as 0 | 1, id) : undefined })).filter(x => x.o);
    if (tooPoor) {
      const c = cells.filter(x => (x.o!.delta.money ?? 0) < 0).sort((a, b) => a.o!.delta.money! - b.o!.delta.money!)[0];
      // 방과후 칸은 알바로 돌려 돈을 벌고, 아니면 가장 비싼 칸을 무료 일정으로
      const job = cells.find(x => x.i % 2 === 0 && (x.o!.delta.money ?? 0) <= 0 && free(0, x.i >> 1).some(o => (o.delta.money ?? 0) > 0));
      if (job && f.moneyEnd < 0) { out[job.i] = free(0, job.i >> 1).sort((a, b) => score(st, b, preset, want) + earn(b) - score(st, a, preset, want) - earn(a))[0].id; continue; }
      if (c) { const alt = free((c.i % 2) as 0 | 1, c.i >> 1).sort((a, b) => score(st, b, preset, want) + earn(b) - score(st, a, preset, want) - earn(a))[0]; if (alt) { out[c.i] = alt.id; continue; } }
    }
    if (tooTired) {
      const c = cells.filter(x => x.o!.heavy).sort((a, b) => (a.o!.delta.hp ?? 0) - (b.o!.delta.hp ?? 0))[0];
      if (!c) break;
      out[c.i] = c.i % 2 ? 'rest' : 'home';
    } else break;
  }
  return out;
}

/** 두드러진 재능이 생겼나 (처음엔 모든 특기가 0이라 '재능' 추천이 의미가 없다) */
export const hasTalent = (st: GameState) => !!(st.goal ?? st.goalHint) || Math.max(...Object.values(st.skill)) >= 8;

/* ---------- 이달의 목표 ---------- */
export interface Goal { title: string; lines: string[]; ratio?: number; tone?: 'good' | 'warn' }

const examDen = (turn: number) => BALANCE.exam.base + turn * BALANCE.exam.perTurn;
/** 이 지성으로 시험을 보면 */
export function examTier(st: GameState, int: number, turn = st.turn) {
  const mult = st.focus && st.focus !== 'arts' ? 1 + BALANCE.exam.focusBonus : 1;
  const ratio = (int * mult) / examDen(turn);
  const tiers = BALANCE.exam.tiers;
  const i = tiers.findIndex(t => ratio >= t.min);
  const next = i > 0 ? tiers[i - 1] : null;
  return { tier: tiers[i], ratio, next, need: next ? Math.max(1, Math.ceil((next.min * examDen(turn)) / mult - int)) : 0 };
}

export function monthGoal(st: GameState, T: Turn, f: Forecast | null): Goal {
  const intEnd = f?.intEnd ?? st.stat.int;
  switch (T.event) {
    case 'exam': {
      const e = examTier(st, intEnd);
      return {
        title: `이달 말 ${T.title.split(' · ')[0]}`, ratio: Math.min(1, e.ratio / 1.5), tone: e.tier.tier === 'top' || e.tier.tier === 'high' ? 'good' : 'warn',
        lines: [`예상 성적 · ${e.tier.rank}`, e.next ? `${e.next.rank}까지 지성 +${e.need}` : '이대로면 전교 1등이다.', st.focus && st.focus !== 'arts' ? '학업 집중 과목 보너스 적용 중' : '집중 과목을 학업 과목으로 고르면 시험 보너스'],
      };
    }
    case 'sports': {
      const need = Math.ceil(BALANCE.sports.base + st.turn * BALANCE.sports.perTurn);
      const fit = shown(st.stat.fit);
      return { title: '이달 말 체육대회', ratio: Math.min(1, fit / need), tone: fit >= need ? 'good' : 'warn', lines: [`근력 ${fit} / 우승하려면 ${need}`, fit >= need ? '이대로면 우리 반이 이긴다.' : '체육관 운동·운동부로 근력을 올리자.'] };
    }
    case 'festival': {
      const look = st.stat.style * BALANCE.festival.styleBonus;
      const pairs: [string, number][] = [['밴드 공연', (st.skill.vocal + st.skill.dance) / 2 + look], ['연극 무대', (st.skill.acting + st.skill.voice) / 2 + look], ['축제 MC', (st.skill.debate + st.skill.language) / 2]];
      const [stage, sc] = pairs.sort((a, b) => b[1] - a[1])[0];
      const need = Math.ceil(BALANCE.festival.base + st.turn * BALANCE.festival.perTurn);
      return { title: '이달 말 이화제', ratio: Math.min(1, sc / need), tone: sc >= need ? 'good' : 'warn', lines: [`무대 · ${stage} (실력 ${Math.floor(sc)} / 성공하려면 ${need})`, '가장 자란 특기로 무대에 선다.'] };
    }
    case 'counsel': {
      if (T.year === 1) return { title: '이달 말 진로 상담', lines: [`지금 가장 자라는 재능 · ${CAREERS[topTalent(st)].short}`, '상담에서 꿈의 후보로 언급된다.'] };
      const top = bestCareers(st).slice(0, 2);
      return { title: '이달 말 진로 상담 — 꿈을 정한다', lines: top.map(c => `${CAREERS[c].short} 적합도 ${Math.floor(Math.min(1, careerFit(st, c)) * 100)}%`) };
    }
    case 'suneung': {
      const r = intEnd / BALANCE.suneung.intFull;
      return { title: '이달 대학수학능력시험', ratio: Math.min(1, r), tone: r >= 1 ? 'good' : 'warn', lines: [`지성 ${shown(intEnd)} / 만족스러운 결과 ${BALANCE.suneung.intFull}`] };
    }
  }
  // 이벤트 없는 달 — 다음 이벤트와 꿈의 관문
  const next = TURNS.slice(st.turn + 1).find(t => t.event);
  const lines: string[] = [];
  if (next) {
    const gap = TURNS.indexOf(next) - st.turn;
    lines.push(`${gap === 1 ? '다음 달' : `${gap}달 뒤`} ${next.title}`);
    if (next.event === 'exam') { const e = examTier(st, intEnd, TURNS.indexOf(next)); lines.push(`지금 페이스면 ${e.tier.rank}${e.next ? ` · ${e.next.rank}까지 지성 +${e.need}` : ''}`); }
  }
  return { title: '이달의 목표', lines: [...lines, ...careerLines(st)] };
}

/** 꿈(또는 후보)의 마지막 관문까지 */
export function careerLines(st: GameState): string[] {
  const c = st.goal ?? st.goalHint;
  if (!c) return [];
  const req = BALANCE.careers[c];
  const lack = Object.entries(req).map(([k, v]) => {
    const now = isBase(k) ? st.stat[k] : isSkill(k) ? st.skill[k] : 0;
    return { k, gap: Math.ceil(v! - now) };
  }).filter(x => x.gap > 0).sort((a, b) => b.gap - a.gap);
  const name = (k: string) => (BASE_LABEL as Record<string, string>)[k] ?? (SKILL_LABEL as Record<string, string>)[k];
  return [`${st.goal ? '꿈' : '꿈 후보'} · ${CAREERS[c].short} 관문 ${Math.floor(Math.min(1, careerFit(st, c)) * 100)}%${lack.length ? ` (가장 모자란 것: ${name(lack[0].k)} −${lack[0].gap})` : ' · 통과!'}`];
}
