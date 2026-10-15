/* =========================================================
   배경 목록
   - 이미지: src/assets/images/bg/{key}.jpg (또는 .png/.webp)
   - 이미지가 없으면 color 단색으로 표시됩니다.
   - 스토리에서 [bg key] 로 사용
   ========================================================= */
export const BACKGROUNDS: Record<string, { label: string; color: string }> = {
  /* 낮 — 현대 서울 */
  room:       { label: '내 방(낮)',            color: '#e9e6ea' },
  room_night: { label: '내 방(밤)',            color: '#2a2a3c' },
  school:     { label: '이화고 교정·교실',     color: '#dfe4ea' },
  library:    { label: '이화고 도서관',        color: '#e3dbcd' },
  gym:        { label: '이화고 체육관',        color: '#e6d6c3' },
  hangang:    { label: '한강 공원',            color: '#c9d6e3' },
  hongdae:    { label: '홍대 클럽 거리',       color: '#2b2238' },
  music:      { label: '낙원상가 악기점',      color: '#5a4a3e' },
  daehakro:   { label: '대학로 소극장',        color: '#3f2f35' },
  cheongdam:  { label: '청담동 라운지·카페',   color: '#e8e1d2' },
  gallery:    { label: '한남동 갤러리',        color: '#e6e3df' },
  classroom:  { label: '이화고 교실',          color: '#e1e6ec' },
  airport_n:  { label: '밤의 공항',            color: '#1e2433' },
  academy:    { label: '대치동 학원가',        color: '#d5dae4' },
  studycafe:  { label: '스터디카페·독서실',    color: '#3b4054' },
  palace:     { label: '경복궁·봉은사',        color: '#d8d0c0' },
  rooftop:    { label: '밤의 옥상',            color: '#1f2440' },
  rain:       { label: '비 오는 거리',         color: '#7a8494' },
  airport:    { label: '인천공항',             color: '#d3dbe6' },
  hospital:   { label: '병원',                 color: '#dfe9e9' },
  stage:      { label: '무대',                 color: '#2a1a1f' },
  winter:     { label: '겨울 거리',            color: '#e2e6ee' },
  /* 밤 — 임진왜란 */
  burning:    { label: '불타는 마을',          color: '#4a120c' },
  mountain:   { label: '피란길 산길',          color: '#1d2427' },
  camp:       { label: '의병 진영',            color: '#2e140c' },
  fortress:   { label: '진주성',               color: '#3a1009' },
  river:      { label: '달밤의 강·암자',       color: '#151c28' },
  enemy:      { label: '왜군 진영',            color: '#2a0c14' },
  field:      { label: '전장',                 color: '#2a100b' },
  mansion:    { label: '양반가·약방',          color: '#2c231c' },
  moonfield:  { label: '달빛 아래 배꽃 들판',  color: '#2a2620' },
  market:     { label: '장터',                 color: '#3a2a1e' },
  palace_n:   { label: '밤의 임금 막사',       color: '#1a1420' },
  dream:      { label: '꿈(기본)',             color: '#120b0f' },
};
