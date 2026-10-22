/* =========================================================
   평일 — 시간표대로 월~금을 하루씩 진행 (학교 → 방과후 → 야간)
   - 일정마다 판정: 대성공 · 성공 · 실수 (주 능력 대비 그달 기준, 컨디션, 몰입·리듬)
   - 몰입: 같은 칸에 같은 일정 3일째부터 · 리듬: 하루에 할 일 + 쉬는 일
   - 학교 사건(멈추지 않음)과 작은 선택(잠깐 멈춤)이 한 주에 1~2번씩
   - weekdayStep 은 화면 없이 하루를 계산한다. roll=false 면 확률 대신 기대값 — 시간표 예측(forecast.ts)이 쓴다
   숫자는 config/balance.ts 의 weekday · drowsy · school · roll · dayEvents
   ========================================================= */
import type { BaseStat, CharId, GameState, SkillKey } from './types';
import { BALANCE } from '@/config/balance';
import { DAY_LABEL, type Turn } from '@/content/calendar';
import { SCHOOL_PEOPLE } from '@/content/presence';
import { BASE_LABEL, SKILL_LABEL, SUBJECT_LABEL } from '@/content/careers';
import { WEEK_LINES } from '@/content/timetable';
import { ROLLS, catOf } from '@/content/rolls';
import { CHOICES, SCHOOL, type ChoiceEvent, type SchoolEvent } from '@/content/dayEvents';
import { ui, type LiveDay, type WeekDayView } from '@/store/ui';
import { applyDelta, clubAt, findClub, findOption, growthMult, isBase, isSkill, type Club, type Delta, type TimetableOption } from './timetable';
import { hpMax, refresh } from './state';
import { dayOf, dayTick } from './phone';
import { basicMeet } from './people';
import { bump, checkMilestones, gainChips, month, snap, styleNow, tally } from './progress';
import { shortMoney } from './chips';
import { setClock } from './clock';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const R = () => BALANCE.roll;

/* ---------- 흐름 (요일을 넘어 이어지는 것) ---------- */
export interface Flow {
  heavy: number;
  /** 칸별(방과후·야간) 같은 일정 연속 일수 */
  streak: { id: string | null; n: number }[];
  /** 어제 리듬이 좋았다 */
  rhythm: boolean;
  /** 어젯밤 선택의 영향 */
  next: 'doze' | 'fresh' | null;
}
export const newFlow = (): Flow => ({ heavy: 0, streak: [{ id: null, n: 0 }, { id: null, n: 0 }], rhythm: false, next: null });

export type SlotState = 'great' | 'ok' | 'fail' | 'broke' | 'collapse' | 'empty' | 'skip';
export interface SlotResult { id: string | null; name: string; cat: string; state: SlotState; club: boolean; immerse: boolean; line?: string; gains: string[] }
export interface DayResult { school: 'ok' | 'doze' | 'sleep'; slots: SlotResult[]; collapse: boolean; strain: boolean; rhythm: boolean }

/** 이 일정에서 가장 많이 오르는 능력 — 판정 기준 */
function mainKey(o: TimetableOption | Club): BaseStat | SkillKey | null {
  let best: string | null = null, v = 0;
  for (const [k, x] of Object.entries(o.delta)) if ((isBase(k) || isSkill(k)) && x! > v) { best = k; v = x!; }
  return best as BaseStat | SkillKey | null;
}
export const levelNeed = (turn: number) => R().base + turn * R().perTurn;

/** 대성공·실수 확률 */
export function rollOdds(st: GameState, o: TimetableOption | Club, flow: Flow, immerse: boolean) {
  const r = R();
  if (catOf(o.id) === 'rest') return { great: r.restGreat, fail: 0 };
  const k = mainKey(o);
  const lv = k ? (isBase(k) ? st.stat[k] : st.skill[k as SkillKey]) : levelNeed(st.turn);
  const x = lv / levelNeed(st.turn) - 1;
  let great = r.great.base + r.great.slope * x, fail = r.fail.base - r.fail.slope * x;
  if (st.hp < hpMax(st) * 0.3) { fail += r.tired.fail; great += r.tired.great; }
  if (st.stress >= 70) fail += r.stressed.fail;
  if (flow.next === 'doze') fail += r.doze;
  if (flow.next === 'fresh') great += r.fresh;
  if (immerse) great += r.immerse.great;
  if (flow.rhythm) great += r.rhythm.great;
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
  return { great: clamp(great, r.great.min, r.great.max), fail: clamp(fail, r.fail.min, r.fail.max) };
}

