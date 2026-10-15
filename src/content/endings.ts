/* 엔딩 컬렉션 목록 (도감 표시용). 장면은 stories/endings/*.story 의 ending=id 와 연결 */
export const ENDINGS: { id: string; title: string; kind: string }[] = [
  { id: 'c_med',    title: '한국대 의과대학 합격',              kind: '커리어' },
  { id: 'c_idol',   title: '빌보드를 흔든 최정상 아티스트',      kind: '커리어' },
  { id: 'c_actor',  title: '청룡 신인상 · 천만 배우',            kind: '커리어' },
  { id: 'c_ceo',    title: '최연소 글로벌 CEO · 외교관',         kind: '커리어' },
  { id: 'c_none',   title: '평범하고 소중한 대학생',             kind: '커리어' },
  { id: 't_ian',    title: '[진] 달빛 아래 나란히 선 왕자',      kind: '진 엔딩' },
  { id: 't_mujin',  title: '[진] 이번엔, 앞에서',               kind: '진 엔딩' },
  { id: 't_sihyun', title: '[진] 지음(知音)의 노래',            kind: '진 엔딩' },
  { id: 't_seoha',  title: '[진] 끝나지 않는 커튼콜',           kind: '진 엔딩' },
  { id: 't_taejun', title: '[진] 열린 대문',                    kind: '진 엔딩' },
  { id: 'n_ian',    title: '[노멀] 지켜지는 사람',              kind: '노멀 로맨스' },
  { id: 'n_mujin',  title: '[노멀] 등 뒤의 온기',               kind: '노멀 로맨스' },
  { id: 'n_sihyun', title: '[노멀] 새벽의 기타 소리',           kind: '노멀 로맨스' },
  { id: 'n_seoha',  title: '[노멀] 객석의 두 사람',             kind: '노멀 로맨스' },
  { id: 'n_taejun', title: '[노멀] 금빛 새장',                  kind: '노멀 로맨스' },
  { id: 'solo',     title: '나라는 이름의 별',                  kind: '자아실현' },
  { id: 's_dead',   title: '배꽃은 지고 — 사야의 부고',          kind: '사야 에필로그' },
  { id: 's_alive',  title: '기적의 편지 — 사야, 살아남다',       kind: '히든 에필로그' },
];

export const CREDITS_QUOTE = '“꿈은, 남이 대신 꿔 주지 않습니다.”';
