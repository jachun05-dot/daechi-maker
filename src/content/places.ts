/* =========================================================
   주말 서울 지도 — 토·일 × (낮·저녁) = 한 주에 4칸, 한 달에 16칸
   - pos: 지도 위 핀 위치 [가로 %, 세로 %] (왼쪽 위가 0,0 · 지도 비율 4:5)
     지도 이미지(src/assets/images/ui/map.png)를 넣으면 이 숫자만 그림에 맞추면 된다
   - district: 구역. 다른 구역으로 움직이면 교통비·체력이 든다 (balance.ts weekend)
   - outdoor: 야외 — 비·눈 오는 날 효율이 떨어진다
   - open: 지도에 나타나는 조건 (없으면 처음부터)
       turn: 이 턴부터 (0 = 1학년 3월) · year: 이 학년부터 · months: 이 달에만 (계절 한정)
       spirit: 감응이 이만큼 넘어야 보이는 숨은 장소
     ※ 그 장소에 걸린 메인 이벤트는 장소가 열린 뒤에 "!"로 뜬다 (그 전엔 기다린다)
   - actions: 그곳에서 할 수 있는 일
       long: 하루 종일 (낮+저녁 두 칸)
       unlock: 단골 레벨이 이만큼 돼야 열린다 (단골 기준은 balance.ts)
       months: 이 달에만 고를 수 있다
   ========================================================= */
import type { Delta } from '@/engine/timetable';

export interface PlaceAction { label: string; delta: Delta; line: string; long?: boolean; unlock?: number; months?: number[] }
export interface PlaceOpen { turn?: number; year?: number; months?: number[]; spirit?: number }
export interface Place {
  id: string; name: string; district: string; bg: string; pos: [number, number];
  outdoor?: boolean; open?: PlaceOpen; hint?: string; actions: PlaceAction[];
}

