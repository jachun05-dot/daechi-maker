/* =========================================================
   이야기 시계 — 지금이 "언제"인지. 장면 앞 전환 자막("3월 첫째 주 수요일 · 점심시간 / 본관 2층 계단")에 쓴다
   엔진이 진행하면서 setClock 으로 맞춰 두면, ui.playScene 이 장면 머리말(when= where=)과 합쳐 자막을 만든다
   ========================================================= */
import { TURNS } from '@/content/calendar';

const WEEK = ['첫째', '둘째', '셋째', '넷째'];
const DAY = '월화수목금토일';

export const clock = {
  turn: 0,
  /** 0~3 */
  week: 0,
  /** 0=월 … 6=일 */
  day: 0,
  /** 시간대 (아침 · 쉬는 시간 · 점심시간 · 방과후 · 야간 · 낮 · 저녁 …) */
  time: '아침',
  /** 방학처럼 날짜보다 기간이 어울릴 때 */
  span: '' as string,
};

export function setClock(p: Partial<typeof clock>) {
  Object.assign(clock, { span: '' }, p);
}

/** "1학년 3월 첫째 주 수요일" (방학 중이면 "1학년 여름방학") */
export function dateLabel(day?: string) {
  const T = TURNS[Math.min(clock.turn, TURNS.length - 1)];
  if (clock.span) return `${T.year}학년 ${clock.span}`;
  // 장면 머리말 day="토" 처럼 요일을 못 박을 수 있다 (자동 발생 장면은 달 첫날이라서)
  const d = day && DAY.includes(day) ? day : DAY[clock.day] ?? '월';
  return `${T.year}학년 ${T.month}월 ${WEEK[clock.week] ?? '넷째'} 주 ${d}요일`;
}

/** 시간대 순서 — 같은 날 장면을 이 순서로 이어 붙인다 */
export const TIME_ORDER = ['새벽', '아침', '입학식', '조회', '1교시 전', '1교시', '쉬는 시간', '2교시 쉬는 시간', '점심시간', '5교시', '낮', '오후', '방과후', '저녁', '야간', '밤'];
export const timeRank = (t?: string) => { const i = TIME_ORDER.indexOf(t ?? ''); return i < 0 ? TIME_ORDER.length : i; };
