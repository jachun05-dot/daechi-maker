/* =========================================================
   연애 — 인물별 열쇠 · 취향 · 학교 안팎
   시스템 설명은 docs/romance/README.md, 인물별 기획은 docs/romance/{id}.md
   - 열쇠(🔑)는 이야기 선택지에서 `key:taejun.1` 로 열고 `lock:taejun.1` 로 닫는다
   - 열쇠를 아직 이야기에 하나도 안 넣은 인물은 "열쇠 없음"으로 보고 조건에서 빼 준다 (플롯 다시 쓰는 중)
   - [임시] 표시는 플롯 확정 전 자리만 잡아 둔 값
   ========================================================= */
import type { BaseStat, CharId, SkillKey } from '@/engine/types';

/** 관계 단계 — 장면(메인 이벤트 머리말 stage=)으로만 오른다 */
export const STAGES = ['모르는 사이', '첫 만남', '아는 사이', '친구', '썸', '연인'] as const;
export type StageName = (typeof STAGES)[number];
export const STAGE = { none: 0, met: 1, known: 2, friend: 3, some: 4, lover: 5 } as const;
/** '친구' · '3' 둘 다 받는다 */
export function stageOf(v: string): number {
  const i = STAGES.indexOf(v as StageName);
  if (i >= 0) return i;
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < STAGES.length ? n : -1;
}

/** 데이트 판정에 쓰는 능력 — 'goal' 은 그달 꿈(목표 진로)의 대표 능력 */
export type DateStat = BaseStat | SkillKey | 'goal';

export interface RomanceKey { id: string; title: string }
export interface Taste {
  id: string;
  /** stat: 좋아하는 모습 · place: 좋아하는 곳 · dislike: 싫어하는 것 · gift: 선물 */
  kind: 'stat' | 'place' | 'dislike' | 'gift';
  label: string;
  place?: string;
  /** 이 열쇠를 연 뒤에야 드러나는 숨은 취향 */
  after?: string;
}
export interface Romance {
  keys: RomanceKey[];
  /** 데이트 판정 능력 — after 열쇠를 열면 later 로 바뀐다 */
  date: { stats: DateStat[]; later?: { after: string; stats: DateStat[] } };
  tastes: Taste[];
  /** 학교 안 인물 — 같이 있으면 소문이 난다 (학년 범위) */
  school?: { from: 1 | 2 | 3; to: 1 | 2 | 3 };
}

export const ROMANCE: Record<CharId, Romance> = {
  // 한태준 — docs/romance/taejun.md (확정 견본)
  taejun: {
    keys: [
      { id: '1', title: '너는?' },
      { id: '2', title: '무섭다고 말하기' },
      { id: '3', title: '참지 않기' },
      { id: '4', title: '인정' },
    ],
    date: { stats: ['cha', 'style'], later: { after: '1', stats: ['goal'] } },
    tastes: [
      { id: 'stat', kind: 'stat', label: '꿈을 향해 가는 모습' },
      { id: 'lounge', kind: 'place', label: '청담동 라운지', place: 'cheongdam' },
      { id: 'river', kind: 'place', label: '한강 편의점 앞 벤치 — 비싼 데 말고 아무 데나', place: 'hangang', after: '2' },
      { id: 'pity', kind: 'dislike', label: '동정하는 눈' },
      { id: 'mom', kind: 'dislike', label: '엄마 얘기를 먼저 꺼내는 것' },
      { id: 'cheap', kind: 'gift', label: '싸거나 손으로 만든 것 — 비웃고 몰래 간직한다' },
    ],
  },
  // ---- 아래는 플롯 다시 쓰는 중 [임시] — 열쇠는 비워 두고 데이트·취향 자리만 ----
  ian: {
    keys: [],
    date: { stats: ['int', 'sense'] },
    tastes: [{ id: 'gallery', kind: 'place', label: '한남동 갤러리', place: 'hannam' }],
    school: { from: 1, to: 3 },
  },
  mujin: {
    keys: [],
    date: { stats: ['fit', 'cha'] },
    tastes: [
      { id: 'river', kind: 'place', label: '한강공원 조깅로', place: 'hangang' },
      { id: 'gym', kind: 'place', label: '텅 빈 체육관', place: 'schoolgym' },
    ],
    school: { from: 1, to: 3 },
  },
  doyun: {
    keys: [],
    date: { stats: ['int', 'science'] },
    tastes: [{ id: 'academy', kind: 'place', label: '대치동 특강실', place: 'daechi' }],
    school: { from: 1, to: 2 },
  },
  seoha: {
    keys: [],
    date: { stats: ['sense', 'acting'] },
    tastes: [{ id: 'theater', kind: 'place', label: '대학로 소극장', place: 'daehakro' }],
    school: { from: 2, to: 3 },
  },
  ihyun: {
    keys: [],
    date: { stats: ['cha', 'spirit'] },
    tastes: [{ id: 'palace', kind: 'place', label: '경복궁', place: 'palace' }],
  },
  sihyun: {
    keys: [],
    date: { stats: ['sense', 'vocal'] },
    tastes: [
      { id: 'club', kind: 'place', label: '홍대 지하 클럽', place: 'hongdae' },
      { id: 'shop', kind: 'place', label: '낙원상가 악기점', place: 'nakwon' },
    ],
  },
};

/** 질투 장면 선택 결과 (장면이 value: 로 돌려준다) */
export type JealousyAnswer = 'explain' | 'honest' | 'ignore';
/** 고백 장면 선택 결과 */
export type ConfessAnswer = 'yes' | 'wait' | 'no';

/** 공용 장면에 앞세우는 한 줄 · 데이트 결과 문장 — 인물 전용 장면이 생기면 그쪽이 쓰인다 [임시] */
export const LOVE_LINES = {
  date: {
    great: ['시간 가는 줄 몰랐다. 헤어질 때 {who}이(가) 한 번 더 돌아봤다.', '{who}이(가) 오늘 처음으로 소리 내 웃었다. 그 웃음이 하루 종일 귓가에 남았다.'],
    ok: ['별일 없이, 그래서 좋은 하루였다.', '이야기가 끊기지 않았다. 그거면 충분했다.'],
    fail: ['어색한 침묵이 길었다. …그래도 {who}은(는) 끝까지 자리를 지켰다.', '하필 오늘 말이 자꾸 엇나갔다. 집에 오는 길에 이불을 걷어차고 싶었다.'],
  },
  confess: ['……할 말 있어. 끝까지 들어 줘.', '이상하지. 너한테만은 계산이 안 돼. 그래서 그냥 말할게.'],
  jealous: ['요즘 {who}(이)랑 자주 붙어 다니더라. …그냥, 소문이 그렇길래.', '{who}(이)랑 무슨 사이야? 아, 아니. 대답 안 해도 돼.'],
  crisis: ['우리 요즘 얼굴 본 게 언제였지? …나만 기다린 거야?', '바쁜 거 알아. 아는데, 그래도 좀 서운해.'],
  miss: ['요즘 바빠? 얼굴 잊어버리겠다.', '…보고 싶다는 말, 먼저 하게 만들지 마.'],
  ended: ['…축하해. 진심으로.', '그렇구나. 응, 알겠어.'],
};
