/* 평일 판정 · 학교 사건 · 작은 선택 */
import { describe, expect, it } from 'vitest';
import { AFTER_SCHOOL, CLUBS, NIGHT } from '@/content/timetable';
import { ROLLS, CAT_LOOK } from '@/content/rolls';
import { CHOICES, SCHOOL } from '@/content/dayEvents';
import { BASE_KEYS, SKILL_KEYS } from '@/content/careers';
import { newState } from '@/engine/state';
import { newFlow, rollOdds, weekdayStep } from '@/engine/weekday';
import { findOption } from '@/engine/timetable';
import { recommendTimetable } from '@/engine/forecast';

const KEYS = new Set<string>([...BASE_KEYS, ...SKILL_KEYS, 'hp', 'stress', 'money']);

describe('판정 데이터', () => {
  it('모든 평일 일정·동아리에 갈래와 판정 문장이 있다 (쉬는 일정은 실수 없음)', () => {
    const bad: string[] = [];
    for (const o of [...AFTER_SCHOOL, ...NIGHT, ...CLUBS.filter(c => c.id !== 'none')]) {
      const r = ROLLS[o.id];
      if (!r) { bad.push(`${o.id}: 없음`); continue; }
      if (!CAT_LOOK[r.cat]) bad.push(`${o.id}: 갈래 ${r.cat}`);
      if (!r.great.length) bad.push(`${o.id}: 대성공 문장 없음`);
      if (r.cat !== 'rest' && !r.fail.length) bad.push(`${o.id}: 실수 문장 없음`);
    }
    expect(bad).toEqual([]);
  });

  it('학교 사건·작은 선택의 효과 키와 선택지가 올바르다', () => {
    const bad: string[] = [];
    const eff = (where: string, d?: Record<string, number>) => Object.keys(d ?? {}).forEach(k => { if (!KEYS.has(k)) bad.push(`${where}: ${k}`); });
    for (const e of SCHOOL) { eff(e.id, e.ok.eff); eff(e.id, e.ng?.eff); if (e.check && !KEYS.has(e.check)) bad.push(`${e.id}: check ${e.check}`); if (e.check && !e.ng) bad.push(`${e.id}: 판정이 있으면 ng 필요`); }
    for (const c of CHOICES) { if (c.options.length < 2) bad.push(`${c.id}: 선택지 2개 이상`); c.options.forEach(o => eff(c.id, o.eff)); }
    expect(bad).toEqual([]);
    expect(new Set(CHOICES.map(c => c.id)).size).toBe(CHOICES.length);
    expect(new Set(SCHOOL.map(c => c.id)).size).toBe(SCHOOL.length);
  });
});

describe('판정', () => {
  it('확률은 범위 안이고, 능력이 높을수록 대성공이 잦고 실수가 드물다', () => {
    const st = newState('t'); const o = findOption(1, 'academy')!;
    const low = rollOdds(st, o, newFlow(), false);
    st.stat.int = 200; st.skill.science = 200;
    const high = rollOdds(st, o, newFlow(), false);
    expect(high.great).toBeGreaterThan(low.great);
    expect(high.fail).toBeLessThan(low.fail);
    for (const p of [low, high]) { expect(p.great + p.fail).toBeLessThan(1); expect(p.fail).toBeGreaterThanOrEqual(0); }
  });

  it('쉬는 일정은 실수하지 않는다', () => {
    expect(rollOdds(newState('t'), findOption(1, 'rest')!, newFlow(), false).fail).toBe(0);
  });

  it('예측 모드(기대값)는 무작위 없이 같은 결과를 낸다', () => {
    const a = newState('t'); a.club = 'none'; a.timetable = recommendTimetable(a, 'balance');
    const b = JSON.parse(JSON.stringify(a));
    const fa = newFlow(), fb = newFlow();
    for (let d = 0; d < 5; d++) { weekdayStep(a, d, fa, { roll: false }); weekdayStep(b, d, fb, { roll: false }); }
    expect(a.stat).toEqual(b.stat);
    expect(a.hp).toBe(b.hp);
  });

  it('같은 일정을 사흘 이어 하면 몰입, 할 일과 쉬는 일을 섞으면 리듬', () => {
    const st = newState('t'); st.club = 'none';
    st.timetable = Array.from({ length: 10 }, (_, i) => (i % 2 ? 'rest' : 'study'));
    const f = newFlow();
    const days = [0, 1, 2].map(d => weekdayStep(st, d, f, { roll: false }));
    expect(days[2].slots[0].immerse).toBe(true);
    expect(days[0].slots[0].immerse).toBe(false);
    expect(days.every(d => d.rhythm)).toBe(true);
  });

  it('선택으로 빠진 칸은 일정이 실행되지 않는다', () => {
    const st = newState('t'); st.club = 'none'; st.timetable = Array(10).fill('study'); st.timetable[1] = 'academy';
    const r = weekdayStep(st, 0, newFlow(), { roll: true, skip: [false, true] });
    expect(r.slots[1].state).toBe('skip');
    expect(st.tally['o:academy'] ?? 0).toBe(0);
  });
});
