/* =========================================================
   인물이 주말에 자주 있는 곳 (학년별)
   - 주말마다 목록 중 한 곳에만 있다
   - 지도에는 표시되지 않는다. 만나면 도감 "자주 보이는 곳"에 기록된다
   ========================================================= */
import type { CharId } from '@/engine/types';

export const WEEKEND_PLACES: Record<CharId, Record<1 | 2 | 3, string[]>> = {
  ian:    { 1: ['hannam'], 2: ['hannam'], 3: ['hannam'] },            // 이안의 주말 장소는 미정 (임시: 한남동 갤러리)
  mujin:  { 1: ['hangang', 'schoolgym'], 2: ['hangang', 'schoolgym'], 3: ['hangang', 'schoolgym'] },
  doyun:  { 1: ['daechi'], 2: ['daechi'], 3: ['daechi', 'campus'] },  // 3학년 땐 졸업생 — 대학 캠퍼스, 대치동 과외 알바
  taejun: { 1: ['cheongdam'], 2: ['cheongdam'], 3: ['cheongdam'] },
  seoha:  { 1: ['daehakro'], 2: ['daehakro'], 3: ['daehakro'] },
  ihyun:  { 1: ['palace', 'intl'], 2: ['palace', 'intl'], 3: ['palace', 'intl'] },
  sihyun: { 1: ['hongdae', 'nakwon'], 2: ['hongdae', 'nakwon'], 3: ['hongdae', 'nakwon'] },
};

/** 평일 학교에서 마주치는 인물 (돌발 사건 후보) — 학년별 */
export const SCHOOL_PEOPLE: Record<1 | 2 | 3, CharId[]> = {
  1: ['ian', 'mujin', 'doyun'],
  2: ['ian', 'mujin', 'doyun', 'seoha'],
  3: ['ian', 'mujin', 'seoha'],
};
