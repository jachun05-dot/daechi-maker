/* =========================================================
   평일 사건 두 가지
   1) SCHOOL — 학교 사건: 멈추지 않고 그날 칸에 한 줄로 붙는다 (한 주에 1~2번)
      check 가 있으면 그 능력으로 판정 → ok / ng
   2) CHOICES — 작은 선택: 진행을 잠깐 멈추고 고른다 (한 주에 1~2번)
      skip: 그날 그 칸(slot 0 방과후 / 1 야간) 일정을 빠진다 · next: 다음 날 doze(졸음) / fresh(개운)
   eff 의 숫자는 화면에 보이는 그대로 오른다 (성장 배율을 곱하지 않는다)
   남주들은 호감도 개편 전이라 넣지 않았다 — 지유·엄마·반 친구·동생만
   ========================================================= */
import type { BaseStat, GameState, SkillKey } from '@/engine/types';
import type { Delta } from '@/engine/timetable';
import type { Turn } from './calendar';

export interface Outcome { text: string; eff?: Delta }
export interface SchoolEvent {
  id: string; icon: string; title: string;
  when?: (st: GameState, T: Turn) => boolean;
  /** 이 능력으로 판정 (기준은 balance.ts roll 의 그달 기준) */
  check?: BaseStat | SkillKey;
  ok: Outcome; ng?: Outcome;
}

export const SCHOOL: SchoolEvent[] = [
  { id: 'quiz', icon: '📝', title: '쪽지시험', check: 'int',
    ok: { text: '쪽지시험 만점. 선생님이 이름을 불렀다.', eff: { stress: -3 } },
    ng: { text: '쪽지시험 3점. 10점 만점이었다.', eff: { stress: 3 } } },
  { id: 'present', icon: '🎤', title: '수행평가 발표', check: 'cha',
    ok: { text: '발표가 끝나자 박수가 나왔다. 질문도 하나 없었다.', eff: { cha: 1, stress: -2 } },
    ng: { text: 'PPT가 안 열렸다. 말로만 5분을 버텼다.', eff: { stress: 4 } } },
  { id: 'art', icon: '🎨', title: '미술 수행평가', check: 'sense',
    ok: { text: '미술 선생님이 내 그림을 교실 뒤에 걸었다.', eff: { sense: 1 } },
    ng: { text: '수채화가 번져서 사과가 토마토가 됐다.', eff: { stress: 2 } } },
  { id: 'dodge', icon: '🏐', title: '체육 시간 피구', check: 'fit',
    ok: { text: '피구 마지막 생존자. 반 전체가 이름을 연호했다.', eff: { stress: -4 } },
    ng: { text: '첫 공에 맞고 나왔다. 관중석이 편했다.', eff: { stress: 1 } } },
  { id: 'singtest', icon: '🎵', title: '음악 가창 시험', check: 'vocal',
    ok: { text: '가창 시험에서 음악 선생님이 끝까지 들었다. 보통은 중간에 끊는다.', eff: { vocal: 1, stress: -2 } },
    ng: { text: '음악 시간 가창 시험. 긴장해서 가사를 다 까먹었다.', eff: { stress: 3 } } },
  { id: 'lab', icon: '🧪', title: '과학실 실험', check: 'science',
    ok: { text: '실험 조에서 내가 계산한 값이 정답이었다.', eff: { science: 1 } },
    ng: { text: '리트머스 종이를 반대로 읽었다. 조원들이 한숨을 쉬었다.', eff: { stress: 2 } } },
  { id: 'english', icon: '🗣', title: '영어 말하기', check: 'language',
    ok: { text: '원어민 선생님이 "Wow"를 두 번 했다.', eff: { language: 1 } },
    ng: { text: '"I am fine thank you and you"까지만 기억났다.', eff: { stress: 2 } } },
  { id: 'malatang', icon: '🍜', title: '급식에 마라탕', ok: { text: '오늘 급식은 마라탕. 3년 중 최고의 점심이었다.', eff: { stress: -5 } } },
  { id: 'mintchoco', icon: '🍨', title: '급식 디저트', ok: { text: '디저트가 민트초코였다. 반이 정확히 둘로 갈라졌다.', eff: { stress: -2 } } },
  { id: 'bread', icon: '🥐', title: '매점 빵 전쟁', check: 'fit',
    ok: { text: '종 치자마자 뛰어서 소보로빵 마지막 하나를 쟁취했다.', eff: { stress: -3, money: -1500 } },
    ng: { text: '매점에 도착하니 빵 진열대가 텅 비어 있었다.', eff: { stress: 1 } } },
  { id: 'seat', icon: '🪑', title: '자리 바꾸기', ok: { text: '자리를 바꿨다. 창가 맨 뒷자리. 행운이 다 여기 쓰였다.', eff: { stress: -3 } } },
  { id: 'rumor', icon: '💬', title: '반에 도는 소문', ok: { text: '옆 반에 연예인 연습생이 있다는 소문이 돌았다. 쉬는 시간마다 복도가 막혔다.' } },
  { id: 'shower', icon: '🌧', title: '갑자기 소나기', ok: { text: '하굣길 소나기. 우산이 없어서 편의점 처마 밑에서 20분 서 있었다.', eff: { hp: -2 } } },
  { id: 'firedrill', icon: '🚨', title: '소방 훈련', ok: { text: '소방 훈련으로 수업 한 시간이 날아갔다. 운동장 햇볕이 따뜻했다.', eff: { stress: -2 } } },
  { id: 'counsel', icon: '🗂', title: '담임 상담', ok: { text: '담임 선생님이 생활기록부를 넘기며 말했다. "너 요즘 표정이 좋아졌다."', eff: { stress: -3 } } },
  // 그달 학사 일정에 맞춰
  { id: 'examseat', icon: '📚', title: '도서관 자리 전쟁', when: (_s, T) => T.event === 'exam',
    ok: { text: '시험 기간 도서관 자리 전쟁. 아침 7시에 와도 자리가 없었다.', eff: { stress: 3 } } },
  { id: 'festprep', icon: '🎪', title: '축제 준비', when: (_s, T) => T.event === 'festival',
    ok: { text: '방과 후 축제 부스 꾸미기. 풀칠하다 보니 다들 친해졌다.', eff: { cha: 1, stress: -2 } } },
  { id: 'relay', icon: '🏃', title: '계주 연습', when: (_s, T) => T.event === 'sports', check: 'fit',
    ok: { text: '계주 연습에서 바통을 한 번도 안 떨어뜨렸다.', eff: { fit: 1 } },
    ng: { text: '계주 연습에서 바통을 떨어뜨렸다. 세 번.', eff: { stress: 2 } } },
  { id: 'dday', icon: '⏳', title: '수능 D-100', when: (_s, T) => T.year === 3 && T.month >= 7 && T.month <= 9,
    ok: { text: '교실 칠판 구석에 D-100이 적혔다. 누가 그 옆에 우는 얼굴을 그렸다.', eff: { stress: 4, int: 1 } } },
  { id: 'firstday', icon: '🌸', title: '새 학기', when: (_s, T) => T.month === 3,
    ok: { text: '새 학기 자기소개. 다들 "취미는 잠"이라고 했다.', eff: { stress: -2 } } },
];

