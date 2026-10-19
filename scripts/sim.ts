/* =========================================================
   npm run sim — 실제 엔진을 화면 없이 처음부터 졸업까지 여러 번 돌려 밸런스를 본다
   사용: npm run sim -- [판 수(기본 20)] [전략,전략…]
   전략: study(공부) · talent(재능) · balance(균형) · smart(체력 보고 회복·재능 섞기) · random(아무거나)
   ========================================================= */
/* eslint-disable @typescript-eslint/no-explicit-any */

// 화면 연출 대기(sleep)를 없앤다 — 모듈을 읽기 전에
const realSetTimeout = globalThis.setTimeout;
(globalThis as any).setTimeout = (fn: () => void) => { setImmediate(fn); return 0; };

const N = Number(process.argv[2] ?? 20);
const STRATS = (process.argv[3] ?? 'study,talent,balance,smart,random').split(',');

const { useUI, ui } = await import('@/store/ui');
const { game } = await import('@/engine/state');
const { newGame } = await import('@/engine/newgame');
const { runMonth } = await import('@/engine/month');
const { TURNS } = await import('@/content/calendar');
const { recommendTimetable } = await import('@/engine/forecast');
const { recommendPlan } = await import('@/engine/weekend');
const { careerFit, optionsFor, clubAt } = await import('@/engine/timetable');
const { judgeCareer } = await import('@/engine/career');
const allEndings: Record<string, number> = {};
const { onTrigger } = await import('@/engine/triggers');
const { month } = await import('@/engine/progress');
const { reqMet } = await import('@/engine/progress');
const { hpMax } = await import('@/engine/state');
const { CAREERS } = await import('@/content/careers');

/* ---------- 자동 플레이어 ---------- */
let strat = 'talent';
/** 이번 판에 노리는 꿈 (플레이어가 마음에 둔 진로) */
let target: 'med' | 'idol' | 'actor' | 'leader' = 'med';
const FOCUS = { med: 'sci', idol: 'arts', actor: 'arts', leader: 'eng' } as const;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
function act() {
  const s = useUI.getState();
  if (s.vn) {
    if (s.vn.view.mode === 'choice') {
      // 진로 상담에서는 마음에 둔 꿈을 고른다
      const mine = s.vn.view.choices.findIndex(c => c.text.startsWith(CAREERS[target].goal));
      ui.vnChoose(mine >= 0 && strat !== 'random' ? mine : Math.floor(Math.random() * s.vn.view.choices.length));
    }
    else ui.vnAdvance();
  } else if (s.modal) {
    const m = s.modal;
    if (m.options?.length) ui.closeModal(pick(m.options.filter(o => !o.disabled)).value);
    else if (m.input !== undefined) ui.closeModal('시뮬');
    else ui.closeModal(m.buttons[m.buttons.length - 1]?.value);
  } else if (s.notice) ui.noticeDone(false);
  else if (s.chatRoom) ui.closeChat();
  else if (s.map) {
    const accepted = s.map.invites.filter(() => Math.random() < 0.5).map(i => i.id);
    const plan = recommendPlan(game.state!, s.map, [null, null, null, null]);
    ui.planDone({ plan, accepted });
  } else if (s.run?.button) ui.runPress();
  else if (s.credits) ui.creditsDone();
}
useUI.subscribe(() => setImmediate(act));
setInterval(act, 1);

function planMonth() {
  const st = game.state!;
  if (!st) return;
  const goal = st.goal ?? st.goalHint;
  if (strat === 'random') {
    st.timetable = Array.from({ length: 10 }, (_, i) => {
      const s = (i % 2) as 0 | 1, d = i >> 1;
      if (clubAt(st, d, s)) return null;
      return pick(optionsFor(s).filter(o => o.days.includes(d) && reqMet(st, o.req))).id;
    });
    st.focus = pick(['kor', 'eng', 'math', 'sci', 'arts'] as const);
    return;
  }
  const T = TURNS[st.turn];
  const examSoon = T.event === 'exam' || T.event === 'suneung';
  const preset = strat === 'smart' ? (st.hp < hpMax(st) * 0.45 || st.stress > 65 ? 'rest' : examSoon ? 'study' : 'talent') : strat as any;
  st.timetable = recommendTimetable(st, preset, goal ?? target);
  st.focus = strat === 'study' || (strat === 'smart' && examSoon) ? 'math' : FOCUS[goal ?? target];
}

