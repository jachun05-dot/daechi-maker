/* =========================================================
   방학 특강 — 하나 고르면 방학이 빠르게 지나간다
   (여름: 매년 7월 / 겨울: 1·2학년 12월 기말고사 뒤)
   ========================================================= */
import type { Delta } from '@/engine/timetable';

export interface Lecture { id: string; name: string; desc: string; delta: Delta }

export const LECTURES: Lecture[] = [
  { id: 'suneung', name: '수능 집중 특강',      desc: '대치동 방학 종합반. 하루 열두 시간.',    delta: { int: 10, science: 6, language: 6, stress: 12, hp: -15, money: -150000 } },
  { id: 'medcamp', name: '의대 진로 캠프',      desc: '대학병원 견학과 생명과학 심화.',         delta: { medicine: 10, science: 6, int: 3, stress: 6, money: -120000 } },
  { id: 'stage',   name: '보컬·댄스 캠프',      desc: '기획사 출신 트레이너의 합숙 레슨.',      delta: { vocal: 9, dance: 9, sense: 3, stress: 4, hp: -15, money: -150000 } },
  { id: 'acting',  name: '연기 워크숍',         desc: '대학로 극단과 함께하는 집중 워크숍.',    delta: { acting: 10, voice: 8, sense: 3, stress: 4, money: -120000 } },
  { id: 'leader',  name: '리더십·어학 캠프',    desc: '영어 토론과 모의 외교 협상.',            delta: { language: 10, debate: 8, cha: 3, stress: 5, money: -130000 } },
  { id: 'rest',    name: '쉬어 가기',           desc: '아무 데도 안 가고 푹 쉰다.',            delta: { hp: 40, stress: -30, spirit: 2 } },
];
