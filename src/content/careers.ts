/* =========================================================
   진로(꿈) · 특기 · 전생에 품었던 꿈
   - 꿈은 시작할 때 고르지 않는다. 특기가 자라는 방향으로 후보가 생기고
     2학년 11월 진로 상담에서 정해진다.
   - 전생의 꿈(pastRole)은 현생에서 자라는 재능에 따라 꿈속에서 드러난다.
   ========================================================= */
import type { BaseStat, CareerId, SkillKey, SubjectKey } from '@/engine/types';
import { ERA } from './eras';
import type { EraCareer } from './eras/types';

interface CareerBase {
  id: CareerId;
  goal: string;          // {goal} 치환
  short: string;
  skills: [SkillKey, SkillKey];
}
/** 전생 쪽(past·role·item·pastDream)은 전생 시대 팩에서 붙는다 */
export type Career = CareerBase & EraCareer;

const BASE: Record<CareerId, CareerBase> = {
  med: {
    id: 'med', goal: '한국대 의대 진학', short: '의대', skills: ['science', 'medicine'],
  },
  idol: {
    id: 'idol', goal: '최정상 아이돌·뮤지션 데뷔', short: '아이돌', skills: ['vocal', 'dance'],
  },
  actor: {
    id: 'actor', goal: '천만 배우 데뷔', short: '배우', skills: ['acting', 'voice'],
  },
  leader: {
    id: 'leader', goal: '글로벌 CEO·외교관·법조인', short: '리더', skills: ['language', 'debate'],
  },
};
export const CAREERS = Object.fromEntries(
  Object.entries(BASE).map(([id, c]) => [id, { ...c, ...ERA.careers[id as CareerId] }]),
) as Record<CareerId, Career>;
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
