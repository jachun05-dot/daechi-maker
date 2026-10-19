/* =========================================================
   평일 시간표 — 월~금 × (방과후 16~19시, 야간 19~23시)
   - delta: 한 번(하루) 할 때의 변화량. 한 달이면 요일당 4번 반복된다
     (스탯·특기 성장에는 balance.ts growth.scale 이 곱해진다)
   - days: 열리는 요일 (0=월 … 4=금)
   - heavy: 무거운 일정. 쉬는 칸 없이 연속되면 피로가 더 쌓인다
   - who: 이 일정에서 평일 돌발 사건으로 마주칠 수 있는 인물
   - req: 이 능력·특기가 되면 열린다 (그 전엔 시간표에 잠긴 채 보인다 → 목표가 된다)
   - lines: 한 주를 정리할 때 가끔 나오는 생활 한 줄
   - 아이콘 이미지: src/assets/images/schedule/{id}.png
   ========================================================= */
import type { Delta, TimetableOption, Club } from '@/engine/timetable';

const ALL = [0, 1, 2, 3, 4];

export const AFTER_SCHOOL: TimetableOption[] = [
  { id: 'study',   name: '교실 자습',      place: '이화고 교실',   days: ALL, delta: { int: 0.5, science: 0.2, language: 0.2, hp: -2, stress: 1 }, desc: '불 꺼진 교실에 남아 문제집을 푼다.',
    lines: ['자습실 형광등 하나가 계속 깜빡였다. 아무도 고쳐 달라고 하지 않았다.', '오답 노트 한 권을 다 썼다. 새 노트 첫 장에 날짜를 적었다.'] },
  { id: 'library', name: '도서관 독서',    place: '이화고 도서관', days: ALL, delta: { int: 0.3, sense: 0.3, hp: -1, stress: -1 }, desc: '창가 자리에서 책장을 넘긴다.',
    lines: ['반납일이 지난 시집을 몰래 한 번 더 빌렸다.', '창가 자리에 앉으면 운동장 소리가 멀게 들린다.'] },
  { id: 'gym',     name: '체육관 운동',    place: '이화고 체육관', days: ALL, delta: { fit: 0.6, hp: -4, stress: -2 }, heavy: true, desc: '땀으로 머릿속을 비운다.',
    lines: ['줄넘기 2단 뛰기를 처음으로 열 번 넘게 했다.', '샤워실 거울 속 얼굴이 조금 단단해 보였다.'] },
  { id: 'cafe',    name: '동네 카페 알바', place: '대치동 카페',   days: ALL, delta: { cha: 0.3, money: 8000, hp: -4, stress: 1 }, heavy: true, desc: '학원가 카페에서 음료를 만든다.',
    lines: ['단골 학부모가 "학생 여기서 일해?" 하고 두 번 물었다.', '아이스 아메리카노 마흔 잔. 손목이 시큰했다.'] },
  { id: 'home',    name: '귀가',           place: '우리 집',       days: ALL, delta: { hp: 4, stress: -2 }, desc: '곧장 집으로 간다.',
    lines: ['엄마가 깎아 둔 사과가 갈변하기 전에 먹었다.', '해가 지기 전에 집에 오니 하루가 길었다.'] },
  // ── 실력이 쌓이면 열리는 일정
  { id: 'tutor',   name: '중학생 과외 알바', place: '대치동 스터디룸', days: [0, 2, 4], delta: { int: 0.3, cha: 0.3, money: 20000, hp: -3, stress: 2 }, heavy: true, req: { int: 60 },
    desc: '학원가 중학생에게 수학을 가르친다. 월·수·금.', lines: ['가르치다 보니 내가 몰랐던 걸 알게 됐다.', '"쌤 이거 시험에 나와요?" 열한 번째 질문이었다.'] },
  { id: 'busking', name: '홍대 버스킹',    place: '홍대 걷고싶은거리', days: [4], delta: { vocal: 0.7, sense: 0.3, cha: 0.4, money: 6000, hp: -3, stress: -3 }, heavy: true, req: { vocal: 25 },
    desc: '금요일 해 질 녘, 기타 케이스를 열어 둔다.', lines: ['모르는 사람이 끝까지 서서 들어 줬다.', '기타 케이스에 동전과 쪽지 하나. "내일도 해요?"'] },
];

