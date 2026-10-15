/* =========================================================
   평일 시간표 — 월~금 × (방과후 16~19시, 야간 19~23시)
   - delta: 한 번(하루) 할 때의 변화량. 한 달이면 요일당 4번 반복된다
   - days: 열리는 요일 (0=월 … 4=금)
   - heavy: 무거운 일정. 쉬는 칸 없이 연속되면 피로가 더 쌓인다
   - who: 이 일정에서 평일 돌발 사건으로 마주칠 수 있는 인물
   - 아이콘 이미지: src/assets/images/schedule/{id}.png
   ========================================================= */
import type { Delta, TimetableOption, Club } from '@/engine/timetable';

const ALL = [0, 1, 2, 3, 4];

export const AFTER_SCHOOL: TimetableOption[] = [
  { id: 'study',   name: '교실 자습',      place: '이화고 교실',   days: ALL, delta: { int: 0.5, science: 0.2, language: 0.2, hp: -2, stress: 1 }, desc: '불 꺼진 교실에 남아 문제집을 푼다.' },
  { id: 'library', name: '도서관 독서',    place: '이화고 도서관', days: ALL, delta: { int: 0.3, sense: 0.3, hp: -1, stress: -1 }, desc: '창가 자리에서 책장을 넘긴다.' },
  { id: 'gym',     name: '체육관 운동',    place: '이화고 체육관', days: ALL, delta: { fit: 0.6, hp: -4, stress: -2 }, heavy: true, desc: '땀으로 머릿속을 비운다.' },
  { id: 'cafe',    name: '동네 카페 알바', place: '대치동 카페',   days: ALL, delta: { cha: 0.3, money: 8000, hp: -4, stress: 1 }, heavy: true, desc: '학원가 카페에서 음료를 만든다.' },
  { id: 'home',    name: '귀가',           place: '우리 집',       days: ALL, delta: { hp: 4, stress: -2 }, desc: '곧장 집으로 간다.' },
];

export const NIGHT: TimetableOption[] = [
  { id: 'academy',  name: '대치동 단과학원',  place: '대치동 학원가',     days: ALL,       delta: { int: 0.6, science: 0.4, language: 0.3, hp: -4, stress: 2, money: -6000 }, heavy: true, desc: '국·영·수 단과반. 밤 10시의 대치동은 낮보다 밝다.' },
  { id: 'vvip',     name: 'VVIP 과외',        place: '대치동 라운지',     days: [0, 2],    delta: { int: 0.8, science: 0.5, language: 0.5, debate: 0.2, hp: -3, stress: 2, money: -25000 }, heavy: true, who: 'taejun', desc: '소수정예 고액 과외. 월·수만 열린다.' },
  { id: 'medstudy', name: '생명과학 심화반',  place: '대치동 학원가',     days: [1, 3],    delta: { science: 0.4, medicine: 0.6, int: 0.2, hp: -4, stress: 2, money: -8000 }, heavy: true, desc: '의대 준비반. 화·목.' },
  { id: 'vocal',    name: '보컬 레슨',        place: '신사동 스튜디오',   days: [2, 4],    delta: { vocal: 0.8, sense: 0.3, hp: -4, stress: 1, money: -12000 }, heavy: true, desc: '호흡, 발성, 고음. 수·금.' },
  { id: 'dance',    name: '댄스 아카데미',    place: '홍대 스튜디오',     days: [1, 3],    delta: { dance: 0.8, fit: 0.3, hp: -5, stress: -1, money: -12000 }, heavy: true, desc: '커버 댄스와 무대 매너. 화·목.' },
  { id: 'acting',   name: '연기 학원',        place: '대학로 연기 학원',  days: [1, 3],    delta: { acting: 0.7, voice: 0.5, sense: 0.3, hp: -4, stress: 1, money: -12000 }, heavy: true, who: 'seoha', desc: '독백과 화술. 화·목.' },
  { id: 'speech',   name: '어학·토론 학원',   place: '대치동 학원가',     days: [0, 2, 4], delta: { language: 0.6, debate: 0.6, cha: 0.2, hp: -4, stress: 2, money: -9000 }, heavy: true, desc: '영어 토론과 모의 재판. 월·수·금.' },
  { id: 'dokseo',   name: '독서실',           place: '동네 독서실',       days: ALL,       delta: { int: 0.4, science: 0.2, hp: -3, stress: 2, money: -1500 }, desc: '싸고 조용하다. 대신 외롭다.' },
  { id: 'rest',     name: '휴식',             place: '우리 집',           days: ALL,       delta: { hp: 6, stress: -3 }, desc: '일찍 잔다.' },
];

/** 동아리 — 학기마다 하나, 정해진 요일의 방과후 칸에 고정된다 */
export const CLUBS: Club[] = [
  { id: 'none',      name: '귀가부',            days: [],     delta: {}, desc: '동아리 없이 방과후를 자유롭게 쓴다.' },
  { id: 'council',   name: '학생회',            days: [0, 2], delta: { cha: 0.5, int: 0.2, debate: 0.2, hp: -3 }, who: 'ian', desc: '학교 행사와 회의. 월·수.' },
  { id: 'athletics', name: '운동부 매니저',     days: [1, 3], delta: { fit: 0.4, cha: 0.3, hp: -3 }, who: 'mujin', desc: '체육 특기생들의 훈련을 돕는다. 화·목.' },
  { id: 'science',   name: '과학탐구반',        days: [1, 3], delta: { science: 0.5, int: 0.3, medicine: 0.1, hp: -2 }, who: 'doyun', whoYears: [1, 2], desc: '실험과 탐구 보고서. 화·목.' },
  { id: 'drama',     name: '연극부',            days: [2, 4], delta: { acting: 0.5, voice: 0.3, sense: 0.2, hp: -3 }, who: 'seoha', whoYears: [2, 3], desc: '정기 공연을 준비한다. 수·금.' },
  { id: 'band',      name: '밴드부',            days: [1, 3], delta: { vocal: 0.4, dance: 0.1, sense: 0.3, hp: -3 }, desc: '합주실의 낡은 앰프. 화·목.' },
  { id: 'mun',       name: '모의UN·방송부',     days: [0, 2], delta: { language: 0.5, debate: 0.4, hp: -2 }, desc: '영어 토론과 교내 방송. 월·수.' },
];

/** 이 값들은 Delta 타입 확인용 (편집할 필요 없음) */
export type { Delta };