export const PLACES: Place[] = [
  /* ---------- 강남 ---------- */
  { id: 'home', name: '집', district: '강남', bg: 'room', pos: [89, 92], actions: [
    { label: '휴식', delta: { hp: 18, stress: -10 }, line: '늦잠을 자고, 엄마가 깎아 준 사과를 먹었다.' }] },
  { id: 'daechi', name: '대치동 학원가', district: '강남', bg: 'academy', pos: [76, 85], actions: [
    { label: '주말 특강·모의고사', long: true, delta: { int: 3, science: 2, language: 1, hp: -8, stress: 5, money: -30000 }, line: '주말에도 대치동은 쉬지 않는다. 문제지가 손때로 까매졌다.' },
    { label: '자습실', delta: { int: 2, science: 1, hp: -4, stress: 3, money: -8000 }, line: '독서실 칸막이 안에서 몇 시간을 버텼다.' },
    { label: '조교 알바', unlock: 3, delta: { int: 1, money: 70000, hp: -8, stress: 3 }, line: '채점을 하다 보니 남의 실수가 내 공부가 됐다.' }] },
  { id: 'schoolgym', name: '이화고 체육관', district: '강남', bg: 'gym', pos: [60, 90], actions: [
    { label: '주말 훈련', delta: { fit: 4, hp: -8, stress: -3 }, line: '텅 빈 체육관에 공 튀는 소리만 울렸다.' },
    { label: '코치 보조', unlock: 3, delta: { fit: 3, cha: 1, money: 30000, hp: -8 }, line: '초등부 아이들 줄넘기를 세다가 목이 쉬었다.' }] },
  { id: 'cheongdam', name: '청담동', district: '강남', bg: 'cheongdam', pos: [73, 66], open: { turn: 1 }, hint: '라운지와 편집숍이 모인 거리', actions: [
    { label: '라운지', delta: { cha: 3, sense: 1, money: -40000, stress: -3 }, line: '상류층의 대화는 무겁고 반짝였다. 견뎌냈다.' },
    { label: '브런치 카페 알바', long: true, delta: { cha: 2, money: 60000, hp: -8, stress: 3 }, line: '에그 베네딕트 서른 접시. 팔이 떨어질 것 같다.' }] },
  { id: 'bongeunsa', name: '봉은사·코엑스', district: '강남', bg: 'palace', pos: [87, 73], outdoor: true, actions: [
    { label: '산책과 명상', delta: { spirit: 3, stress: -8, hp: 2 }, line: '풍경 소리에 눈을 감았다. 아주 먼 곳에서 북소리가 들린 것 같았다.' },
    { label: '템플스테이', long: true, unlock: 3, delta: { spirit: 6, stress: -18, hp: 6, money: -30000 }, line: '새벽 예불 종소리. 오래 잊고 있던 숨이 돌아왔다.' }] },

  /* ---------- 용산 ---------- */
  { id: 'hannam', name: '한남동 갤러리', district: '용산', bg: 'gallery', pos: [55, 51], open: { turn: 2 }, hint: '후원 행사가 자주 열리는 갤러리', actions: [
    { label: '전시·네트워킹', delta: { cha: 3, sense: 2, money: -20000 }, line: '그림 앞에서 낯선 어른들과 이야기를 나눴다.' },
    { label: '전시 도슨트', unlock: 3, delta: { cha: 2, voice: 2, sense: 1, hp: -5 }, line: '관람객 앞에서 그림 이야기를 했다. 목소리가 생각보다 단단했다.' }] },
  { id: 'intl', name: '한성국제고', district: '용산', bg: 'school', pos: [41, 47], open: { turn: 3 }, hint: '주말마다 교류 행사가 있다', actions: [
    { label: '국제 교류 행사', delta: { language: 2, cha: 1, spirit: 1, hp: -5 }, line: '영어와 일본어가 뒤섞인 토론. 머리가 지끈하지만 재밌다.' },
    { label: '모의 정상회의 진행', unlock: 3, delta: { debate: 3, language: 2, hp: -6, stress: 2 }, line: '의장석에 앉아 세 나라 대표의 말을 정리했다.' }] },

  /* ---------- 종로 ---------- */
  { id: 'palace', name: '경복궁·고궁박물관', district: '종로', bg: 'palace', pos: [42, 21], outdoor: true, open: { turn: 3 }, actions: [
    { label: '궁궐 산책', delta: { spirit: 3, int: 1, stress: -5, money: -5000 }, line: '경회루 연못에 비친 처마를 한참 바라봤다. 언젠가 이 물을 본 적이 있다.' },
    { label: '궁궐 해설 봉사', unlock: 3, delta: { language: 1, debate: 1, spirit: 2, cha: 1, hp: -4 }, line: '외국인 관광객에게 근정전 이야기를 했다. 이상하게 막힘이 없었다.' }] },
  { id: 'palace_night', name: '경복궁 야간개방', district: '종로', bg: 'palace_night', pos: [33, 15], outdoor: true, open: { spirit: 60, months: [5, 9, 10] }, hint: '감응이 높아야 보이는 곳', actions: [
    { label: '밤의 궁궐', delta: { spirit: 5, sense: 2, stress: -6, money: -3000 }, line: '청사초롱 불빛 사이로 걸었다. 발밑의 돌이, 사백 년 전의 무게로 느껴졌다.' }] },
  { id: 'daehakro', name: '대학로', district: '종로', bg: 'daehakro', pos: [63, 19], open: { turn: 2 }, hint: '소극장이 모인 거리', actions: [
    { label: '연극 관람', delta: { acting: 2, sense: 2, stress: -6, money: -30000 }, line: '맨 앞줄에서 배우의 숨소리까지 들었다.' },
    { label: '소극장 알바', long: true, delta: { acting: 1, money: 50000, hp: -8, stress: 2 }, line: '객석을 정리하며 커튼콜의 박수를 로비에서 들었다.' },
    { label: '무대 단역', unlock: 3, delta: { acting: 3, voice: 1, hp: -8, stress: -2 }, line: '대사 한 줄짜리 행인 역. 조명 아래 선 삼 초가 길었다.' }] },
  { id: 'nakwon', name: '낙원상가', district: '종로', bg: 'music', pos: [51, 30], open: { turn: 4 }, actions: [
    { label: '악기점 구경', delta: { vocal: 1, sense: 2, stress: -4, money: -15000 }, line: '오래된 악기 냄새. 손끝이 저절로 현을 짚었다.' },
    { label: '수리 공방 견습', unlock: 3, delta: { vocal: 1, sense: 2, money: 30000, hp: -4 }, line: '줄 감는 법을 배웠다. 낡은 기타가 다시 울었다.' }] },
  { id: 'hospital', name: '대학병원', district: '종로', bg: 'hospital', pos: [70, 30], actions: [
    { label: '봉사활동', delta: { medicine: 3, sense: 1, hp: -6, stress: 1 }, line: '환자 휠체어를 밀며 병동을 돌았다. 고맙다는 말이 오래 남았다.' },
    { label: '병동 보조', unlock: 3, delta: { medicine: 4, science: 1, hp: -8, stress: 2 }, line: '간호사 선생님이 혈압계 쓰는 법을 알려 줬다.' }] },
  { id: 'skating', name: '서울광장 스케이트장', district: '종로', bg: 'winter', pos: [44, 37], outdoor: true, open: { months: [12] }, hint: '겨울에만 열린다', actions: [
    { label: '스케이트', delta: { fit: 2, cha: 1, stress: -10, money: -5000 }, line: '세 번 넘어지고 네 번째에 미끄러지듯 나아갔다.' }] },

  /* ---------- 마포 ---------- */
  { id: 'hongdae', name: '홍대', district: '마포', bg: 'hongdae', pos: [15, 41], open: { turn: 4 }, hint: '버스킹과 라이브 클럽', actions: [
    { label: '버스킹·라이브 클럽', delta: { vocal: 2, dance: 2, sense: 1, stress: -10, hp: -6, money: -20000 }, line: '지하 클럽의 베이스가 심장을 쳤다. 숨이 트였다.' },
    { label: '오픈마이크', unlock: 3, delta: { vocal: 3, sense: 1, stress: -8, hp: -6 }, line: '떨리는 손으로 마이크를 잡았다. 첫 소절이 나오자 떨림이 멎었다.' }] },

  /* ---------- 한강 ---------- */
  { id: 'hangang', name: '한강공원', district: '한강', bg: 'hangang', pos: [36, 66], outdoor: true, actions: [
    { label: '조깅', delta: { fit: 3, hp: -4, stress: -8 }, line: '강바람을 가르며 5km를 달렸다.' },
    { label: '러닝 크루', unlock: 3, delta: { fit: 4, cha: 1, hp: -8, stress: -8 }, line: '처음 보는 사람들과 발을 맞춰 뛰었다. 끝나고 다 같이 라면을 먹었다.' }] },
  { id: 'yeouido', name: '여의도', district: '한강', bg: 'hangang', pos: [17, 62], outdoor: true, open: { months: [4, 10] }, hint: '봄엔 벚꽃, 가을엔 불꽃축제', actions: [
    { label: '벚꽃길 산책', months: [4], delta: { sense: 2, stress: -12, hp: -2 }, line: '윤중로 벚꽃이 눈처럼 쏟아졌다. 배꽃이 아니어도, 이상하게 마음이 아렸다.' },
    { label: '불꽃축제', months: [10], delta: { sense: 2, cha: 1, stress: -12, hp: -4 }, line: '밤하늘이 터질 때마다 사람들이 함께 탄성을 질렀다.' }] },

  /* ---------- 서울 밖·숨은 곳 ---------- */
  { id: 'bukhansan', name: '북한산 둘레길', district: '북한산', bg: 'bukhansan', pos: [56, 4], outdoor: true, open: { year: 2, spirit: 40 }, hint: '감응이 높아야 보이는 곳', actions: [
    { label: '산길 걷기', long: true, delta: { fit: 3, spirit: 5, hp: -8, stress: -10 }, line: '비탈진 산길에서 숨이 찼다. 어디선가 본 길이었다. 빗속을 걷던, 두 사람의 뒷모습.' }] },
  { id: 'campus', name: '한국대 캠퍼스', district: '관악', bg: 'campus', pos: [27, 95], open: { year: 3 }, hint: '졸업한 선배들이 다니는 대학', actions: [
    { label: '공개 강의·캠퍼스 투어', delta: { int: 2, science: 1, language: 1, hp: -5 }, line: '계단식 강의실 맨 뒷줄에서 대학 강의를 들었다. 1년 뒤의 나를 상상했다.' }] },
];

export const placeById = (id: string) => PLACES.find(p => p.id === id);
