/* =========================================================
   진로(꿈) · 특기 · 전생에 품었던 꿈
   - 꿈은 시작할 때 고르지 않는다. 특기가 자라는 방향으로 후보가 생기고
     2학년 11월 진로 상담에서 정해진다.
   - 전생의 꿈(pastRole)은 현생에서 자라는 재능에 따라 꿈속에서 드러난다.
   ========================================================= */
import type { BaseStat, CareerId, SkillKey, SubjectKey } from '@/engine/types';

export interface Career {
  id: CareerId;
  goal: string;          // {goal} 치환
  short: string;
  skills: [SkillKey, SkillKey];
  /* 전생 — 재능에 따라 드러나는 꿈 */
  past: string;          // {past}
  role: string;          // {role}
  item: string;          // {item}
  pastDream: string;     // {pastDream}
}

export const CAREERS: Record<CareerId, Career> = {
  med: {
    id: 'med', goal: '한국대 의대 진학', short: '의대', skills: ['science', 'medicine'],
    past: '의녀 출신 의병', role: '의병 의녀', item: '약초 주머니와 은침', pastDream: '조선 제일의 명의',
  },
  idol: {
    id: 'idol', goal: '최정상 아이돌·뮤지션 데뷔', short: '아이돌', skills: ['vocal', 'dance'],
    past: '예인 출신 첩보 의병', role: '의병 예인', item: '가야금과 밀서를 숨긴 은비녀', pastDream: '조선 최고의 가무 예인',
  },
  actor: {
    id: 'actor', goal: '천만 배우 데뷔', short: '배우', skills: ['acting', 'voice'],
    past: '광대 출신 연락책 의병', role: '의병 광대', item: '바가지 탈과 소고', pastDream: '세상을 웃기고 울리는 이야기꾼',
  },
  leader: {
    id: 'leader', goal: '글로벌 CEO·외교관·법조인', short: '리더', skills: ['language', 'debate'],
    past: '몰락 양반가의 책사 겸 의병장', role: '의병장', item: '낡은 병법서와 붓 한 자루', pastDream: '신분의 벽이 없는 세상',
  },
};
export const CAREER_ORDER: CareerId[] = ['med', 'idol', 'actor', 'leader'];

export const BASE_LABEL: Record<BaseStat, string> = { int: '지성', sense: '감성', cha: '사교', fit: '근력', spirit: '감응' };
export const BASE_DESC: Record<BaseStat, string> = {
  int: '공부하는 머리', sense: '느끼고 표현하는 힘', cha: '말하고 사람을 움직이는 힘', fit: '몸. 최대 체력을 늘린다', spirit: '전생을 느끼는 힘',
};
export const SKILL_LABEL: Record<SkillKey, string> = {
  science: '수리·과학', medicine: '의학 지식', vocal: '보컬', dance: '댄스', acting: '연기', voice: '발성', language: '외국어', debate: '토론',
};
export const SUBJECT_LABEL: Record<SubjectKey, string> = { kor: '국어', eng: '영어', math: '수학', sci: '탐구', arts: '예체능' };
export const BASE_KEYS = Object.keys(BASE_LABEL) as BaseStat[];
export const SKILL_KEYS = Object.keys(SKILL_LABEL) as SkillKey[];
