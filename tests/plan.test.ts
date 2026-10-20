/* 시간표 예측·추천·성장 표시 */
import { describe, expect, it } from 'vitest';
import { newState } from '@/engine/state';
import { forecastMonth, recommendTimetable, PRESETS, examTier, monthGoal } from '@/engine/forecast';
import { timetableReady, findOption } from '@/engine/timetable';
import { gainChips, snap, checkMilestones, reqMet } from '@/engine/progress';
import { deltaChips } from '@/engine/chips';
import { TURNS } from '@/content/calendar';

const fresh = () => { const st = newState('테스트'); st.club = 'none'; return st; };

describe('시간표 추천', () => {
  it('모든 추천이 시간표를 다 채우고, 잠긴 일정은 넣지 않는다', () => {
    const st = fresh();
    for (const p of PRESETS) {
      const tt = recommendTimetable(st, p.id);
      st.timetable = tt;
      expect(timetableReady(st)).toBe(true);
      tt.forEach((id, i) => { const o = findOption((i % 2) as 0 | 1, id); if (o) expect(reqMet(st, o.req)).toBe(true); });
    }
  });

  it('추천은 첫 달 용돈 안에서 짠다', () => {
    const st = fresh();
    for (const p of PRESETS) expect(forecastMonth(st, recommendTimetable(st, p.id)).broke).toBe(0);
  });

  it('회복 추천은 쓰러지지 않는다 (체력이 낮아도)', () => {
    const st = fresh(); st.hp = 20; st.stress = 70;
    const f = forecastMonth(st, recommendTimetable(st, 'rest'));
    expect(f.collapse).toBe(0);
    expect(f.stressEnd).toBeLessThan(70);
  });
});

describe('한 달 예측', () => {
  it('상태를 바꾸지 않는다', () => {
    const st = fresh(); st.timetable = recommendTimetable(st, 'study');
    const before = JSON.stringify(st);
    forecastMonth(st);
    expect(JSON.stringify(st)).toBe(before);
  });

  it('시험 예상은 지성이 오를수록 좋아진다', () => {
    const st = fresh();
    expect(examTier(st, 10).ratio).toBeLessThan(examTier(st, 60).ratio);
    expect(monthGoal(st, TURNS[1], null).title).toContain('중간고사');
  });
});

describe('화면 숫자', () => {
  it('성장량·일정 칩에 소수점이 없다', () => {
    const st = fresh(); const a = snap(st);
    st.stat.int += 2.7; st.skill.vocal += 0.4; st.hp -= 3.3;
    const labels = [...gainChips(a, snap(st)), ...deltaChips({ int: 0.3, vocal: 1.6, hp: -2.5, stress: 0.2 })].map(c => c.label);
    for (const l of labels) expect(l).not.toMatch(/\d\.\d/);
    expect(labels).toContain('지성 +2');
  });

  it('이정표는 처음엔 조용히 기준만 잡고, 그 뒤 새로 넘은 것만 알린다', () => {
    const st = fresh(); st.stat.int = 40;
    expect(checkMilestones(st)).toEqual([]);
    st.stat.int = 61;
    expect(checkMilestones(st).map(m => m.title)).toEqual(['지성 C등급', '새 일정 · 중학생 과외 알바']);
    expect(checkMilestones(st)).toEqual([]);
  });
});