/* ---------- 기록 ---------- */
interface Run {
  int: number; top: number; career: string; kind: string; goal: string | null; goalFit: number;
  exams: string[]; sports: string[]; festival: string[]; slumps: number; doze: number; collapse: number; broke: number;
  verdicts: string[]; moneyMin: number; stressMax: number; unlocks: number;
  vals: Record<string, number>; growth: number[]; fit: number[]; fest: number[]; intAt: Record<number, number>;
}
let cur: Run;
onTrigger((st, key) => {
  if (key.startsWith('exam:')) cur.exams.push(key.slice(5));
  if (key.startsWith('sports:')) { cur.sports.push(key.slice(7)); cur.fit.push(Math.round(st.stat.fit)); }
  if (key.startsWith('festival:')) { cur.festival.push(key.slice(9)); cur.fest.push(Math.round(Math.max((st.skill.vocal + st.skill.dance) / 2, (st.skill.acting + st.skill.voice) / 2, (st.skill.debate + st.skill.language) / 2))); }
  if (key.startsWith('exam:')) cur.intAt[st.turn] = Math.round(st.stat.int);
  if (key === 'slump') cur.slumps++;
  cur.moneyMin = Math.min(cur.moneyMin, st.money);
  cur.stressMax = Math.max(cur.stressMax, st.stress);
});
const origLog = ui.runLog;
ui.runLog = (l: any) => {
  if (l.kind === 'report') { cur.verdicts.push(l.report.verdictMark); cur.growth.push(l.report.bars.reduce((n: number, b: any) => n + Math.max(0, b.to - b.from), 0)); cur.doze += month.doze; cur.collapse += month.collapse; cur.broke += month.broke; }
  if (l.kind === 'grade' && l.mark === '開') cur.unlocks++;
  return origLog(l);
};

async function playOne(): Promise<Run> {
  cur = { int: 0, top: 0, career: '', kind: '', goal: null, goalFit: 0, exams: [], sports: [], festival: [], slumps: 0, doze: 0, collapse: 0, broke: 0, verdicts: [], moneyMin: Infinity, stressMax: 0, unlocks: 0, vals: {}, growth: [], fit: [], fest: [], intAt: {} };
  useUI.setState({ busy: false });
  await newGame();
  const st = game.state!;  // 졸업 뒤 game.state 가 비워지므로 붙잡아 둔다
  for (let guard = 0; guard < 40; guard++) {
    const lastTurn = st.turn === TURNS.length - 1;
    planMonth();
    await runMonth();
    if (lastTurn) break;
  }
  const v = judgeCareer(st);
  const r = { career: v.ending.key, kind: v.ending.kind === 'dream' || v.ending.kind === 'great' ? (st.goal === v.ending.dream ? 'dream' : 'other') : v.ending.kind === 'base' ? 'none' : 'other' };
  allEndings[v.ending.key] = (allEndings[v.ending.key] ?? 0) + 1;
  Object.assign(cur, {
    int: Math.floor(st.stat.int), career: r.career, kind: r.kind, goal: st.goal,
    goalFit: st.goal ? careerFit(st, st.goal) : 0,
    top: Math.max(...Object.values(st.skill).map(Math.floor)),
    vals: { ...st.stat, ...st.skill },
  });
  return cur;
}

