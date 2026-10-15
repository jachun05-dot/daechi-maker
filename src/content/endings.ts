/* 엔딩 컬렉션 목록 (도감 표시용). 장면은 stories/endings/*.story 의 ending=id 와 연결 */
import type { CharId } from '@/engine/types';
import { CHARACTERS, ROMANCEABLE } from './characters';

export interface EndingInfo { id: string; title: string; kind: string }

const per = (prefix: string, kind: string, title: (c: CharId) => string): EndingInfo[] =>
  ROMANCEABLE.map(c => ({ id: `${prefix}_${c}`, title: title(c), kind }));

export const ENDINGS: EndingInfo[] = [
  { id: 'c_med',    title: '한국대 의과대학 합격',          kind: '커리어' },
  { id: 'c_idol',   title: '최정상 아티스트 데뷔',          kind: '커리어' },
  { id: 'c_actor',  title: '천만 배우 데뷔',                kind: '커리어' },
  { id: 'c_leader', title: '세계를 움직이는 리더의 첫걸음', kind: '커리어' },
  { id: 'c_none',   title: '아직 꿈을 찾는 중',             kind: '커리어' },
  ...per('t', '진 엔딩', c => `${CHARACTERS[c].name} · 진 엔딩`),
  ...per('n', '노멀 엔딩', c => `${CHARACTERS[c].name} · 노멀 엔딩`),
  ...per('r', '차인 엔딩', c => `${CHARACTERS[c].name}에게 차였다`),
  { id: 'h_taejun', title: '한태준 · 히든 — 진료실의 문', kind: '히든 엔딩' },
  { id: 'e_ihyun',  title: '김이현 · 기쁨으로 나타난 아이', kind: '이현 엔딩' },
  { id: 'h_ihyun',  title: '김이현 · 히든 — 너를 사랑한 게 내 죄가 아니었구나', kind: '히든 엔딩' },
  { id: 'r_ihyun',  title: '김이현 · 이미 떠난 뒤', kind: '차인 엔딩' },
];

export const CREDITS_QUOTE = '“꿈은, 남이 대신 꿔 주지 않습니다.”';
