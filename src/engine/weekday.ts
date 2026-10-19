/* =========================================================
   평일 — 시간표대로 5일을 자동 진행 (학교 → 방과후 → 야간)
   - weekdayStep: 하루 계산 (화면·무작위 없음). 실제 진행과 시간표 예측(forecast.ts)이 같이 쓴다
   - runWeekdays: 한 주 진행 + 돌발 사건 + 주간 카드
   숫자는 config/balance.ts 의 weekday · drowsy · school
   ========================================================= */
import type { CharId, GameState } from './types';
import { BALANCE } from '@/config/balance';
import { DAY_LABEL, type Turn } from '@/content/calendar';
import { SCHOOL_PEOPLE } from '@/content/presence';
import { SUBJECT_LABEL } from '@/content/careers';
import { WEEK_LINES } from '@/content/timetable';
import { ui, type WeekDayView } from '@/store/ui';
import { applyDelta, clubAt, findClub, findOption, growthMult, type Delta } from './timetable';
import { hpMax, refresh } from './state';
import { dayOf, dayTick } from './phone';
import { basicMeet } from './people';
import { checkMilestones, gainChips, month, snap } from './progress';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export interface DayResult {
  /** 수업: ok 또렷 · doze 졸음 · sleep 거의 잠 */
  school: 'ok' | 'doze' | 'sleep';
  /** 방과후·야간: 한 일 (id·이름), 빠진 이유 */
  slots: { id: string | null; name: string; state: 'ok' | 'club' | 'broke' | 'collapse' | 'empty' }[];
  collapse: boolean;
  /** 무거운 일정이 이어져 피로가 더 쌓인 날 */
  strain: boolean;
}

/** 하루 — st 를 바꾸고 무슨 일이 있었는지 돌려준다. heavyStreak 은 이어지는 무거운 날 수 */
export function weekdayStep(st: GameState, day: number, heavyStreak: number): { res: DayResult; heavyStreak: number } {
  const W = BALANCE.weekday, D = BALANCE.drowsy, SC = BALANCE.school;
  // 학교 — 피로해도 무조건 간다. 체력이 낮으면 졸아서 덜 오른다
  const ratio = st.hp / hpMax(st);
  const eff = st.hp <= 0 ? D.zero : ratio < D.lowRatio ? D.low : D.normal;
  const school: Delta = { int: SC.int, hp: W.schoolHp };
  if (st.focus) {
    school.int = (school.int ?? 0) + SC.focusInt;
    for (const sk of BALANCE.subjectSkills[st.focus]) school[sk] = (school[sk] ?? 0) + SC.focusSkill / BALANCE.subjectSkills[st.focus].length;
  }
  applyDelta(st, school, eff * growthMult(st));
  const res: DayResult = { school: eff >= 1 ? 'ok' : eff > D.zero ? 'doze' : 'sleep', slots: [], collapse: false, strain: false };

  // 방과후 · 야간
  if (st.hp <= 0) {
    res.collapse = true;
    applyDelta(st, { hp: W.collapseRecover });
    for (const slot of [0, 1] as const) {
      const o = clubAt(st, day, slot) ?? findOption(slot, st.timetable[day * 2 + slot]);
      res.slots.push({ id: o?.id ?? null, name: o?.name ?? '', state: 'collapse' });
    }
    heavyStreak = 0;
  } else {
    let heavyToday = false;
    for (const slot of [0, 1] as const) {
      const club = clubAt(st, day, slot);
      const o = club ?? findOption(slot, st.timetable[day * 2 + slot]);
      if (!o) { res.slots.push({ id: null, name: '', state: 'empty' }); continue; }
      if ((o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0) { res.slots.push({ id: o.id, name: o.name, state: 'broke' }); continue; }
      applyDelta(st, o.delta, growthMult(st));
      res.slots.push({ id: o.id, name: o.name, state: club ? 'club' : 'ok' });
      if (club || (o as { heavy?: boolean }).heavy) heavyToday = true;
    }
    heavyStreak = heavyToday ? heavyStreak + 1 : 0;
    if (heavyStreak >= W.heavyStreak) { applyDelta(st, { hp: W.heavyStreakHp }); res.strain = true; }
  }
  applyDelta(st, { hp: W.nightRegen });
  return { res, heavyStreak };
}

/** 한 주 진행 — 끝나면 진행 화면에 주간 카드 하나 */
export async function runWeekdays(st: GameState, T: Turn, week: number, incidents: Set<string>, heavyStreak: number) {
  const before = snap(st);
  const days: DayResult[] = [];
  const met: (string | null)[] = [];
  for (let day = 0; day < 5; day++) {
    const r = weekdayStep(st, day, heavyStreak);
    heavyStreak = r.heavyStreak;
    days.push(r.res);
    met.push(incidents.has(`${week}-${day}`) ? await incident(st, T, day) : null);
    await dayTick(st, dayOf(st.turn, week, day), true);
  }
  const doze = days.filter(d => d.school !== 'ok').length, collapse = days.filter(d => d.collapse).length;
  const broke = days.reduce((n, d) => n + d.slots.filter(s => s.state === 'broke').length, 0);
  Object.assign(month, { doze: month.doze + doze, collapse: month.collapse + collapse, broke: month.broke + broke });

  const view: WeekDayView[] = days.map((d, i) => ({
    label: DAY_LABEL[i], school: d.school, collapse: d.collapse, strain: d.strain, met: met[i],
    slots: d.slots.map(s => ({ name: s.name, state: s.state })),
  }));
  const notes: string[] = [];
  if (doze) notes.push(`수업 중 ${doze}일 졸았다`);
  if (collapse) notes.push(`${collapse}일은 쓰러져 잠들었다`);
  if (broke) notes.push(`용돈이 모자라 ${broke}번 건너뛰었다`);
  ui.runLog({
    kind: 'week', title: `${week + 1}주차 평일`, tag: st.focus ? `집중 과목 · ${SUBJECT_LABEL[st.focus]}` : '집중 과목 없음',
    body: weekLine(days, collapse, doze, broke), chips: gainChips(before, snap(st)),
    week: { days: view, notes }, tone: collapse || doze >= 2 ? 'warn' : undefined, mark: '平',
  });
  for (const m of checkMilestones(st)) ui.runLog({ kind: 'grade', title: m.title, body: m.body, mark: m.mark });
  refresh();
  return heavyStreak;
}

/** 그 주를 한 줄로 — 몸 상태가 나빴으면 그 얘기, 아니면 그 주에 한 일정 중 하나의 생활 한 줄 */
function weekLine(days: DayResult[], collapse: number, doze: number, broke: number) {
  if (collapse) return pick(WEEK_LINES.collapse);
  if (doze >= 2) return pick(WEEK_LINES.doze);
  if (broke >= 2) return pick(WEEK_LINES.broke);
  const used = new Set(days.flatMap(d => d.slots.filter(s => s.state === 'ok' || s.state === 'club').map(s => s.id!)));
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
  await basicMeet(st, p.c, `${DAY_LABEL[day]}요일 ${p.where}`, p.bg);
  ui.runShow();
  return p.c;
}
