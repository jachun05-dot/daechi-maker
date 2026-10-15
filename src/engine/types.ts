/* 게임 전체에서 쓰는 타입 정의 */

export type StatKey = 'int' | 'art' | 'sense' | 'cha' | 'charm' | 'spirit' | 'fit';
export type ResKey = 'hp' | 'stress' | 'money';
export type CharId = 'ian' | 'mujin' | 'sihyun' | 'seoha' | 'taejun' | 'saya';
export type RouteId = 'med' | 'idol' | 'actor' | 'ceo';
export type Theme = 'day' | 'night';
export type FxType = 'none' | 'petal' | 'sakura' | 'leaf' | 'snow' | 'rain' | 'ember';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 스탯·리소스·호감도 변화량 묶음 */
export interface Effect {
  stat?: Partial<Record<StatKey, number>>;
  res?: Partial<Record<ResKey, number>>;
  aff?: Partial<Record<CharId, number>>;
  flags?: string[];
}

/* ---------- 스토리 스크립트 AST (.story 파일을 파싱한 결과) ---------- */
export type StoryNode =
  | { t: 'say'; who?: string; expr?: string; text: string; line: number }
  | { t: 'cmd'; name: string; args: string[]; line: number }
  | { t: 'effect'; eff: Effect; line: number }
  | { t: 'if'; branches: { cond: string | null; body: StoryNode[] }[]; line: number }
  | { t: 'choice'; options: ChoiceOption[]; line: number }
  | { t: 'call'; id: string; line: number };

export interface ChoiceOption {
  text: string;
  eff: Effect;
  cond?: string;
  special?: boolean;
  value?: string;
  body: StoryNode[];
}

export interface Scene {
  id: string;
  file: string;
  attrs: Record<string, string>;
  nodes: StoryNode[];
}

/* ---------- 세이브 데이터 ---------- */
export interface ChatMsg { from: 'them' | 'me' | 'sys'; text: string }
export interface Reply { text: string; aff: number }

export interface GameState {
  version: number;
  name: string;
  route: RouteId;        // 전생(고정)
  goal: RouteId;         // 현생의 꿈(진로 상담에서 바뀔 수 있음)
  turn: number;
  hp: number;
  stress: number;
  money: number;
  stat: Record<StatKey, number>;
  aff: Record<CharId, number>;
  encounterStep: Record<CharId, number>;
  met: Partial<Record<CharId, boolean>>;
  memories: Record<string, boolean>;
  flags: Record<string, boolean>;
  plan: (string | null)[];
  lastPlan: (string | null)[] | null;
  chats: Record<string, ChatMsg[]>;
  unread: Record<string, number>;
  replies: Record<string, Reply[]>;
  phoneStep: Partial<Record<CharId, number>>;
  newMemory: boolean;
  savedAt: number;
}

/** 회차를 넘어 영구 보존되는 기록 */
export interface MetaState {
  memories: Record<string, boolean>;
  endings: Record<string, boolean>;
  plays: number;
  clears: number;
  lastName: string;
  lastRoute: RouteId;
}

export interface Settings { textSpeed: 0 | 1 | 2; fx: boolean; showSlots: boolean }