export const NIGHT: TimetableOption[] = [
  { id: 'academy',  name: '대치동 단과학원',  place: '대치동 학원가',     days: ALL,       delta: { int: 0.6, science: 0.4, language: 0.3, hp: -4, stress: 2, money: -6000 }, heavy: true, desc: '국·영·수 단과반. 밤 10시의 대치동은 낮보다 밝다.',
    lines: ['학원 셔틀에서 졸다가 정류장 두 개를 지나쳤다.', '밤 10시의 학원가 편의점은 교복으로 가득했다.'] },
  { id: 'vvip',     name: 'VVIP 과외',        place: '대치동 라운지',     days: [0, 2],    delta: { int: 0.8, science: 0.5, language: 0.5, debate: 0.2, hp: -3, stress: 2, money: -25000 }, heavy: true, who: 'taejun', desc: '소수정예 고액 과외. 월·수만 열린다.',
    lines: ['과외 선생님의 만년필이 내 한 달 용돈보다 비싸 보였다.'] },
  { id: 'medstudy', name: '생명과학 심화반',  place: '대치동 학원가',     days: [1, 3],    delta: { science: 0.4, medicine: 0.6, int: 0.2, hp: -4, stress: 2, money: -8000 }, heavy: true, desc: '의대 준비반. 화·목.',
    lines: ['세포 분열 그림을 백 번쯤 그렸다. 꿈에서도 그렸다.'] },
  { id: 'vocal',    name: '보컬 레슨',        place: '신사동 스튜디오',   days: [2, 4],    delta: { vocal: 0.8, sense: 0.3, hp: -4, stress: 1, money: -8000 }, heavy: true, desc: '호흡, 발성, 고음. 수·금.',
    lines: ['처음으로 고음에서 목이 아니라 배가 울렸다.', '녹음해 들어 본 내 목소리가 낯설었다.'] },
  { id: 'dance',    name: '댄스 아카데미',    place: '홍대 스튜디오',     days: [1, 3],    delta: { dance: 0.8, fit: 0.3, hp: -5, stress: -1, money: -8000 }, heavy: true, desc: '커버 댄스와 무대 매너. 화·목.',
    lines: ['거울 속 동작이 처음으로 박자와 맞았다.', '발목에 파스를 붙이고 잤다.'] },
  { id: 'acting',   name: '연기 학원',        place: '대학로 연기 학원',  days: [1, 3],    delta: { acting: 0.7, voice: 0.7, sense: 0.3, hp: -4, stress: 1, money: -8000 }, heavy: true, who: 'seoha', desc: '독백과 화술. 화·목.',
    lines: ['독백 대사를 지하철에서 중얼거리다 눈이 마주쳤다.'] },
  { id: 'speech',   name: '어학·토론 학원',   place: '대치동 학원가',     days: [0, 2, 4], delta: { language: 0.6, debate: 0.6, cha: 0.2, hp: -4, stress: 2, money: -9000 }, heavy: true, desc: '영어 토론과 모의 재판. 월·수·금.',
    lines: ['반론 시간 30초. 처음으로 끝까지 말했다.'] },
  { id: 'dokseo',   name: '독서실',           place: '동네 독서실',       days: ALL,       delta: { int: 0.4, science: 0.2, hp: -3, stress: 2, money: -1500 }, desc: '싸고 조용하다. 대신 외롭다.',
    lines: ['칸막이 너머로 누군가 훌쩍이는 소리가 들렸다.', '독서실 총무 언니가 귤을 하나 놓고 갔다.'] },
  { id: 'rest',     name: '휴식',             place: '우리 집',           days: ALL,       delta: { hp: 6, stress: -3 }, desc: '일찍 잔다.',
    lines: ['알람 없이 눈을 떴는데 아직 아침이었다.', '오랜만에 꿈도 없이 푹 잤다.'] },
  // ── 실력이 쌓이면 열리는 일정
  { id: 'olympiad', name: '과학 올림피아드반', place: '대치동 학원가', days: [0, 2], delta: { science: 1.0, int: 0.4, medicine: 0.2, hp: -5, stress: 3, money: -15000 }, heavy: true, req: { science: 40 },
    desc: '경시대회 대비 소수반. 월·수.', lines: ['문제 하나를 세 시간 붙잡았다. 풀렸다.'] },
  { id: 'medmentor', name: '의대생 멘토링',   place: '한국대 의대 스터디', days: [4], delta: { medicine: 0.9, science: 0.4, sense: 0.2, hp: -3, stress: 1 }, heavy: true, req: { medicine: 30 },
    desc: '의대생 선배의 무료 멘토링. 금.', lines: ['선배가 해부학 노트를 빌려줬다. 손때가 묻어 있었다.'] },
  { id: 'audition', name: '오디션 준비반',    place: '신사동 기획사 연습실', days: [3, 4], delta: { vocal: 0.7, dance: 0.7, sense: 0.2, hp: -6, stress: 3, money: -15000 }, heavy: true, req: { vocal: 35, dance: 35 },
    desc: '기획사 연습생 선발 대비. 목·금.', lines: ['연습실 바닥에 이름 모를 연습생들의 신발 자국.'] },
  { id: 'extra',    name: '대학로 단역 알바', place: '대학로 소극장',    days: [4], delta: { acting: 0.6, voice: 0.6, money: 15000, hp: -4, stress: 1 }, heavy: true, req: { acting: 35 },
    desc: '소극장 공연의 단역과 무대 정리. 금.', lines: ['대사 한 줄. 객석에서 누군가 웃었다.'] },
  { id: 'moot',     name: '모의재판 대회반',  place: '대치동 학원가',    days: [1, 3], delta: { debate: 0.9, language: 0.4, cha: 0.3, hp: -4, stress: 2, money: -10000 }, heavy: true, req: { debate: 35 },
    desc: '전국 모의재판 대회 준비. 화·목.', lines: ['변론서 마지막 문장을 다섯 번 고쳤다.'] },
];

