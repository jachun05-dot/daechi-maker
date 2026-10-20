/* =========================================================
   월말 성적표 — 한 달 동안 무엇이 자랐고 무엇이 깎였는지 한 장으로
   (호감도는 담지 않는다 — 인연은 따로 다룬다)
   ========================================================= */
import type { GameState } from './types';
import type { Turn } from '@/content/calendar';
import { BASE_KEYS, BASE_LABEL, CAREERS, SKILL_KEYS, SKILL_LABEL } from '@/content/careers';
import { ui, type ReportView } from '@/store/ui';
import { BALANCE } from '@/config/balance';
import { hpMax } from './state';
import { won } from './chips';
import { topTalent } from './timetable';
import { grade, month, shown, snap } from './progress';

const VERDICT = {
  strained: { mark: '亂', text: '무리한 달 — 몸이 먼저 지쳤다. 다음 달엔 쉬는 칸을 넣자.' },
  great:    { mark: '優', text: '알찬 달 — 한 달 사이에 눈에 띄게 달라졌다.' },
  good:     { mark: '良', text: '꾸준한 달 — 어제보다 조금씩 나아졌다.' },
  calm:     { mark: '可', text: '숨 고른 달 — 크게 자라진 않았지만, 쉬어 가는 것도 필요하다.' },
};

export function buildReport(st: GameState, T: Turn): ReportView {
  const a = month.start ?? snap(st), b = snap(st);
  // 스킬은 이번 달 많이 자란 것과 꿈(후보)의 특기 위주로 세 개
  const focusSkills = st.goal ? CAREERS[st.goal].skills : CAREERS[st.goalHint ?? topTalent(st)].skills;
  const skills = [...SKILL_KEYS].sort((x, y) => {
    const gx = shown(b.skill[x]) - shown(a.skill[x]) + (focusSkills.includes(x) ? 100 : 0);
    const gy = shown(b.skill[y]) - shown(a.skill[y]) + (focusSkills.includes(y) ? 100 : 0);
    return gy - gx;
  }).slice(0, 3);
  const bars = [
    ...BASE_KEYS.map(k => ({ label: BASE_LABEL[k], from: shown(a.stat[k]), to: shown(b.stat[k]), grade: grade(b.stat[k]) })),
    ...skills.map(k => ({ label: SKILL_LABEL[k], from: shown(a.skill[k]), to: shown(b.skill[k]) })),
  ];
  const growth = bars.reduce((n, x) => n + Math.max(0, x.to - x.from), 0);
  const strained = month.collapse >= 2 || st.stress >= 80;
  const v = strained ? VERDICT.strained : growth >= BALANCE.report.great ? VERDICT.great : growth >= BALANCE.report.good ? VERDICT.good : VERDICT.calm;

  const money = Math.round(b.money - a.money);
  const res: ReportView['res'] = [
    { label: '체력', value: `${Math.round(b.hp)} / ${hpMax(st)}`, tone: b.hp < hpMax(st) * 0.3 ? 'down' : undefined },
    { label: '스트레스', value: `${Math.round(b.stress)}`, tone: b.stress >= 70 ? 'down' : b.stress <= 30 ? 'up' : undefined },
    { label: '용돈', value: `${won(b.money)} (${money >= 0 ? '+' : '−'}${won(Math.abs(money))})`, tone: 'money' },
  ];
  if (month.doze) res.push({ label: '수업 중 졸음', value: `${month.doze}일`, tone: 'down' });
  if (month.collapse) res.push({ label: '쓰러져 잠듦', value: `${month.collapse}일`, tone: 'down' });
  if (month.broke) res.push({ label: '돈이 없어 건너뜀', value: `${month.broke}번`, tone: 'down' });

  return { title: `${T.label} 성적표`, verdict: v.text, verdictMark: v.mark, bars, res, highlights: [...month.highlights], event: month.event };
}

/** 성적표 화면을 띄우고 다음으로 넘어갈 때까지 기다린다 */
export async function showReport(st: GameState, T: Turn, button: string) {
  ui.runOpen(`${T.label} · 한 달 정리`, T.title);
  const r = buildReport(st, T);
  ui.runLog({ kind: 'report', title: r.title, report: r });
  await ui.runWait(button);
}