const pct = (n: number, d: number) => `${Math.round((n / Math.max(1, d)) * 100)}%`;
const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / Math.max(1, a.length));
for (const s of STRATS) {
  strat = s;
  const runs: Run[] = [];
  const targets = ['med', 'idol', 'actor', 'leader'] as const;
  for (let i = 0; i < N; i++) { target = targets[i % 4]; runs.push(await playOne()); }
  const exams = runs.flatMap(r => r.exams), verd = runs.flatMap(r => r.verdicts);
  const count = (a: string[], k: string) => a.filter(x => x === k).length;
  console.log(`\n■ ${s}  (${N}판)`);
  console.log(`  꿈 이룸 ${pct(runs.filter(r => r.kind === 'dream').length, N)} · 다른 길 ${pct(runs.filter(r => r.kind === 'other').length, N)} · 진로 없음 ${pct(runs.filter(r => r.kind === 'none').length, N)} · 꿈 적합도 평균 ${Math.round(avg(runs.map(r => r.goalFit)) * 100)}%`);
  console.log(`  진로: ${Object.keys(CAREERS).concat('none').map(c => `${c} ${runs.filter(r => r.career === c).length}`).join(' · ')}`);
  console.log(`  노린 꿈 이룸: ${targets.map((t, i) => `${t} ${pct(runs.filter((r, k) => k % 4 === i && r.kind === 'dream' && r.goal === t).length, runs.filter((_, k) => k % 4 === i).length)}`).join(' · ')}`);
  const dist: Record<string, number> = {};
  for (const r of runs) dist[r.career] = (dist[r.career] ?? 0) + 1;
  if (process.env.STATS) {
    const keys = Object.keys(runs[0].vals);
    const q = (k: string) => { const s = runs.map(r => Math.round(r.vals[k])).sort((a, b) => a - b); return `${s[Math.floor(s.length * .1)]}/${s[Math.floor(s.length * .5)]}/${s[Math.floor(s.length * .9)]}`; };
    console.log(`    졸업 능력치 p10/중앙/p90: ${keys.map(k => `${k} ${q(k)}`).join(' · ')}`);
  }
  console.log(`  엔딩: ${Object.entries(dist).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(' · ')}`);
  if (process.env.DETAIL) for (const [i, t] of targets.entries()) {
    const rs = runs.filter((_, k) => k % 4 === i);
    const req = (await import('@/config/balance')).BALANCE.careers[t];
    console.log(`    ${t}: ${Object.entries(req).map(([k, v]) => `${k} ${Math.round(avg(rs.map(r => r.vals[k])))}/${v}`).join(' · ')}`);
  }
  if (process.env.DETAIL) {
    const q = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return `p25 ${s[Math.floor(s.length * .25)]} · 중앙 ${s[Math.floor(s.length * .5)]} · p75 ${s[Math.floor(s.length * .75)]}`; };
    console.log(`    월 성장합 ${q(runs.flatMap(r => r.growth))} · 체육대회 근력 ${[0, 1, 2].map(i => Math.round(avg(runs.map(r => r.fit[i] ?? 0)))).join('/')} · 축제 실력 ${[0, 1, 2].map(i => Math.round(avg(runs.map(r => r.fest[i] ?? 0)))).join('/')}`);
    const turns = Object.keys(runs[0].intAt).map(Number);
    console.log(`    시험 때 지성 ${turns.map(t => `T${t}:${Math.round(avg(runs.map(r => r.intAt[t] ?? 0)))}`).join(' ')}`);
  }
  console.log(`  졸업 지성 평균 ${Math.round(avg(runs.map(r => r.int)))} (최소 ${Math.min(...runs.map(r => r.int))} 최대 ${Math.max(...runs.map(r => r.int))}) · 최고 특기 평균 ${Math.round(avg(runs.map(r => r.top)))}`);
  console.log(`  시험 ${exams.length}회: 1등 ${pct(count(exams, 'top'), exams.length)} · 상위 ${pct(count(exams, 'high'), exams.length)} · 중위 ${pct(count(exams, 'mid'), exams.length)} · 하위 ${pct(count(exams, 'low'), exams.length)}`);
  console.log(`  체육대회 우승 ${pct(runs.flatMap(r => r.sports).filter(x => x === 'win').length, runs.flatMap(r => r.sports).length)} · 축제 성공 ${pct(runs.flatMap(r => r.festival).filter(x => x === 'ok').length, runs.flatMap(r => r.festival).length)}`);
  console.log(`  슬럼프 평균 ${avg(runs.map(r => r.slumps)).toFixed(1)}회 · 최고 스트레스 평균 ${Math.round(avg(runs.map(r => r.stressMax)))} · 한 달 평균 졸음 ${(avg(runs.map(r => r.doze)) / 27).toFixed(1)}일 쓰러짐 ${(avg(runs.map(r => r.collapse)) / 27).toFixed(1)}일 돈없음 ${(avg(runs.map(r => r.broke)) / 27).toFixed(1)}번`);
  console.log(`  성적표: 優 ${pct(count(verd, '優'), verd.length)} · 良 ${pct(count(verd, '良'), verd.length)} · 可 ${pct(count(verd, '可'), verd.length)} · 亂 ${pct(count(verd, '亂'), verd.length)} · 새 일정 해금 평균 ${avg(runs.map(r => r.unlocks)).toFixed(1)}개 · 최저 용돈 평균 ${Math.round(avg(runs.map(r => r.moneyMin)) / 1000)}천원`);
}
const { CAREER_ENDINGS } = await import('@/content/careerEndings');
const never = CAREER_ENDINGS.filter(e => !allEndings[e.key]).map(e => e.key);
console.log(`\n■ 전체 엔딩 ${Object.keys(allEndings).length}/${CAREER_ENDINGS.length}종 나옴 · 한 번도 안 나온 것: ${never.join(', ')}`);
realSetTimeout(() => process.exit(0), 10);
