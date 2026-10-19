/* =========================================================
   커리어 엔딩 — 꿈을 못 이뤄도, 키운 능력치와 3년의 생활대로 다른 길이 열린다
   - 장면: stories/endings/*.story 의 `=== career.{key} ending={id}`
   - 판정 순서 (engine/career.ts):
       꿈 대성공 → 꿈 → [능력치·전생 엔딩 중 가장 잘 맞는 것] → 번아웃 → 아쉬운 엔딩(꿈 85% 이상) → 재밌는 엔딩 → 새내기
   - req: 최소 능력치 · max: 이보다 낮아야 (한쪽으로 쏠린 엔딩) · need: 생활 기록 조건 (h = engine/career.ts Hist)
   - hint: 도감에서 아직 못 본 엔딩에 보이는 힌트
   - 전생과 이어진 엔딩은 전생 시대 팩(content/eras/{시대}/index.ts careerEndings)에 있다
   ========================================================= */
import type { BaseStat, CareerId, SkillKey } from '@/engine/types';
import type { Hist } from '@/engine/career';
import { ERA } from './eras';

export type CareerKind = 'dream' | 'great' | 'stat' | 'past' | 'near' | 'fun' | 'base';
export type StatReq = Partial<Record<BaseStat | SkillKey, number>>;

export interface CareerEnding {
  key: string;
  id: string;
  title: string;
  kind: CareerKind;
  hint: string;
  req?: StatReq;
  max?: StatReq;
  need?: (h: Hist) => boolean;
  /** 꿈 엔딩·대성공·아쉬운 엔딩이 어느 꿈의 것인지 */
  dream?: CareerId;
}

export const KIND_LABEL: Record<CareerKind, string> = {
  dream: '꿈', great: '꿈 · 대성공', stat: '다른 길', past: '전생의 길', near: '아쉬운 엔딩', fun: '웃픈 엔딩', base: '새내기',
};

const dream = (key: CareerId, id: string, title: string, hint: string): CareerEnding => ({ key, id, title, kind: 'dream', hint, dream: key });
const great = (key: CareerId, title: string, hint: string): CareerEnding => ({ key: `${key}_great`, id: `cg_${key}`, title, kind: 'great', hint, dream: key });
const near = (key: CareerId, title: string, hint: string): CareerEnding => ({ key: `${key}_near`, id: `cn_${key}`, title, kind: 'near', hint, dream: key, need: h => h.goal === key && h.goalFit >= 0.85 });
const stat = (key: string, title: string, hint: string, req: StatReq, more: Partial<CareerEnding> = {}): CareerEnding => ({ key, id: `cs_${key}`, title, kind: 'stat', hint, req, ...more });
const fun = (key: string, title: string, hint: string, more: Partial<CareerEnding>): CareerEnding => ({ key, id: `cf_${key}`, title, kind: 'fun', hint, ...more });

