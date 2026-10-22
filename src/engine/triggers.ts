/* =========================================================
   사건(트리거) — 엔진이 "이런 일이 있었다"고 알리는 신호
   - 엔진은 emit(st, '사건 키') 만 부르고, 누가 듣는지는 모른다
   - 지금 듣는 쪽: 메신저 (chat.* 장면의 on= 에 사건 키를 적으면 그 사건 뒤에 톡이 온다)
   - 새 사건 만들기: 아래 TRIGGERS 에 한 줄 + Trigger 타입에 한 줄 → 엔진에서 emit
     (테스트가 톡 장면의 on= 키를 이 목록으로 검사한다)
   ========================================================= */
import type { CharId, GameState } from './types';

export const TRIGGERS: { key: string; re: string; desc: string }[] = [
  { key: 'main:{인물}.{번호}',        re: 'main:\\w+\\.\\d+',                desc: '인물 메인 이벤트를 본 직후 (예: main:ian.2)' },
  { key: 'meet:{인물}',               re: 'meet:\\w+',                       desc: '주말·평일에 우연히 만난 뒤' },
  { key: 'promise:kept:{인물}',       re: 'promise:kept:\\w+',               desc: '주말 약속을 지켰다' },
  { key: 'promise:declined:{인물}',   re: 'promise:declined:\\w+',           desc: '주말 약속을 거절했다' },
  { key: 'weather:rain|snow',         re: 'weather:(rain|snow)',             desc: '주말에 비·눈이 왔다' },
  { key: 'exam:top|high|mid|low',     re: 'exam:(top|high|mid|low)',         desc: '시험 결과 등급' },
  { key: 'sports:win|lose',           re: 'sports:(win|lose)',               desc: '체육대회 결과' },
  { key: 'festival:ok|fail',          re: 'festival:(ok|fail)',              desc: '축제 공연 결과' },
  { key: 'counsel:hint|decide',       re: 'counsel:(hint|decide)',           desc: '진로 상담 (힌트 / 결정)' },
  { key: 'suneung',                   re: 'suneung',                         desc: '수능 날' },
  { key: 'jealous:{인물}',            re: 'jealous:\\w+',                    desc: '소문 때문에 그 인물이 질투했다 (질투 장면 뒤)' },
  { key: 'stage:{인물}',              re: 'stage:\\w+',                      desc: '그 인물과 관계 단계가 올랐다 (친구 · 썸 · 연인 …)' },
  { key: 'key:{인물}',                re: 'key:\\w+',                        desc: '그 인물의 속마음 열쇠가 열렸다' },
  { key: 'confess:yes|wait|no:{인물}', re: 'confess:(yes|wait|no):\\w+',      desc: '그 인물의 고백에 답했다' },
  { key: 'breakup:{인물}',            re: 'breakup:\\w+',                    desc: '연인과 헤어졌다' },
  { key: 'dream:{꿈 id}',             re: 'dream:\\w+',                      desc: '전생 꿈을 처음 봤다 (예: dream:ian1)' },
  { key: 'turn:{번호}',               re: 'turn:\\d+',                       desc: '그 턴(달)이 시작될 때 (0 = 1학년 3월)' },
  { key: 'month:{월}',                re: 'month:\\d+',                      desc: '매년 그 달이 시작될 때' },
  { key: 'year:{학년}',               re: 'year:[123]',                      desc: '새 학년 3월' },
  { key: 'allowance',                 re: 'allowance',                       desc: '용돈 받는 달 (3턴마다)' },
  { key: 'idle',                      re: 'idle',                            desc: '평일 아무 일 없는 날 (방마다 확률)' },
  { key: 'stress',                    re: 'stress',                          desc: '스트레스 70 이상 (한 달에 한 번)' },
  { key: 'tired',                     re: 'tired',                           desc: '체력 25% 미만 (한 달에 한 번)' },
  { key: 'slump',                     re: 'slump',                           desc: '슬럼프 사건' },
  { key: 'vac:{인물}',                re: 'vac:\\w+',                        desc: '방학에 그 인물과 시간을 보낸 뒤' },
];
export const TRIGGER_RE = new RegExp(`^(${TRIGGERS.map(t => t.re).join('|')})$`);

export type Trigger =
  | `main:${CharId}.${number}` | `meet:${CharId}`
  | `promise:kept:${CharId}` | `promise:declined:${CharId}`
  | 'weather:rain' | 'weather:snow'
  | `exam:${'top' | 'high' | 'mid' | 'low'}`
  | 'sports:win' | 'sports:lose' | 'festival:ok' | 'festival:fail'
  | 'counsel:hint' | 'counsel:decide' | 'suneung'
  | `jealous:${CharId}` | `stage:${CharId}` | `key:${CharId}` | `confess:${'yes' | 'wait' | 'no'}:${CharId}` | `breakup:${CharId}`
  | `dream:${string}` | `turn:${number}` | `month:${number}` | `year:${1 | 2 | 3}`
  | 'allowance' | 'idle' | 'stress' | 'tired' | 'slump'
  | `vac:${CharId}`;

/** 사건에 붙는 부가 정보 — room: 그 방(인물)에만 알린다 */
export interface TriggerOpts { room?: string }
type Listener = (st: GameState, key: Trigger, opts: TriggerOpts) => void;
const listeners: Listener[] = [];

/** 사건 듣기. 돌려준 함수를 부르면 그만 듣는다 */
export function onTrigger(fn: Listener) {
  listeners.push(fn);
  return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); };
}

/** 사건 알리기 */
export function emit(st: GameState, key: Trigger, opts: TriggerOpts = {}) {
  for (const fn of listeners) fn(st, key, opts);
}
