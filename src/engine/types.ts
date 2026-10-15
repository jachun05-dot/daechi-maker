/* 게임 전체에서 쓰는 타입 정의 */

/** 기초 능력 5개 (지성 · 감성 · 사교 · 근력 · 감응) */
export type BaseStat = 'int' | 'sense' | 'cha' | 'fit' | 'spirit';
/** 특기 8개 — 진로별 2개씩 */
export type SkillKey = 'science' | 'medicine' | 'vocal' | 'dance' | 'acting' | 'voice' | 'language' | 'debate';
export type ResKey = 'hp' | 'stress' | 'money';
export type CharId = 'ian' | 'mujin' | 'doyun' | 'taejun' | 'seoha' | 'ihyun' | 'sihyun';
/** 진로(꿈) */
export type CareerId = 'med' | 'idol' | 'actor' | 'leader';
/** 수업 집중 과목 */
export type SubjectKey = 'kor' | 'eng' | 'math' | 'sci' | 'arts';
export type Theme = 'day' | 'night';
export type FxType = 'none' | 'petal' | 'sakura' | 'leaf' | 'snow' | 'rain' | 'ember';
export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

/** 스탯·특기·리소스·호감도 변화량 묶음 */
export interface Effect {
  stat?: Partial<Record<BaseStat, number>>;
  skill?: Partial<Record<SkillKey, number>>;
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
/** 메신저 말풍선. photo 가 있으면 사진(이미지 photo/{id}) */
export interface ChatMsg { from: 'them' | 'me' | 'sys'; text: string; time?: string; photo?: string; day?: number }
/** 답장을 기다리는 대화 (방마다 하나) */
export interface PendingChat {
  id: string;            // 장면 id (chat.… / call.…)
  arrived: number;       // 도착한 날 (GameState.day)
  time: string;          // 표시 시각 "23:41"
  opened: boolean;       // 읽었는가 (읽씹/안읽씹 판정)
  path: number[];        // 지금까지 고른 답장 (불러오기 후 이어서 진행할 때 씀)
}
/** 주말 약속 — 메신저에서 미리 잡힌 것 */
export interface FixedPromise { c: CharId; place: string; slot: number }

export interface GameState {
  version: number;
  name: string;
  turn: number;
  hp: number;
  stress: number;
  money: number;
  stat: Record<BaseStat, number>;
  skill: Record<SkillKey, number>;
  /** 꿈 — 2학년 11월 진로 상담에서 정해진다 */
  goal: CareerId | null;
  /** 1학년 11월 진로 상담에서 처음 언급된 꿈의 후보 */
  goalHint: CareerId | null;
  /** 전생에 품었던 꿈 — 현생의 재능에 따라 드러난다 */
  pastRole: CareerId | null;
  aff: Record<CharId, number>;
  met: Partial<Record<CharId, boolean>>;
  /** 인물별 메인 이벤트 진행 단계 */
  mainStep: Record<CharId, number>;
  /** 인물별 방학 이벤트 단계 */
  vacStage: Record<CharId, { summer: number; winter: number }>;
  /** 도감 — 인물을 만난 장소 */
  sightings: Partial<Record<CharId, string[]>>;
  memories: Record<string, boolean>;
  flags: Record<string, boolean>;
  /** 평일 시간표: 월~금 × (방과후, 야간) = 10칸, index = day * 2 + slot */
  timetable: (string | null)[];
  lastTimetable: (string | null)[] | null;
  club: string | null;
  /** 동아리를 고른 학기 번호 (학기가 바뀌면 다시 고른다) */
  clubTerm: number;
  focus: SubjectKey | null;
  chats: Record<string, ChatMsg[]>;
  unread: Record<string, number>;
  /** 메신저 — 답장 대기 중인 대화 (방 → 대화) */
  pending: Record<string, PendingChat>;
  /** 메신저 — 도착 예정 대화 */
  chatQueue: { id: string; due: number }[];
  /** 게임 속 날짜 = 턴 × 28 + 주 × 7 + 요일(0=월 … 6=일) */
  day: number;
  /** 먼저 연락하기 남은 횟수 (달마다 다시 채워진다) */
  phoneTime: number;
  /** 이번 주 인물들이 주말에 있을 곳 */
  presence: Partial<Record<CharId, string>>;
  /** 메신저에서 미리 잡은 주말 약속 */
  promiseNext: FixedPromise[];
  newMemory: boolean;
  /** 주말 — 장소별 방문 횟수 (단골 레벨) */
  placeVisits: Record<string, number>;
  /** 주말 약속 기록 */
  promiseLog: Partial<Record<CharId, { kept: number; broken: number; declined: number }>>;
  savedAt: number;
}

/** 회차를 넘어 영구 보존되는 기록 */
export interface MetaState {
  memories: Record<string, boolean>;
  /** 앨범 — 다시 볼 수 있는 장면(scene:id)과 받은 사진(photo:id). 회차를 넘어 남는다 */
  album: Record<string, boolean>;
  endings: Record<string, boolean>;
  plays: number;
  clears: number;
  lastName: string;
}

export interface Settings { textSpeed: 0 | 1 | 2; fx: boolean; showSlots: boolean }
