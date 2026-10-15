/* 현생의 꿈(진로) / 전생 설정 */
import type { RouteId, StatKey } from '@/engine/types';

export interface Route {
  id: RouteId;
  label: string;
  goal: string;          // {goal} 치환
  goalShort: string;
  past: string;          // {past} 치환
  role: string;          // {role} 치환 — 전생 장면의 자기소개
  item: string;          // {item} 치환
  pastDream: string;     // {pastDream} 치환
  desc: string;
  bonus: Partial<Record<StatKey, number>>;
  bonusMoney: number;
}

export const ROUTES: Record<RouteId, Route> = {
  med: {
    id: 'med', label: '이성/생명', goal: '한국대 의대 진학', goalShort: '의사',
    past: '의녀 출신 의병', role: '의병 의녀', item: '약초 주머니와 은침', pastDream: '조선 제일의 명의',
    desc: '생명을 살리는 손. 전생엔 침 대신 칼과 약초를 들고 부상병을 살리며 싸웠다.',
    bonus: { int: 20, spirit: 10 }, bonusMoney: 0,
  },
  idol: {
    id: 'idol', label: '화려함/자유', goal: '최정상 아이돌·뮤지션 데뷔', goalShort: '아티스트',
    past: '예인 출신 첩보 의병', role: '의병 예인', item: '가야금과 밀서를 숨긴 은비녀', pastDream: '조선 최고의 가무 예인',
    desc: '무대 위에서 가장 빛나는 사람. 전생엔 왜장의 연회에서 춤추며 기밀을 훔쳤다.',
    bonus: { art: 20, charm: 10 }, bonusMoney: 0,
  },
  actor: {
    id: 'actor', label: '감성/표현', goal: '천만 배우·예술가 데뷔', goalShort: '배우',
    past: '광대 출신 연락책 의병', role: '의병 광대', item: '바가지 탈과 소고', pastDream: '세상을 웃기고 울리는 이야기꾼',
    desc: '타인의 삶을 대신 살아주는 사람. 전생엔 장터를 떠도는 광대로 위장해 의병의 소식을 날랐다.',
    bonus: { sense: 20, charm: 10 }, bonusMoney: 0,
  },
  ceo: {
    id: 'ceo', label: '야망/리더십', goal: '글로벌 CEO·외교관·법조인', goalShort: '리더',
    past: '몰락 양반가의 책사 겸 의병장', role: '의병장', item: '낡은 병법서와 붓 한 자루', pastDream: '신분의 벽이 없는 세상',
    desc: '판을 읽고 사람을 움직이는 사람. 전생엔 몰락한 가문의 책사로 의병을 이끌었다.',
    bonus: { cha: 20 }, bonusMoney: 200_000,
  },
};
export const ROUTE_ORDER: RouteId[] = ['med', 'idol', 'actor', 'ceo'];

/** 새 게임 질문 — 가장 많이 고른 루트로 결정 (동점이면 마지막 답) */
export const QUESTIONS: { q: string; answers: { text: string; route: RouteId }[] }[] = [
  { q: '꿈속, 불타는 마을에서\n당신의 피 묻은 손에 쥐어져 있던 것은?', answers: [
    { text: '약초 냄새가 배어 있는 작은 주머니와 은침', route: 'med' },
    { text: '줄이 하나 끊어진 가야금', route: 'idol' },
    { text: '반쯤 깨진 바가지 탈', route: 'actor' },
    { text: '피로 얼룩진 지도와 붓 한 자루', route: 'ceo' },
  ]},
  { q: '새 학기 다이어리의 첫 장.\n당신이 꾹꾹 눌러 쓴 문장은?', answers: [
    { text: '“누군가의 마지막을, 처음으로 바꾸는 사람이 될 것.”', route: 'med' },
    { text: '“수만 명이 내 노래를 따라 부르는 밤.”', route: 'idol' },
    { text: '“내가 아닌 천 개의 삶을 살아볼 것.”', route: 'actor' },
    { text: '“판을 읽는 사람이 아니라, 판을 짜는 사람.”', route: 'ceo' },
  ]},
  { q: '10년 뒤의 당신.\n가장 듣고 싶은 한마디는?', answers: [
    { text: '“선생님 덕분에 살았습니다.”', route: 'med' },
    { text: '“당신의 무대가 내 인생을 바꿨어요.”', route: 'idol' },
    { text: '“그 연기를 보고 처음으로 울 수 있었어요.”', route: 'actor' },
    { text: '“당신이라면 믿고 따르겠습니다.”', route: 'ceo' },
  ]},
];