const LABEL: Record<string, string> = { ...BASE_LABEL, ...SKILL_LABEL };
/** 그 칸에서 오른 것 — 소수점 대신 화살표 (대성공 ▲▲ · 보통 ▲ · 실수 △) */
function gainLabels(got: Delta, state: SlotState) {
  const arrow = state === 'great' ? '▲▲' : state === 'fail' ? '△' : '▲';
  const out = Object.entries(got).filter(([k, v]) => (isBase(k) || isSkill(k)) && v! > 0).map(([k]) => `${LABEL[k]}${arrow}`);
  if (got.money && Math.abs(got.money) >= 1000) out.push(`용돈 ${shortMoney(got.money)}`);
  return out;
}

/** 하루 — st 와 flow 를 바꾸고 무슨 일이 있었는지 돌려준다. roll=false 면 기대값으로 (예측용) */
export function weekdayStep(st: GameState, day: number, flow: Flow, opts: { roll: boolean; skip?: [boolean, boolean] } = { roll: true }): DayResult {
  const W = BALANCE.weekday, D = BALANCE.drowsy, SC = BALANCE.school, r = R();
  // 학교 — 피로해도 무조건 간다. 체력이 낮거나 밤을 샜으면 졸아서 덜 오른다
  const ratio = st.hp / hpMax(st);
  let eff = st.hp <= 0 ? D.zero : ratio < D.lowRatio ? D.low : D.normal;
  if (flow.next === 'doze') eff = Math.min(eff, D.low);
  const school: Delta = { int: SC.int, hp: W.schoolHp };
  if (st.focus) {
    school.int = (school.int ?? 0) + SC.focusInt;
    for (const sk of BALANCE.subjectSkills[st.focus]) school[sk] = (school[sk] ?? 0) + SC.focusSkill / BALANCE.subjectSkills[st.focus].length;
  }
  applyDelta(st, school, eff * growthMult(st));
  const res: DayResult = { school: eff >= 1 ? 'ok' : eff > D.zero ? 'doze' : 'sleep', slots: [], collapse: false, strain: false, rhythm: false };

  if (st.hp <= 0) {
    // 쓰러져 잠듦 — 그날 일정은 날아간다
    res.collapse = true;
    applyDelta(st, { hp: W.collapseRecover });
    for (const slot of [0, 1] as const) {
      const o = clubAt(st, day, slot) ?? findOption(slot, st.timetable[day * 2 + slot]);
      res.slots.push({ id: o?.id ?? null, name: o?.name ?? '', cat: catOf(o?.id ?? null), state: 'collapse', club: false, immerse: false, gains: [] });
      flow.streak[slot] = { id: null, n: 0 };
    }
    flow.heavy = 0;
  } else {
    let heavyToday = false, worked = false, rested = false;
    for (const slot of [0, 1] as const) {
      const club = clubAt(st, day, slot);
      const o = club ?? findOption(slot, st.timetable[day * 2 + slot]);
      const base = { id: o?.id ?? null, name: o?.name ?? '', cat: catOf(o?.id ?? null), club: !!club, immerse: false, gains: [] as string[] };
      if (!o) { res.slots.push({ ...base, state: 'empty' }); continue; }
      if (opts.skip?.[slot]) { res.slots.push({ ...base, state: 'skip' }); flow.streak[slot] = { id: null, n: 0 }; continue; }
      if ((o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0) { res.slots.push({ ...base, state: 'broke' }); continue; }
      const sk = flow.streak[slot];
      flow.streak[slot] = sk.id === o.id ? { id: o.id, n: sk.n + 1 } : { id: o.id, n: 1 };
      const immerse = flow.streak[slot].n >= r.immerse.days;
      const odds = rollOdds(st, o, flow, immerse);
      const rest = base.cat === 'rest';
      let state: SlotState = 'ok', mult: number;
      if (opts.roll) {
        const x = Math.random();
        state = x < odds.great ? 'great' : x < odds.great + odds.fail ? 'fail' : 'ok';
        mult = rest ? 1 : r.mult[state as 'great' | 'ok' | 'fail'];
      } else mult = rest ? 1 : odds.great * r.mult.great + odds.fail * r.mult.fail + (1 - odds.great - odds.fail) * r.mult.ok;
      const got = applyDelta(st, o.delta, growthMult(st) * mult * (immerse ? r.immerse.mult : 1));
      // 판정의 덤 — 쉬는 일정의 꿀잠, 대성공·실수의 기분
      const p = opts.roll ? (state === 'great' ? 1 : 0) : odds.great, q = opts.roll ? (state === 'fail' ? 1 : 0) : odds.fail;
      if (rest) applyDelta(st, { hp: r.restBonus.hp * p, stress: r.restBonus.stress * p });
      else applyDelta(st, { stress: r.greatStress * p + r.failStress * q });
      bump(st, `o:${o.id}`);
      if (opts.roll && state !== 'ok') bump(st, state === 'great' ? 'rollGreat' : 'rollFail');
      const lines = ROLLS[o.id]?.[state === 'great' ? 'great' : 'fail'] ?? [];
      res.slots.push({ ...base, state, immerse, line: state !== 'ok' && lines.length ? pick(lines) : undefined, gains: gainLabels(got, state) });
      if (club || (o as { heavy?: boolean }).heavy) heavyToday = true;
      if (rest) rested = true; else worked = true;
    }
    flow.heavy = heavyToday ? flow.heavy + 1 : 0;
    if (flow.heavy >= W.heavyStreak) { applyDelta(st, { hp: W.heavyStreakHp }); res.strain = true; }
    res.rhythm = worked && rested;
    if (res.rhythm) applyDelta(st, { stress: r.rhythm.stress });
  }
  flow.rhythm = res.rhythm;
  flow.next = null;
  applyDelta(st, { hp: W.nightRegen });
  return res;
}

/* =========================================================
   한 주 진행 — 화면에서 하루씩
   ========================================================= */
/** 사건 숫자는 화면에 보이는 그대로 오른다 (성장 배율을 곱하지 않는다) */
const applyRaw = (st: GameState, d: Delta) => applyDelta(st, d, 1 / BALANCE.growth.scale);

/** 이번 주 사건이 일어날 요일 — 학교 사건과 선택은 다른 날로 */
function planDays([n, extra]: [number, number], taken: Set<number>) {
  const count = n + (Math.random() < extra ? 1 : 0);
  const free = [0, 1, 2, 3, 4].filter(d => !taken.has(d)).sort(() => Math.random() - 0.5).slice(0, count);
  free.forEach(d => taken.add(d));
  return new Set(free);
}
/** 덜 본 사건일수록 잘 나온다 */
function pickEvent<T extends { id: string }>(st: GameState, list: T[], key: string): T | null {
  if (!list.length) return null;
  const w = list.map(e => 1 / (1 + tally(st, `${key}:${e.id}`) * 2));
  let x = Math.random() * w.reduce((a, b) => a + b, 0);
  for (let i = 0; i < list.length; i++) { x -= w[i]; if (x <= 0) return list[i]; }
  return list[list.length - 1];
}
const passCheck = (st: GameState, e: SchoolEvent) => {
  if (!e.check) return true;
  const v = isBase(e.check) ? st.stat[e.check] : st.skill[e.check as SkillKey];
  return Math.random() < Math.max(0.15, Math.min(0.9, 0.5 + (v / levelNeed(st.turn) - 1) * 0.4));
};
const hintOf = (d?: Delta) => Object.entries(d ?? {}).filter(([, v]) => v).map(([k, v]) =>
  k === 'money' ? `용돈 ${shortMoney(v!)}` : `${k === 'hp' ? '체력' : k === 'stress' ? '스트레스' : LABEL[k]} ${v! > 0 ? '+' : '−'}${Math.abs(v!)}`).join(' · ');

export async function runWeekdays(st: GameState, T: Turn, week: number, incidents: Set<string>, flow: Flow) {
  const before = snap(st);
  const taken = new Set<number>();
  const choiceDays = planDays(BALANCE.dayEvents.choice, taken);
  const schoolDays = planDays(BALANCE.dayEvents.school, taken);
  flow.streak = [{ id: null, n: 0 }, { id: null, n: 0 }];   // 주말이 끼면 몰입은 다시 처음부터

  const live: LiveDay[] = DAY_LABEL.map((label, d) => ({
    label, school: 'wait', tags: [],
    slots: ([0, 1] as const).map(s => {
      const o = clubAt(st, d, s) ?? findOption(s, st.timetable[d * 2 + s]);
      return { id: o?.id ?? null, name: o?.name ?? '', cat: catOf(o?.id ?? null), state: 'wait' as const };
    }),
  }));
  ui.weekOpen({ title: `${week + 1}주차 평일`, tag: st.focus ? `집중 과목 · ${SUBJECT_LABEL[st.focus]}` : '집중 과목 없음', days: live, cur: null, choice: null });

  const days: DayResult[] = [];
  const met: (string | null)[] = [];
  for (let day = 0; day < 5; day++) {
    // 1) 작은 선택 — 그날 일정 전에
    const skip: [boolean, boolean] = [false, false];
    if (choiceDays.has(day)) {
      const ev = pickEvent(st, CHOICES.filter(c => !c.when || c.when(st, T)), 'ch');
      if (ev) {
        ui.weekPatch(w => { w.cur = { day, slot: ev.slot }; });
        await ui.pace(300);
        const i = await ui.weekChoice({ icon: ev.icon, title: ev.title, text: ev.text, day, options: ev.options.map(o => ({ label: o.label, hint: [hintOf(o.eff), o.skip ? `${ev.slot ? '야간' : '방과후'} 일정 빠짐` : '', o.next === 'doze' ? '다음 날 졸음' : o.next === 'fresh' ? '다음 날 개운' : ''].filter(Boolean).join(' · ') })) });
        applyChoice(st, ev, i, skip, flow, day);
      }
    }
    // 2) 하루 계산 → 칸마다 하나씩 보여 준다
    const r = weekdayStep(st, day, flow, { roll: true, skip });
    days.push(r);
    ui.weekPatch(w => { w.days[day] = { ...w.days[day], school: r.school }; w.cur = { day, slot: 0 }; });
    for (const s of [0, 1]) {
      // 하는 중 — 도트가 그 일정을 잠깐 하다가 (판정은 아직)
      if (r.slots[s].id && !['skip', 'empty', 'broke', 'collapse'].includes(r.slots[s].state)) {
        ui.weekPatch(w => { w.cur = { day, slot: s }; });
        await ui.pace(R().doing);
      }
      ui.weekPatch(w => { w.cur = { day, slot: s }; w.days[day] = { ...w.days[day], slots: w.days[day].slots.map((x, k) => (k === s ? { ...x, ...r.slots[s] } : x)) }; });
      refresh();
      await ui.pace(r.slots[s].state === 'great' || r.slots[s].state === 'fail' ? 850 : 450);
    }
    const tags = [r.collapse && '쓰러짐', r.school !== 'ok' && '졸음', r.strain && '피로', r.rhythm && '리듬', r.slots.some(x => x.immerse) && '몰입'].filter(Boolean) as string[];
    ui.weekPatch(w => { w.days[day] = { ...w.days[day], tags: [...w.days[day].tags, ...tags] }; });
    // 3) 학교 사건 — 멈추지 않고 그날 칸에
    if (schoolDays.has(day)) {
      const ev = pickEvent(st, SCHOOL.filter(e => !e.when || e.when(st, T)), 'sc');
      if (ev) {
        const ok = passCheck(st, ev), out = ok || !ev.ng ? ev.ok : ev.ng;
        if (out.eff) applyRaw(st, out.eff);
        bump(st, `sc:${ev.id}`);
        ui.weekPatch(w => { w.days[day] = { ...w.days[day], event: { icon: ev.icon, title: ev.title, text: out.text, ok: ev.check ? ok : undefined } }; });
        refresh();
        await ui.pace(900);
      }
    }
    // 4) 돌발 만남 (인물 이야기) · 메신저
    setClock({ turn: st.turn, week, day, time: '방과후' });
    met.push(incidents.has(`${week}-${day}`) ? await incident(st, T, day) : null);
    await dayTick(st, dayOf(st.turn, week, day), true);
  }
  ui.weekPatch(w => { w.cur = null; });

  // 주간 정리 카드
  const doze = days.filter(d => d.school !== 'ok').length, collapse = days.filter(d => d.collapse).length;
  const broke = days.reduce((n, d) => n + d.slots.filter(s => s.state === 'broke').length, 0);
  const greats = days.reduce((n, d) => n + d.slots.filter(s => s.state === 'great').length, 0);
  const fails = days.reduce((n, d) => n + d.slots.filter(s => s.state === 'fail').length, 0);
  Object.assign(month, { doze: month.doze + doze, collapse: month.collapse + collapse, broke: month.broke + broke, greats: month.greats + greats, fails: month.fails + fails });
  const view: WeekDayView[] = days.map((d, i) => ({
    label: DAY_LABEL[i], school: d.school, collapse: d.collapse, strain: d.strain, met: met[i],
    slots: d.slots.map(s => ({ name: s.name, state: s.state })),
  }));
  const notes: string[] = [];
  const look = styleNow(st, hpMax(st));
  if (greats) notes.push(`대성공 ${greats}번`);
  if (fails) notes.push(`실수 ${fails}번`);
  const imm = days.filter(d => d.slots.some(s => s.immerse)).length, rhy = days.filter(d => d.rhythm).length;
  if (imm) notes.push(`몰입 ${imm}일`);
  if (rhy) notes.push(`리듬 ${rhy}일`);
  if (look.why.length) notes.push(`${look.why.join('·')} — 이번 주 스타일이 죽었다`);
  if (doze) notes.push(`수업 중 ${doze}일 졸았다`);
  if (collapse) notes.push(`${collapse}일은 쓰러져 잠들었다`);
  if (broke) notes.push(`용돈이 모자라 ${broke}번 건너뛰었다`);
  ui.weekClose();
  ui.runLog({
    kind: 'week', title: `${week + 1}주차 평일`, tag: st.focus ? `집중 과목 · ${SUBJECT_LABEL[st.focus]}` : '집중 과목 없음',
    body: st.flags.puffy ? pick(WEEK_LINES.puffy) : weekLine(days, collapse, doze, broke), chips: gainChips(before, snap(st)),
    week: { days: view, notes }, tone: collapse || doze >= 2 ? 'warn' : undefined, mark: '平',
  });
  for (const m of checkMilestones(st)) ui.runLog({ kind: 'grade', title: m.title, body: m.body, mark: m.mark });
  st.flags.puffy = false;
  refresh();
}

function applyChoice(st: GameState, ev: ChoiceEvent, i: number, skip: [boolean, boolean], flow: Flow, day: number) {
  const o = ev.options[i] ?? ev.options[ev.options.length - 1];
  if (o.eff) applyRaw(st, o.eff);
  if (o.skip) skip[ev.slot] = true;
  if (o.next) flow.next = o.next;
  bump(st, `ch:${ev.id}`);
  ui.weekPatch(w => { w.days[day] = { ...w.days[day], event: { icon: ev.icon, title: ev.title, text: o.line } }; });
  refresh();
}

/** 그 주를 한 줄로 — 몸 상태가 나빴으면 그 얘기, 아니면 그 주에 한 일정 중 하나의 생활 한 줄 */
function weekLine(days: DayResult[], collapse: number, doze: number, broke: number) {
  if (collapse) return pick(WEEK_LINES.collapse);
  if (doze >= 2) return pick(WEEK_LINES.doze);
  if (broke >= 2) return pick(WEEK_LINES.broke);
  const used = new Set(days.flatMap(d => d.slots.filter(s => ['ok', 'great', 'fail'].includes(s.state)).map(s => s.id!)));
  const lines = [...used].flatMap(id => (findOption(0, id) ?? findOption(1, id) ?? findClub(id))?.lines ?? []);
  return lines.length && Math.random() < 0.75 ? pick(lines) : pick(WEEK_LINES.calm);
}

/** 평일 돌발 사건 — 학교 사람, 동아리, 그날 일정에서 마주치는 인물. 만난 사람 이름을 돌려준다 */
async function incident(st: GameState, T: Turn, day: number): Promise<string | null> {
  // 이안은 찐남주(기본 루트) — 학교에서 더 자주 마주친다
  const cands: { c: CharId; where: string; bg: string }[] = SCHOOL_PEOPLE[T.year].flatMap(c => Array(c === 'ian' ? 2 : 1).fill({ c, where: '이화고', bg: 'classroom' }));
  const club = findClub(st.club);
  if (club?.who && (!club.whoYears || club.whoYears.includes(T.year)) && club.days.includes(day)) cands.push({ c: club.who, where: club.name, bg: 'school' }, { c: club.who, where: club.name, bg: 'school' });
  for (const slot of [0, 1] as const) {
    const o = findOption(slot, st.timetable[day * 2 + slot]);
    if (o?.who && !(o.who === 'seoha' && T.year > 1)) cands.push({ c: o.who, where: o.place, bg: 'academy' }, { c: o.who, where: o.place, bg: 'academy' });
  }
  // 아직 첫 만남(메인 이벤트 1)을 안 본 사람은 마주치지 않는다
  const p = pick(cands.filter(x => st.met[x.c]));
  if (!p) return null;
  ui.runHide();
  await basicMeet(st, p.c, p.where, p.bg);
  ui.runShow();
  return p.c;
}
