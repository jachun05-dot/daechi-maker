/* 엔딩 컬렉션 목록 (도감 표시용). 장면은 stories/endings/*.story 의 ending=id 와 연결 */
import type { CharId } from '@/engine/types';
import { CHARACTERS, ROMANCEABLE } from './characters';
import { CAREER_ENDINGS, KIND_LABEL } from './careerEndings';

/** hint: 아직 못 본 엔딩에 보이는 힌트 */
export interface EndingInfo { id: string; title: string; kind: string; hint?: string }

const per = (prefix: string, kind: string, title: (c: CharId) => string): EndingInfo[] =>
  ROMANCEABLE.map(c => ({ id: `${prefix}_${c}`, title: title(c), kind }));

export const ENDINGS: EndingInfo[] = [
  // 커리어 — content/careerEndings.ts
  ...CAREER_ENDINGS.map(e => ({ id: e.id, title: e.title, kind: `커리어 · ${KIND_LABEL[e.kind]}`, hint: e.hint })),
  ...per('t', '진 엔딩', c => `${CHARACTERS[c].name} · 진 엔딩`),
  ...per('n', '노멀 엔딩', c => `${CHARACTERS[c].name} · 노멀 엔딩`),
  ...per('r', '차인 엔딩', c => `${CHARACTERS[c].name}에게 차였다`),
  ...per('m', '엇갈림 엔딩', c => `${CHARACTERS[c].name} · 그때 말할걸`),
  { id: 'h_taejun', title: '한태준 · 히든 — 진료실의 문', kind: '히든 엔딩' },
  { id: 'e_ihyun',  title: '김이현 · 기쁨으로 나타난 아이', kind: '이현 엔딩' },
  { id: 'h_ihyun',  title: '김이현 · 히든 — 너를 사랑한 게 내 죄가 아니었구나', kind: '히든 엔딩' },
  { id: 'r_ihyun',  title: '김이현 · 이미 떠난 뒤', kind: '차인 엔딩' },
];

export const CREDITS_QUOTE = '“꿈은, 남이 대신 꿔 주지 않습니다.”';
