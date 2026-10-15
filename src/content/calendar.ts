/* =========================================================
   학사 일정 — 학년별 3월~12월, 총 30턴 (1턴 = 한 달)
   event: 그 달 말에 일어나는 이벤트 (src/engine/events.ts 에서 처리)
   summer: 여름방학 달 — 시간표·지도 대신 방학 진행
   winterAfter: 기말고사 뒤 겨울방학 진행
   ========================================================= */
import type { Season } from '@/engine/types';

export type MonthEvent = 'exam' | 'sports' | 'festival' | 'counsel' | 'suneung' | 'graduation';

export interface Turn {
  year: 1 | 2 | 3; month: number; label: string; season: Season; title: string;
  event: MonthEvent | null; summer: boolean; winterAfter: boolean; term: number;
}

const MONTHS: Record<number, { title: string; event: MonthEvent | null; summer?: boolean; winterAfter?: boolean }> = {
  3:  { title: '새 학기', event: null },
  4:  { title: '1학기 중간고사', event: 'exam' },
  5:  { title: '체육대회', event: 'sports' },
  6:  { title: '1학기 기말고사', event: 'exam' },
  7:  { title: '여름방학', event: null, summer: true },
  8:  { title: '2학기 개학', event: null },
  9:  { title: '이화제(축제)', event: 'festival' },
  10: { title: '2학기 중간고사', event: 'exam' },
  11: { title: '진로 상담', event: 'counsel' },
  12: { title: '기말고사 · 겨울방학', event: 'exam', winterAfter: true },
};

const seasonOf = (m: number): Season => (m <= 5 ? 'spring' : m <= 8 ? 'summer' : m <= 11 ? 'autumn' : 'winter');

export const TURNS: Turn[] = [];
for (const year of [1, 2, 3] as const) {
  for (let month = 3; month <= 12; month++) {
    const m = { ...MONTHS[month] };
    if (year === 3 && month === 11) Object.assign(m, { title: '대학수학능력시험', event: 'suneung' });
    if (year === 3 && month === 12) Object.assign(m, { title: '졸업', event: 'graduation', winterAfter: false });
    TURNS.push({
      year, month, label: `${year}학년 ${month}월`, season: seasonOf(month), title: m.title, event: m.event,
      summer: !!m.summer, winterAfter: !!m.winterAfter, term: (year - 1) * 2 + (month >= 8 ? 1 : 0),
    });
  }
}

export const SEASON_LABEL: Record<Season, string> = { spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' };
export const SEASON_FX = { spring: 'petal', summer: 'rain', autumn: 'leaf', winter: 'snow' } as const;
export const DAY_LABEL = ['월', '화', '수', '목', '금'];
