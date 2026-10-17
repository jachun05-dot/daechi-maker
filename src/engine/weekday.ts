/* =========================================================
   평일 — 시간표대로 5일을 자동 진행 (학교 → 방과후 → 야간)
   숫자는 config/balance.ts 의 weekday · drowsy · school
   ========================================================= */
import type { CharId, GameState } from './types';
import { BALANCE } from '@/config/balance';
import { DAY_LABEL, type Turn } from '@/content/calendar';
import { SCHOOL_PEOPLE } from '@/content/presence';
import { SUBJECT_LABEL } from '@/content/careers';
import { ui } from '@/store/ui';
import { addDelta, applyDelta, clubAt, findClub, findOption, growthMult, type Delta } from './timetable';
import { deltaChips } from './chips';
import { hpMax, refresh } from './state';
import { dayOf, dayTick } from './phone';
import { basicMeet } from './people';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export async function runWeekdays(st: GameState, T: Turn, week: number, incidents: Set<string>, heavyStreak: number) {
  const W = BALANCE.weekday, D = BALANCE.drowsy, SC = BALANCE.school;
  const total: Delta = {};
  let dozed = 0, collapsed = 0, broke = 0;
  for (let day = 0; day < 5; day++) {
    // 학교 — 피로해도 무조건 간다. 체력이 낮으면 졸아서 덜 오른다
    const ratio = st.hp / hpMax(st);
    const eff = st.hp <= 0 ? D.zero : ratio < D.lowRatio ? D.low : D.normal;
    if (eff < 1) dozed++;
    const school: Delta = { int: SC.int, hp: W.schoolHp };
    if (st.focus) {
      school.int = (school.int ?? 0) + SC.focusInt;
      for (const sk of BALANCE.subjectSkills[st.focus]) school[sk] = (school[sk] ?? 0) + SC.focusSkill / BALANCE.subjectSkills[st.focus].length;
    }
    addDelta(total, applyDelta(st, school, eff * growthMult(st)));

    // 방과후 · 야간
    if (st.hp <= 0) {
      collapsed++;
      addDelta(total, applyDelta(st, { hp: W.collapseRecover }));
    } else {
      let heavyToday = false;
      for (const slot of [0, 1] as const) {
        const club = clubAt(st, day, slot);
        const o = club ?? findOption(slot, st.timetable[day * 2 + slot]);
        if (!o) continue;
        if ((o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0) { broke++; continue; }
        addDelta(total, applyDelta(st, o.delta, growthMult(st)));
        if (club || (o as { heavy?: boolean }).heavy) heavyToday = true;
      }
      heavyStreak = heavyToday ? heavyStreak + 1 : 0;
      if (heavyStreak >= W.heavyStreak) addDelta(total, applyDelta(st, { hp: W.heavyStreakHp }));
    }
    addDelta(total, applyDelta(st, { hp: W.nightRegen }));

    if (incidents.has(`${week}-${day}`)) await incident(st, T, day);
    await dayTick(st, dayOf(st.turn, week, day), true);
  }
  refresh();
  const notes: string[] = [];
  if (dozed) notes.push(`수업 중에 ${dozed}일 졸았다.`);
  if (collapsed) notes.push(`${collapsed}일은 쓰러지듯 잠들어 방과후 일정을 날렸다.`);
  if (broke) notes.push(`용돈이 모자라 ${broke}번 일정을 건너뛰었다.`);
  ui.runLog({
    title: `${week + 1}주차 평일`, tag: st.focus ? `집중 과목 · ${SUBJECT_LABEL[st.focus]}` : '집중 과목 없음',
    body: notes.join(' ') || '시간표대로 한 주를 보냈다.', chips: deltaChips(total), tone: collapsed || dozed ? 'warn' : undefined, mark: '平',
  });
  return heavyStreak;
}

/** 평일 돌발 사건 — 학교 사람, 동아리, 그날 일정에서 마주치는 인물 */
async function incident(st: GameState, T: Turn, day: number) {
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
  if (!p) return;
  ui.runClose();
  await basicMeet(st, p.c, `${DAY_LABEL[day]}요일 ${p.where}`, p.bg);
  ui.runOpen(`${T.label}`, '평일');
}