/** 동아리 — 학기마다 하나, 정해진 요일의 방과후 칸에 고정된다 */
export const CLUBS: Club[] = [
  { id: 'none',      name: '귀가부',            days: [],     delta: {}, desc: '동아리 없이 방과후를 자유롭게 쓴다.' },
  { id: 'council',   name: '학생회',            days: [0, 2], delta: { cha: 0.5, int: 0.2, debate: 0.2, hp: -3 }, who: 'ian', desc: '학교 행사와 회의. 월·수.', lines: ['회의록을 쓰다 보니 학교의 속사정을 꽤 알게 됐다.'] },
  { id: 'athletics', name: '운동부 매니저',     days: [1, 3], delta: { fit: 0.4, cha: 0.3, hp: -3 }, who: 'mujin', desc: '체육 특기생들의 훈련을 돕는다. 화·목.', lines: ['초시계를 누르는 손이 빨라졌다.'] },
  { id: 'science',   name: '과학탐구반',        days: [1, 3], delta: { science: 0.5, int: 0.3, medicine: 0.1, hp: -2 }, who: 'doyun', whoYears: [1, 2], desc: '실험과 탐구 보고서. 화·목.', lines: ['실험이 실패했다. 실패한 이유를 쓰는 게 더 재밌었다.'] },
  { id: 'drama',     name: '연극부',            days: [2, 4], delta: { acting: 0.5, voice: 0.5, sense: 0.2, hp: -3 }, who: 'seoha', whoYears: [2, 3], desc: '정기 공연을 준비한다. 수·금.', lines: ['소품으로 쓸 왕관을 금박지로 만들었다.'] },
  { id: 'band',      name: '밴드부',            days: [1, 3], delta: { vocal: 0.4, dance: 0.1, sense: 0.3, hp: -3 }, desc: '합주실의 낡은 앰프. 화·목.', lines: ['합주가 처음으로 한 번도 안 끊기고 끝났다.'] },
  { id: 'mun',       name: '모의UN·방송부',     days: [0, 2], delta: { language: 0.5, debate: 0.4, hp: -2 }, desc: '영어 토론과 교내 방송. 월·수.', lines: ['점심 방송 신청곡 사연을 읽다 웃음이 터졌다.'] },
];

/** 한 주 정리 한 줄 — 몸 상태가 먼저 */
export const WEEK_LINES = {
  collapse: ['집에 오자마자 교복도 못 벗고 쓰러져 잤다.', '눈을 떠 보니 새벽이었다. 가방은 현관에 그대로였다.'],
  doze: ['3교시 수학 시간, 정신을 차려 보니 칠판이 다 지워져 있었다.', '필기한 줄 알았는데 노트에 지렁이만 기어갔다.'],
  broke: ['카드 잔액 부족. 학원 앞에서 발길을 돌렸다.', '지갑을 열었다 닫았다. 이번 주는 여기까지.'],
  calm: ['특별할 것 없는 한 주였다. 그게 나쁘지 않았다.', '시간표대로 한 주를 보냈다.'],
};

/** 이 값들은 Delta 타입 확인용 (편집할 필요 없음) */
export type { Delta };
