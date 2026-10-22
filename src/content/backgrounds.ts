/* =========================================================
   배경 목록
   - 이미지: src/assets/images/bg/{key}.jpg (또는 .png/.webp)
             시대 전용 그림은 src/assets/images/eras/{시대}/bg/{key}.jpg 가 우선
   - 이미지가 없으면 color 단색으로 표시됩니다.
   - 스토리에서 [bg key] 로 사용
   - focus: 화면이 그림보다 좁을 때 어느 쪽을 보여 줄지 (CSS background-position, 기본 'center')
   ========================================================= */
import { ERA } from './eras';

export interface Background { label: string; color: string; focus?: string }
export const BASE_BACKGROUNDS: Record<string, Background> = {
  /* 낮 — 현대 서울 */
  room:       { label: '내 방(낮)',            color: '#e9e6ea' },
  room_night: { label: '내 방(밤)',            color: '#2a2a3c' },
  school:     { label: '이화고 교정·교실',     color: '#dfe4ea' },
  library:    { label: '이화고 도서관',        color: '#e3dbcd' },
  gym:        { label: '이화고 체육관',        color: '#e6d6c3' },
  hangang:    { label: '한강 공원',            color: '#c9d6e3' },
  hongdae:    { label: '홍대 클럽 거리',       color: '#2b2238' },
  music:      { label: '낙원상가 악기점',      color: '#5a4a3e' },
  daehakro:   { label: '대학로 소극장',        color: '#3f2f35', focus: '68% center' },
  cheongdam:  { label: '청담동 라운지·카페',   color: '#e8e1d2' },
  gallery:    { label: '한남동 갤러리',        color: '#e6e3df' },
  classroom:  { label: '이화고 교실',          color: '#e1e6ec' },
  airport_n:  { label: '밤의 공항',            color: '#1e2433' },
  academy:    { label: '대치동 학원가',        color: '#d5dae4' },
  studycafe:  { label: '스터디카페·독서실',    color: '#3b4054' },
  palace:     { label: '경복궁·봉은사',        color: '#d8d0c0', focus: '70% center' },
  rooftop:    { label: '밤의 옥상',            color: '#1f2440' },
  rain:       { label: '비 오는 거리',         color: '#7a8494' },
  airport:    { label: '인천공항',             color: '#d3dbe6' },
  hospital:   { label: '병원',                 color: '#dfe9e9' },
  stage:      { label: '무대',                 color: '#2a1a1f' },
  winter:     { label: '겨울 거리',            color: '#e2e6ee' },
  palace_night: { label: '경복궁 야간개방',      color: '#2b2433' },
  bukhansan:  { label: '북한산 둘레길',        color: '#c9d3c0' },
  campus:     { label: '대학 캠퍼스',          color: '#dfe3d6' },
  gangnam:    { label: '강남역 거리',          color: '#d9dde4' },
  seongsu:    { label: '성수동 카페 거리',     color: '#e3d6cc' },
  /* 밤 — 공용 (시대별 밤 배경은 전생 시대 팩에) */
  dream:      { label: '꿈(기본)',             color: '#120b0f' },
};

export const BACKGROUNDS: Record<string, Background> = { ...BASE_BACKGROUNDS, ...ERA.backgrounds };
