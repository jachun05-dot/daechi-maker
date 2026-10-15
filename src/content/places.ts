/* =========================================================
   주말 서울 지도 — 토·일 한 번씩, 한 달에 8번 방문
   - actions: 그곳에서 할 수 있는 일 (2개면 방문할 때 고른다)
   - bg: 장면 배경 키 (backgrounds.ts)
   - 지도 이미지: src/assets/images/ui/map.png (없으면 목록형 지도)
   ========================================================= */
import type { Delta } from '@/engine/timetable';

export interface PlaceAction { label: string; delta: Delta; line: string }
export interface Place { id: string; name: string; district: string; bg: string; actions: PlaceAction[] }

export const PLACES: Place[] = [
  { id: 'daechi', name: '대치동 학원가', district: '강남', bg: 'academy', actions: [
    { label: '주말 특강·모의고사', delta: { int: 3, science: 2, language: 1, hp: -8, stress: 5, money: -30000 }, line: '주말에도 대치동은 쉬지 않는다. 문제지가 손때로 까매졌다.' }] },
  { id: 'cheongdam', name: '청담동', district: '강남', bg: 'cheongdam', actions: [
    { label: '라운지', delta: { cha: 3, sense: 1, money: -40000, stress: -3 }, line: '상류층의 대화는 무겁고 반짝였다. 견뎌냈다.' },
    { label: '브런치 카페 알바', delta: { cha: 2, money: 60000, hp: -8, stress: 3 }, line: '에그 베네딕트 서른 접시. 팔이 떨어질 것 같다.' }] },
  { id: 'bongeunsa', name: '봉은사·코엑스', district: '강남', bg: 'palace', actions: [
    { label: '산책과 명상', delta: { spirit: 3, stress: -8, hp: 2 }, line: '풍경 소리에 눈을 감았다. 아주 먼 곳에서 북소리가 들린 것 같았다.' }] },
  { id: 'hannam', name: '한남동 갤러리', district: '용산', bg: 'gallery', actions: [
    { label: '전시·네트워킹', delta: { cha: 3, sense: 2, money: -20000 }, line: '그림 앞에서 낯선 어른들과 이야기를 나눴다.' }] },
  { id: 'intl', name: '한성국제고', district: '용산', bg: 'school', actions: [
    { label: '국제 교류 행사', delta: { language: 2, cha: 1, spirit: 1, hp: -5 }, line: '영어와 일본어가 뒤섞인 토론. 머리가 지끈하지만 재밌다.' }] },
  { id: 'palace', name: '경복궁·고궁박물관', district: '종로', bg: 'palace', actions: [
    { label: '궁궐 산책', delta: { spirit: 3, int: 1, stress: -5, money: -5000 }, line: '경회루 연못에 비친 처마를 한참 바라봤다. 언젠가 이 물을 본 적이 있다.' }] },
  { id: 'daehakro', name: '대학로', district: '종로', bg: 'daehakro', actions: [
    { label: '연극 관람', delta: { acting: 2, sense: 2, stress: -6, money: -30000 }, line: '맨 앞줄에서 배우의 숨소리까지 들었다.' },
    { label: '소극장 알바', delta: { acting: 1, money: 50000, hp: -8, stress: 2 }, line: '객석을 정리하며 커튼콜의 박수를 로비에서 들었다.' }] },
  { id: 'nakwon', name: '낙원상가', district: '종로', bg: 'music', actions: [
    { label: '악기점 구경', delta: { vocal: 1, sense: 2, stress: -4, money: -15000 }, line: '오래된 악기 냄새. 손끝이 저절로 현을 짚었다.' }] },
  { id: 'hongdae', name: '홍대', district: '마포', bg: 'hongdae', actions: [
    { label: '버스킹·라이브 클럽', delta: { vocal: 2, dance: 2, sense: 1, stress: -10, hp: -6, money: -20000 }, line: '지하 클럽의 베이스가 심장을 쳤다. 숨이 트였다.' }] },
  { id: 'hangang', name: '한강공원', district: '한강', bg: 'hangang', actions: [
    { label: '조깅', delta: { fit: 3, hp: -4, stress: -8 }, line: '강바람을 가르며 5km를 달렸다.' }] },
  { id: 'schoolgym', name: '이화고 체육관', district: '학교', bg: 'gym', actions: [
    { label: '주말 훈련', delta: { fit: 4, hp: -8, stress: -3 }, line: '텅 빈 체육관에 공 튀는 소리만 울렸다.' }] },
  { id: 'hospital', name: '대학병원', district: '종로', bg: 'hospital', actions: [
    { label: '봉사활동', delta: { medicine: 3, sense: 1, hp: -6, stress: 1 }, line: '환자 휠체어를 밀며 병동을 돌았다. 고맙다는 말이 오래 남았다.' }] },
  { id: 'home', name: '집', district: '집', bg: 'room', actions: [
    { label: '휴식', delta: { hp: 18, stress: -10 }, line: '늦잠을 자고, 엄마가 깎아 준 사과를 먹었다.' }] },
];

export const placeById = (id: string) => PLACES.find(p => p.id === id);
