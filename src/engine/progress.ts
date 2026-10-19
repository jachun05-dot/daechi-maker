/* =========================================================
   성장 표시 · 이정표 · 이달의 기록
   - 스탯은 안에서 소수로 쌓이지만 화면에는 정수만 보인다.
     성장량은 "정수 자리가 몇 번 넘어갔나"(전후 스냅샷 비교)로 보여 준다 → +0.3 같은 숫자가 없다
   - 이정표: 기초 능력 등급이 오르거나 특기가 25 단위를 넘을 때, 새 일정이 열릴 때
   - 이달의 기록: 월말 성적표(report)에 쓰는 한 달치 메모 (세이브에는 넣지 않는다)
   ========================================================= */
import type { BaseStat, GameState, SkillKey } from './types';
import type { Chip } from '@/store/ui';
import { BALANCE } from '@/config/balance';
import { BASE_KEYS, BASE_LABEL, SKILL_KEYS, SKILL_LABEL } from '@/content/careers';
import { AFTER_SCHOOL, NIGHT } from '@/content/timetable';
import { shortMoney } from './chips';

export interface Snap {
  stat: Record<BaseStat, number>; skill: Record<SkillKey, number>;
  hp: number; stress: number; money: number;
}
export const snap = (st: GameState): Snap => ({ stat: { ...st.stat }, skill: { ...st.skill }, hp: st.hp, stress: st.stress, money: st.money });

/** 화면에 보이는 정수 값 */
export const shown = (v: number) => Math.floor(v + 1e-9);
export const grade = (v: number) => BALANCE.grades.find(([max]) => v < max)?.[1] ?? 'S';

/** 두 시점 사이 화면 숫자가 얼마나 변했나 — 정수 칩 */
export function gainChips(a: Snap, b: Snap, { res = true }: { res?: boolean } = {}): Chip[] {
  const out: Chip[] = [];
  if (res) {
    const hp = Math.round(b.hp) - Math.round(a.hp);
    if (hp) out.push({ label: `체력 ${hp > 0 ? '+' : '−'}${Math.abs(hp)}`, tone: hp > 0 ? 'up' : 'down' });
    const s = Math.round(b.stress) - Math.round(a.stress);
    if (s) out.push({ label: `스트레스 ${s > 0 ? '+' : '−'}${Math.abs(s)}`, tone: s < 0 ? 'up' : 'down' });
    const m = Math.round(b.money - a.money);
    if (m) out.push({ label: `용돈 ${shortMoney(m)}`, tone: 'money' });
  }
  for (const k of BASE_KEYS) { const d = shown(b.stat[k]) - shown(a.stat[k]); if (d) out.push({ label: `${BASE_LABEL[k]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, tone: d > 0 ? 'up' : 'down' }); }
  for (const k of SKILL_KEYS) { const d = shown(b.skill[k]) - shown(a.skill[k]); if (d) out.push({ label: `${SKILL_LABEL[k]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, tone: d > 0 ? 'up' : 'down' }); }
  return out;
}

/* ---------- 이정표 ---------- */
export interface Milestone { kind: 'grade' | 'skill' | 'unlock'; title: string; body: string; mark: string }
const SKILL_STEP = 25;

/** 일정이 열리는 조건을 만족하나 */
export function reqMet(st: GameState, req?: Partial<Record<BaseStat | SkillKey, number>>) {
  if (!req) return true;
  return Object.entries(req).every(([k, v]) => (k in st.stat ? st.stat[k as BaseStat] : st.skill[k as SkillKey]) >= v!);
}
export const reqLabel = (req: Partial<Record<BaseStat | SkillKey, number>>) =>
  Object.entries(req).map(([k, v]) => `${(BASE_LABEL as Record<string, string>)[k] ?? (SKILL_LABEL as Record<string, string>)[k]} ${v}`).join(' · ');

/** 새로 달성한 이정표 — 한 번 알린 것은 flags 에 남는다. 처음 불리면(예전 세이브) 지금 상태를 조용히 기준으로 삼는다 */
export function checkMilestones(st: GameState): Milestone[] {
  const out: Milestone[] = [];
  const quiet = !st.flags.ms_init;
  st.flags.ms_init = true;
  for (const k of BASE_KEYS) {
    const g = grade(st.stat[k]);
    if (g === 'F' || st.flags[`g_${k}_${g}`]) continue;
    st.flags[`g_${k}_${g}`] = true;
    if (!quiet) out.push({ kind: 'grade', title: `${BASE_LABEL[k]} ${g}등급`, body: GRADE_LINE[k], mark: g });
  }
  for (const k of SKILL_KEYS) {
    const n = Math.floor(st.skill[k] / SKILL_STEP) * SKILL_STEP;
    if (n < SKILL_STEP || st.flags[`m_${k}_${n}`]) continue;
    st.flags[`m_${k}_${n}`] = true;
    if (!quiet) out.push({ kind: 'skill', title: `${SKILL_LABEL[k]} ${n} 돌파`, body: '꾸준히 쌓은 시간이 실력이 되어 간다.', mark: '★' });
  }
  for (const o of [...AFTER_SCHOOL, ...NIGHT]) {
    if (!o.req || st.flags[`u_${o.id}`] || !reqMet(st, o.req)) continue;
    st.flags[`u_${o.id}`] = true;
    if (!quiet) out.push({ kind: 'unlock', title: `새 일정 · ${o.name}`, body: `${o.place}. 다음 달 시간표에서 고를 수 있다.`, mark: '開' });
  }
  if (out.length) month.highlights.push(...out.map(m => m.title));
  return out;
}

const GRADE_LINE: Record<BaseStat, string> = {
  int: '모의고사 성적표의 숫자가 달라지기 시작했다.',
  sense: '같은 풍경도 전보다 많은 것이 보인다.',
  cha: '말을 걸어오는 사람이 늘었다.',
  fit: '계단을 올라도 숨이 덜 찬다.',
  spirit: '꿈과 현실의 경계가 조금 얇아졌다.',
};

/* ---------- 이달의 기록 ---------- */
export const month = {
  start: null as Snap | null,
  turn: -1,
  highlights: [] as string[],
  doze: 0, collapse: 0, broke: 0, heavy: 0,
  /** 이달의 학사 이벤트 결과 (시험 등급 등) */
  event: null as { title: string; result: string; chips: Chip[] } | null,
};
export function beginMonthLog(st: GameState) {
  Object.assign(month, { start: snap(st), turn: st.turn, highlights: [], doze: 0, collapse: 0, broke: 0, heavy: 0, event: null });
}