/* ---------- 작은 선택 ---------- */
export interface ChoiceOpt { label: string; eff?: Delta; skip?: boolean; next?: 'doze' | 'fresh'; line: string }
export interface ChoiceEvent {
  id: string; icon: string; title: string; text: string;
  /** 0 방과후 / 1 야간 — skip 하면 그 칸을 빠진다 */
  slot: 0 | 1;
  when?: (st: GameState, T: Turn) => boolean;
  options: ChoiceOpt[];
}

export const CHOICES: ChoiceEvent[] = [
  { id: 'tteok', icon: '🌶', title: '떡볶이 유혹', slot: 0, text: '하굣길, 지유가 팔짱을 꼈다. "떡볶이 먹으러 가자. 딱 30분만."',
    options: [
      { label: '간다. 30분은 거짓말이겠지만', eff: { stress: -10, money: -6000 }, skip: true, line: '30분은 두 시간이 됐다. 배도 마음도 불렀다.' },
      { label: '"오늘은 안 돼" 하고 간다', eff: { stress: 2 }, line: '지유가 입을 삐죽였다. 떡볶이 냄새가 따라왔다.' }] },
  { id: 'allnighter', icon: '🌙', title: '시험 전날 밤', slot: 1, when: (_s, T) => T.event === 'exam' || T.event === 'suneung',
    text: '밤 12시. 시험 범위가 아직 절반 남았다.',
    options: [
      { label: '밤을 샌다', eff: { int: 2, stress: 4 }, next: 'doze', line: '새벽 다섯 시, 마지막 장을 넘겼다. 해가 떴다. 눈이 감겼다.' },
      { label: '잔다. 컨디션이 실력이다', eff: { stress: -3 }, next: 'fresh', line: '불을 껐다. 반은 포기, 반은 믿음이었다.' }] },
  { id: 'cat', icon: '🐈', title: '비 오는 날 고양이', slot: 0, text: '비 오는 하굣길, 젖은 길고양이가 자꾸 따라온다.',
    options: [
      { label: '편의점에서 츄르를 산다', eff: { money: -2000, sense: 1, stress: -4 }, line: '고양이가 츄르를 다 먹고 다리에 머리를 비볐다. 오늘은 그걸로 됐다.' },
      { label: '미안, 하고 발걸음을 재촉한다', line: '모퉁이를 돌면서 한 번 뒤돌아봤다. 고양이는 거기 앉아 있었다.' }] },
  { id: 'skipacademy', icon: '🌉', title: '학원 땡땡이', slot: 1, text: '학원 앞. 오늘따라 한강 바람이 부른다.',
    options: [
      { label: '땡땡이 치고 한강에 간다', eff: { stress: -12, sense: 1 }, skip: true, line: '편의점 라면과 한강 야경. 엄마한테는 비밀이다.' },
      { label: '들어간다. 나는 성실하다', eff: { stress: 2 }, line: '강의실 창문으로 바람 소리만 들었다.' }] },
  { id: 'mombday', icon: '🎂', title: '엄마 생일', slot: 0, text: '아침에 달력을 보고 얼어붙었다. 오늘 엄마 생일이다.',
    options: [
      { label: '케이크를 사 간다', eff: { money: -20000, stress: -3 }, line: '엄마가 촛불을 끄다 말고 울컥했다. 나도 따라 울컥했다.' },
      { label: '정성껏 편지를 쓴다', eff: { sense: 1, stress: -2 }, line: '엄마가 편지를 지갑에 넣었다. 접은 자국이 닳을 때까지 꺼내 볼 거다.' }] },
  { id: 'jiyucall', icon: '📞', title: '지유의 전화', slot: 1, text: '지유한테서 전화. 목소리가 이상하다. "나 오늘 좀 힘들어."',
    options: [
      { label: '한 시간 동안 들어 준다', eff: { cha: 1, stress: -2 }, skip: true, line: '지유가 마지막에 웃었다. "고마워. 너밖에 없다."' },
      { label: '"내일 학교에서 얘기하자"', eff: { stress: 3 }, line: '전화를 끊고 문제집을 폈다. 한 줄도 안 읽혔다.' }] },
  { id: 'sibling', icon: '📐', title: '동생 숙제', slot: 0, text: '동생이 수학 숙제를 들고 문 앞에 서 있다. 눈이 반짝인다.',
    options: [
      { label: '앉아서 같이 푼다', eff: { cha: 1, int: 1 }, skip: true, line: '가르치다 보니 내가 몰랐던 걸 알았다. 동생이 엄지를 들었다. "천재 아냐?"' },
      { label: '"인터넷에 다 나와"', line: '동생이 문을 쾅 닫았다. 저녁 반찬이 하나 줄었다.' }] },
  { id: 'grandma', icon: '🧳', title: '버스 정류장', slot: 0, text: '버스 정류장에서 할머니가 무거운 장바구니를 들고 계단을 못 오르신다.',
    options: [
      { label: '집까지 들어 드린다', eff: { fit: 1, sense: 1, hp: -3 }, line: '할머니가 귤 세 개를 손에 쥐여 주셨다. 끝까지 사양했는데 졌다.' },
      { label: '계단까지만 도와드린다', eff: { stress: -1 }, line: '할머니가 고맙다며 웃으셨다. 버스는 놓쳤다.' }] },
  { id: 'youtube', icon: '📱', title: '새벽 2시 알고리즘', slot: 1, text: '자기 전에 딱 한 편만 보려고 했다. 새벽 2시다.',
    options: [
      { label: '한 편만 더…', eff: { stress: -4 }, next: 'doze', line: '추천 영상이 끝이 없었다. 해가 뜨는 것도 봤다.' },
      { label: '휴대폰을 엎어 놓고 잔다', next: 'fresh', line: '어둠 속에서 알림이 두 번 울렸다. 이겼다.' }] },
  { id: 'button', icon: '🪡', title: '교복 단추', slot: 0, text: '아침에 교복 단추가 툭 떨어졌다. 등교까지 10분.',
    options: [
      { label: '직접 꿰맨다', eff: { style: 1, sense: 1 }, line: '바늘에 두 번 찔렸다. 단추는 반듯하게 달렸다.' },
      { label: '옷핀으로 버틴다', eff: { stress: -1 }, line: '하루 종일 옷핀이 눈에 밟혔다. 아무도 몰랐다.' }] },
  { id: 'shuttle', icon: '🚌', title: '셔틀 놓침', slot: 1, text: '학원 셔틀이 눈앞에서 떠났다.',
    options: [
      { label: '택시를 탄다', eff: { money: -8000 }, line: '택시 기사님이 "공부하느라 고생 많다"며 라디오를 꺼 주셨다.' },
      { label: '뛰어간다', eff: { fit: 1, hp: -4 }, line: '숨이 턱까지 찼다. 수업 시작 1분 전에 도착했다.' },
      { label: '포기하고 집에 간다', eff: { stress: -5 }, skip: true, line: '집에 오니 엄마가 "학원은?" 하고 물었다. 대답 대신 손을 씻었다.' }] },
  { id: 'cvs', icon: '🏪', title: '편의점 신상', slot: 0, text: '편의점에 신상 디저트가 나왔다. 줄이 길다.',
    options: [
      { label: '줄을 선다', eff: { money: -3500, stress: -4 }, line: '맛있었다. 줄 선 시간까지 맛있었다.' },
      { label: '다음에. 나는 절제하는 사람이다', eff: { stress: 1 }, line: '다음 날 품절이었다.' }] },
  { id: 'president', icon: '🗳', title: '반장 선거', slot: 0, when: (_s, T) => T.month === 3 || T.month === 8, text: '담임 선생님이 반장 후보 추천을 받는다. 누가 내 이름을 불렀다.',
    options: [
      { label: '나간다. 연설도 한다', eff: { cha: 3, stress: 4 }, line: '공약은 "급식 마라탕 월 2회". 압도적 지지를 받았다.' },
      { label: '정중히 사양한다', line: '다른 애가 반장이 됐다. 마라탕 공약은 내 아이디어였다.' }] },
  { id: 'freerider', icon: '👥', title: '조별 과제', slot: 1, text: '조별 과제 마감 하루 전. 조원 한 명이 아직 아무것도 안 했다.',
    options: [
      { label: '혼자 다 한다', eff: { int: 1, sense: 1, stress: 6 }, skip: true, line: '새벽까지 PPT를 만들었다. 발표 때 그 조원이 제일 크게 박수를 쳤다.' },
      { label: '단호하게 말한다', eff: { cha: 2, stress: 2 }, line: '조원이 미안하다며 밤새 자료를 찾아왔다. 사람은 말해야 안다.' }] },
  { id: 'umbrella', icon: '☂', title: '우산 하나', slot: 0, text: '하굣길 비. 지유는 우산이 없다. 내 우산은 작다.',
    options: [
      { label: '같이 쓴다. 어깨는 젖겠지만', eff: { stress: -3, hp: -1 }, line: '둘 다 한쪽 어깨가 흠뻑 젖었다. 이상하게 웃음이 났다.' },
      { label: '지유한테 우산을 준다', eff: { cha: 1, hp: -3 }, line: '비를 맞으며 뛰었다. 지유가 다음 날 핫팩을 줬다.' }] },
  { id: 'friday', icon: '🎬', title: '금요일 밤', slot: 1, when: () => true, text: '금요일 밤. 보고 싶던 영화가 오늘 개봉했다.',
    options: [
      { label: '심야 영화를 본다', eff: { stress: -8, sense: 1, money: -12000 }, skip: true, line: '엔딩 크레딧이 다 올라갈 때까지 앉아 있었다.' },
      { label: '주말에 보자', line: '스포일러를 피해 SNS를 끊었다. 그것도 수행이었다.' }] },
  { id: 'cold', icon: '🤧', title: '감기 기운', slot: 0, when: s => s.hp < 50, text: '목이 칼칼하고 몸이 무겁다. 감기 기운이다.',
    options: [
      { label: '병원에 들렀다 일찍 잔다', eff: { money: -5000, hp: 12 }, skip: true, line: '주사 한 대에 눈물이 찔끔. 그래도 다음 날 훨씬 나았다.' },
      { label: '버틴다', eff: { hp: -5 }, next: 'doze', line: '하루 종일 콧물과 싸웠다. 졌다.' }] },
  { id: 'gift', icon: '🎁', title: '친구 생일', slot: 0, text: '내일이 반 친구 생일이다. 단톡방에 생일 축하 릴레이가 시작됐다.',
    options: [
      { label: '손편지와 작은 선물', eff: { money: -10000, cha: 2 }, line: '친구가 편지를 읽다가 고개를 숙였다. 울고 있었다.' },
      { label: '기프티콘을 보낸다', eff: { money: -4500, cha: 1 }, line: '"아아 기프티콘 고마워ㅠㅠ" 효율적인 우정이다.' }] },
  { id: 'room', icon: '🧹', title: '엄마의 잔소리', slot: 1, text: '"방이 이게 뭐니." 엄마의 잔소리가 문을 넘어 들어왔다.',
    options: [
      { label: '지금 당장 치운다', eff: { stress: -3, hp: -1 }, skip: true, line: '책상 밑에서 잃어버린 이어폰을 찾았다. 청소는 보물찾기였다.' },
      { label: '"이따가 할게"', eff: { stress: 3 }, line: '이따가는 오지 않았다. 잔소리는 두 번 왔다.' }] },
  { id: 'levelup', icon: '📊', title: '학원 레벨 테스트', slot: 1, text: '오늘 학원 레벨 테스트. 결과에 따라 반이 바뀐다.',
    options: [
      { label: '전력을 다한다', eff: { int: 2, stress: 4 }, line: '윗반으로 올라갔다. 첫 수업부터 무슨 말인지 몰랐다.' },
      { label: '적당히 본다. 지금 반이 편하다', eff: { stress: -2 }, line: '반이 그대로다. 친구들이 반겼다.' }] },
  { id: 'busk', icon: '🎸', title: '홍대 길거리 공연', slot: 1, text: '학원 가는 길, 홍대 쪽에서 버스킹 소리가 들린다. 노래가 좋다.',
    options: [
      { label: '끝까지 듣고 간다', eff: { sense: 1, vocal: 1 }, skip: true, line: '마지막 곡에서 따라 불렀다. 가수가 나를 보고 웃었다.' },
      { label: '한 곡만 듣고 간다', eff: { stress: -2 }, line: '한 곡이 하루 종일 귀에 남았다.' }] },
  { id: 'mirror', icon: '🪞', title: '헤어 변신', slot: 0, text: '거울 속 앞머리가 너무 길다. 셀프 커트를 해 볼까?',
    options: [
      { label: '과감하게 자른다', eff: { style: -1, stress: -2 }, line: '앞머리가 일자가 됐다. 지유가 3초간 말을 잇지 못했다.' },
      { label: '미용실에 간다', eff: { style: 2, money: -15000 }, line: '디자이너 선생님이 "자르러 와 줘서 다행"이라고 했다.' }] },
  { id: 'running', icon: '🏃‍♀️', title: '아침 조깅', slot: 0, text: '알람보다 30분 일찍 눈이 떠졌다. 날씨가 좋다.',
    options: [
      { label: '나가서 뛴다', eff: { fit: 2, hp: -2 }, next: 'fresh', line: '아침 공기가 차가웠다. 하루가 길게 느껴졌다.' },
      { label: '다시 잔다. 30분은 소중하다', eff: { hp: 3 }, line: '30분의 꿀잠. 인생 최고의 30분이었다.' }] },
  { id: 'scholar', icon: '🏅', title: '교내 경시대회', slot: 1, when: s => s.stat.int >= 60, text: '교내 수학 경시대회 공지가 붙었다. 신청 마감이 오늘이다.',
    options: [
      { label: '신청하고 오늘 밤 기출을 푼다', eff: { int: 2, science: 1, stress: 3 }, skip: true, line: '기출 열 문제 중 일곱 개를 맞혔다. 해 볼 만하다.' },
      { label: '다음 기회에', line: '공지 앞을 지나칠 때마다 조금 아쉬웠다.' }] },
];