export const CAREER_ENDINGS: CareerEnding[] = [
  /* ── 꿈 (2학년에 정한 꿈의 관문 통과) */
  dream('med', 'c_med', '한국대 의과대학 합격', '흰 가운이 어울리는 손'),
  dream('idol', 'c_idol', '최정상 아티스트 데뷔', '오만 명이 따라 부르는 노래'),
  dream('actor', 'c_actor', '천만 배우 데뷔', '천 개의 삶을 사는 사람'),
  dream('leader', 'c_leader', '세계를 움직이는 리더의 첫걸음', '판을 짜는 사람'),
  /* ── 꿈 대성공 (관문을 크게 넘었을 때) */
  great('med', '한국대 의대 수석 입학', '입학식 단상 위의 흰 가운'),
  great('idol', '데뷔 앨범으로 신인상 싹쓸이', '시상식 무대를 세 번 오르는 밤'),
  great('actor', '데뷔작으로 칸의 레드카펫', '프랑스 남부의 플래시 세례'),
  great('leader', '최연소 UN 청년 대표', '스무 살의 연설'),

  /* ── 다른 길: 지성 */
  stat('robot', '로봇공학자의 첫걸음', '공식 사이에서 길을 찾는 아이', { int: 150, science: 130 }),
  stat('law', '로스쿨 진학', '말로 이기는 법을 아는 아이', { int: 150, debate: 110 }),
  stat('ilta', '대치동 일타강사', '가르치는 게 체질인 아이', { int: 130, cha: 80 }, { need: h => h.t('o:tutor') >= 16 }),
  stat('nurse', '간호사', '병원 냄새가 싫지 않은 아이', { medicine: 90, sense: 60 }, { need: h => h.visits('hospital') >= 5 }),
  stat('lab', '의학 연구원', '현미경 너머의 생명', { science: 140, medicine: 130 }),
  /* ── 감성 */
  stat('curator', '큐레이터', '그림 앞에 오래 서 있는 아이', { sense: 90 }, { need: h => h.visits('hannam') >= 5 }),
  stat('webnovel', '웹소설 작가', '도서관 창가 자리의 주인', { sense: 80, int: 100 }, { max: { cha: 70 }, need: h => h.t('o:library') >= 16 }),
  stat('director', '영상감독', '골목마다 카메라 앵글이 보이는 아이', { sense: 95 }, { need: h => h.visits('seongsu') + h.visits('hongdae') >= 8 }),
  stat('composer', '작곡가·프로듀서', '낙원상가 단골의 귀', { vocal: 80, sense: 85 }, { need: h => h.visits('nakwon') >= 4 }),
  stat('cafe', '성수동 카페 사장', '라떼 아트가 손에 익은 아이', { cha: 70 }, { need: h => h.t('o:cafe') >= 24 && h.money >= 200_000 }),
  /* ── 사교 */
  stat('announcer', '아나운서', '또박또박, 그러나 다정하게', { voice: 80, language: 90, cha: 75, style: 50 }),
  stat('creator', '크리에이터', '카메라 앞에서 더 신나는 아이', { cha: 90, sense: 70 }, { need: h => h.v('dance') + h.v('vocal') >= 60 }),
  stat('diplomat', '외교관', '세 나라 말로 싸우지 않는 법', { language: 140, debate: 110 }),
  stat('startup', '스타트업 창업가', '통장과 배짱이 함께 두꺼운 아이', { cha: 90, debate: 80 }, { need: h => h.money >= 400_000 }),
  stat('crew', '승무원·호텔리어', '구름 위의 미소', { language: 90, cha: 70, fit: 50, style: 55 }),
  /* ── 근력 */
  stat('pe', '체육교사', '체육대회의 전설', { fit: 90 }, { need: h => h.t('sportsWin') >= 2 }),
  stat('police', '경찰대 합격', '뛰는 머리, 생각하는 다리', { fit: 80, int: 130 }),
  stat('ems', '구급대원', '가장 먼저 달려가는 사람', { fit: 80, medicine: 60 }),
  stat('alpine', '산악인', '북한산이 동네 뒷산인 아이', { fit: 100 }, { need: h => h.visits('bukhansan') >= 5 }),
  /* ── 특기 조합 */
  stat('musical', '뮤지컬 배우', '노래하며 우는 법을 아는 아이', { vocal: 90, acting: 90 }),
  stat('choreo', '안무가', '음악이 몸으로 보이는 아이', { dance: 110, sense: 70 }),
  stat('voiceactor', '성우', '얼굴보다 목소리가 먼저 기억되는 아이', { voice: 100, acting: 70 }, { max: { cha: 75 } }),
  stat('interpreter', '통역사', '두 언어 사이의 다리', { language: 170 }),
  /* ── 스타일 */
  stat('model', '모델', '런웨이의 마지막 한 걸음', { style: 110, fit: 70 }),
  stat('beauty', '뷰티 크리에이터', '파우치 속의 작은 우주', { style: 90, cha: 80, sense: 60 }),
  stat('hairmake', '헤어·메이크업 아티스트', '청담동 의자에 앉아 본 아이', { style: 90, sense: 80 }, { need: h => h.visits('cheongdam') >= 5 }),
  stat('fashion', '패션 디자이너', '성수동 팝업을 다 돌아본 아이', { style: 90, sense: 90 }, { need: h => h.visits('seongsu') >= 5 }),
  stat('stylist', '아이돌 스타일리스트', '무대 옆에서 옷을 고르는 손', { style: 80, sense: 60 }, { need: h => h.goal === 'idol' }),

  /* ── 아쉬운 엔딩 */
  near('med', '재수 학원 등록', '같은 학원, 같은 자리, 다른 해'),
  near('idol', '탈락 짤의 주인공', '1라운드 탈락, 1,000만 뷰'),
  near('actor', '대사 4줄의 베테랑', '드라마 23편, 대사는 "네?"'),
  near('leader', '아파트 동대표', '세계 대신 주차장을 구하다'),
  { key: 'burnout', id: 'cn_burnout', title: '쉬어 가는 해', kind: 'near', hint: '너무 오래 달린 아이에게', need: h => h.t('slump') >= 2 },

  /* ── 웃픈 엔딩 — 능력치가 한쪽으로 쏠렸을 때 */
  fun('gymtuber', '헬스 유튜버', '근육은 배신하지 않는다…?', { req: { fit: 90 }, max: { int: 120 }, need: h => h.top === 'fit' }),
  fun('psychic', '전생 보는 언니', '손님 전생이 다 의병인 점집', { req: { spirit: 100 }, need: h => h.top === 'spirit' }),
  fun('albaking', '알바왕', '사장님이 열쇠를 건네는 날', { need: h => h.t('o:cafe') + h.t('o:tutor') + h.t('o:extra') >= 44 }),
  fun('dokseo', '독서실 총무', '칸막이 너머의 3년', { need: h => h.t('o:dokseo') >= 40 }),
  fun('wonjang', '대치동 학원 원장', '공부는 못했다. 시키는 건 잘했다', { req: { cha: 80 }, max: { int: 120 }, need: h => h.money >= 300_000 }),
  fun('foodmap', '서울 맛집 지도 작가', '통장은 배신했다', { need: h => h.places >= 14 && h.money < 30_000 }),
  fun('civil', '9급 공무원 수험생', '엄마가 제일 좋아한 엔딩', { need: h => h.spread <= 1.5 && h.minBase >= 50 && h.maxBase <= 130 }),
  fun('manager', '아이돌 매니저', '무대 옆에서 제일 크게 박수 치는 사람', { req: { cha: 80, fit: 70 }, max: { vocal: 40, dance: 40 } }),
  fun('neet', '행복한 동네 백수', '아무것도 되지 않았는데 이상하게 행복한', { max: { int: 90, sense: 90, cha: 90, fit: 90, style: 90 }, need: h => h.stress <= 25 && h.t('slump') === 0 }),
  fun('facecafe', '얼굴 천재 카페 사장', '손님 절반은 커피를 보러 오지 않는다', { req: { style: 100 }, need: h => h.top === 'style' }),
  fun('casting', '캐스팅 명함 수집가', '지갑이 명함으로 두꺼워진 아이', { req: { style: 60 }, need: h => h.t('casting') >= 2 }),
  fun('tteokbokki', '떡볶이 맛집 사장', '3년간의 야식이 헛되지 않았다', { need: h => h.t('snack') >= 10 }),

  /* ── 아무 길도 안 맞을 때 */
  { key: 'none', id: 'c_none', title: '반짝이는 새내기', kind: 'base', hint: '아직 아무것도 정하지 않은 봄' },

  /* ── 전생과 이어진 길 (지금 시대 팩) */
  ...ERA.careerEndings,
];

export const careerByKey = (key: string) => CAREER_ENDINGS.find(e => e.key === key);
