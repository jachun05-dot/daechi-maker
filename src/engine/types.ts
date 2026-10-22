/* 게임 전체에서 쓰는 타입 정의 */

/** 기초 능력 5개 (지성 · 감성 · 사교 · 근력 · 감응) */
export type BaseStat = 'int' | 'sense' | 'cha' | 'fit' | 'spirit' | 'style';
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
  /** 연애 — 열쇠 열기·닫기 ("taejun.1"), 단계 올리기, 취향 발견 ("taejun.river") */
  keys?: string[];
  locks?: string[];
  stage?: Partial<Record<CharId, number>>;
  likes?: string[];
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
  /** 이야기 폴더 안에서의 경로 (예: dreams/self.story) */
  file: string;
  /** 'base' = src/content/stories, 그 밖에는 전생 시대 팩 id */
  pack?: string;
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
  path: number[];        // 지금까지 고른 답장 번호 (불러오기 후 이어서 진행할 때 씀)
  picked: string[];      // 고른 답장 글 — 업데이트로 선택지 순서가 바뀌어도 글로 찾아간다
}
/** 연애 — 인물 한 사람과의 관계 (docs/romance/README.md) */
export interface Bond {
  /** 0 모르는 사이 · 1 첫 만남 · 2 아는 사이 · 3 친구 · 4 썸 · 5 연인 */
  stage: number;
  /** 연 열쇠 · 이번 생에 닫힌 열쇠 */
  keys: string[];
  locked: string[];
  /** 알아낸 취향 id */
  likes: string[];
  /** 학교 소문 (학교 안 인물만) */
  rumor: number;
  /** 고백: none 아직 · wait 기다려 달라고 함 · yes 받음 · no 거절함 · broke 헤어짐 */
  confess: 'none' | 'wait' | 'yes' | 'no' | 'broke';
  /** 기다려 달라고 한 뒤 다시 고백할 수 있는 턴 */
  waitUntil: number;
  /** 마지막으로 같이 시간을 보낸 날 (GameState.day) — 연인 소홀 판정 */
  lastSeen: number;
  /** 데이트 기록 */
  dates: { great: number; ok: number; fail: number };
  /** 이 턴까지는 다시 질투하지 않는다 */
  jealousUntil: number;
}

/** 주말 약속 — 메신저에서 미리 잡힌 것 */
export interface FixedPromise { c: CharId; place: string; slot: number }

export interface GameState {
  version: number;
  /** 이 생을 시작한 전생 시대 팩 id */
  era: string;
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
  /** 연애 — 인물별 관계 단계 · 열쇠 · 취향 · 소문 */
  bond: Record<CharId, Bond>;
  /** 지금 사귀는 사람 */
  lover: CharId | null;
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
  /** 3년 동안의 생활 기록 (일정별 횟수·이벤트 결과·야식 …) — 커리어 엔딩 판정에 쓴다 */
  tally: Record<string, number>;
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
