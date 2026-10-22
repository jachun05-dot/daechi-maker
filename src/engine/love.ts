/* =========================================================
   연애 진행 — 데이트 · 고백 · 질투 · 연인 소홀 (장면을 띄우는 쪽)
   규칙은 engine/romance.ts, 수치는 balance.ts romance, 설계는 docs/romance/README.md
   장면: 인물 전용(confess.taejun …)이 있으면 그것, 없으면 공용(confess.common …) — stories/events/romance.story
   ========================================================= */
import type { CharId, GameState, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { CHARACTERS } from '@/content/characters';
import { LOVE_LINES } from '@/content/romance';
import { ui, useUI } from '@/store/ui';
import { getScene, hasScene } from './story/library';
import { josa } from './story/context';
import { emit } from './triggers';
import { pushMsg } from './phone';
import { hpMax, refresh } from './state';
import {
  becomeLovers, breakUp, canConfess, daysApart, dateOdds, decayRumor, declineConfess, pickJealousy, recordDate, rollDate,
  spentTime, takeNews, waitConfess, type DateResult,
} from './romance';

const B = () => BALANCE.romance;
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const nameOf = (c: CharId) => CHARACTERS[c].name;
const say = (text: string, who?: string): StoryNode => ({ t: 'say', text, who, line: 0 });

/** 연애 알림(단계 · 열쇠 · 취향)을 진행 기록에 — 진행 화면이 없으면 토스트로 */
export function flushNews() {
  const news = takeNews();
  if (!news.length) return;
  if (useUI.getState().run) {
    for (const n of news) ui.runLog({ title: n.text, tone: 'char', mark: n.kind === 'key' ? '🔑' : n.kind === 'like' ? '♡' : '♥', color: CHARACTERS[n.c].color });
  } else ui.toast(news.map(n => n.text).join('\n'));
}

/** 인물 전용 장면이 있으면 그것, 없으면 공용 */
const sceneFor = (kind: string, c: CharId) => (hasScene(`${kind}.${c}`) ? `${kind}.${c}` : `${kind}.common`);

/* ---------- 데이트 (주말 약속) ---------- */
export const STAMP: Record<DateResult, string> = { great: '대성공!', ok: '성공', fail: '실수…' };

/** 약속한 곳에서 데이트 — 그 사람이 좋아하는 능력·장소로 판정. 돌려준 결과로 호감 배율이 정해진다 */
export async function dateMeet(st: GameState, c: CharId, place: { id: string; name: string; bg: string }, already: boolean): Promise<{ res: DateResult; aff: number }> {
  const odds = dateOdds(st, c, place.id, st.hp / hpMax(st));
  const res = rollDate(odds);
  const aff = Math.round(BALANCE.promise.aff * B().date.mult[res]);
  recordDate(st, c, place.id, res);
  spentTime(st, c, B().rumor.date);
  if (!already) {
    const lead = say(`약속한 ${place.name}. ${josa(nameOf(c), '이/가')} 먼저 와 있었다.`);
    const mid = hasScene(`promise.${c}`) ? [pick(getScene(`promise.${c}`).nodes)] : [];
    const tail = hasScene(`date.${c}.${res}`) ? getScene(`date.${c}.${res}`).nodes : [say(pick(LOVE_LINES.date[res]).replace('{who}', nameOf(c)))];
    await ui.playScene([lead, ...mid, ...tail], { theme: 'day', bg: place.bg, intro: { where: place.name } });
    ui.setTheme('day');
  }
  return { res, aff };
}

/* ---------- 달 시작 — 연인 소홀 · 고백 · 질투 (한 달에 각각 한 번까지) ---------- */
export async function loveMonth(st: GameState) {
  await neglectCheck(st);
  await confession(st);
  decayRumor(st);
  await jealousy(st);
  flushNews();
  refresh();
}

/** 고백 — 썸 + 열쇠 + 시기 → 그 사람이 먼저 */
async function confession(st: GameState) {
  const c = (Object.keys(st.bond) as CharId[]).filter(x => canConfess(st, x)).sort((a, b) => st.aff[b] - st.aff[a])[0];
  if (!c) return;
  const canWait = st.bond[c].confess === 'none';
  const id = sceneFor('confess', c);
  const lead = id === 'confess.common' ? [say(pick(LOVE_LINES.confess), c)] : [];
  const v = (await ui.playScene([...lead, ...getScene(id).nodes], { theme: 'day', vars: { who: nameOf(c), canwait: canWait ? 1 : 0 } })) ?? 'no';
  ui.setTheme('day');
  if (v === 'yes') {
    const ended = becomeLovers(st, c);
    for (const x of ended) pushMsg(st, x, pick(LOVE_LINES.ended));
    emit(st, `confess:yes:${c}`);
  } else if (v === 'wait' && canWait) {
    waitConfess(st, c);
    emit(st, `confess:wait:${c}`);
  } else {
    declineConfess(st, c);
    emit(st, `confess:no:${c}`);
  }
}

/** 소문 → 질투 — 해명 / 솔직히 / 모른 척 */
async function jealousy(st: GameState) {
  const flag = `jl_${st.turn}`;
  if (st.flags[flag]) return;
  const j = pickJealousy(st);
  if (!j) return;
  st.flags[flag] = true;
  const id = sceneFor('jealous', j.by);
  const lead = id === 'jealous.common' ? [say(pick(LOVE_LINES.jealous).replace('{who}', nameOf(j.who)), j.by)] : [];
  const v = ((await ui.playScene([...lead, ...getScene(id).nodes], { theme: 'day', vars: { who: nameOf(j.who), by: nameOf(j.by) } })) ?? 'ignore') as 'explain' | 'honest' | 'ignore';
  ui.setTheme('day');
  const J = B().jealousy[v] ?? B().jealousy.ignore;
  st.aff[j.by] = Math.max(0, Math.min(100, st.aff[j.by] + J.aff));
  st.bond[j.who].rumor = Math.floor(st.bond[j.who].rumor * J.rumor);
  st.bond[j.by].jealousUntil = st.turn + B().rumor.cooldown;
  emit(st, `jealous:${j.by}`);
}

/** 연인을 오래 못 보면 — 먼저 서운한 톡, 더 길어지면 위기 장면 */
async function neglectCheck(st: GameState) {
  const c = st.lover;
  if (!c) return;
  const days = daysApart(st), N = B().neglect;
  if (days >= N.crisisDays) {
    const id = sceneFor('breakup', c);
    const lead = id === 'breakup.common' ? [say(pick(LOVE_LINES.crisis), c)] : [];
    const v = await ui.playScene([...lead, ...getScene(id).nodes], { theme: 'day', vars: { who: nameOf(c) } });
    ui.setTheme('day');
    if (v === 'stay' && st.aff[c] >= N.holdAff) {
      st.bond[c].lastSeen = st.day;          // 다시 붙잡았다
      delete st.flags[`neglect_${c}`];
    } else {
      breakUp(st, c);
      emit(st, `breakup:${c}`);
      ui.toast(`${josa(nameOf(c), '과/와')} 헤어졌다`);
    }
  } else if (days >= N.warnDays && !st.flags[`neglect_${c}`]) {
    st.flags[`neglect_${c}`] = true;
    pushMsg(st, c, pick(LOVE_LINES.miss));
  }
}
