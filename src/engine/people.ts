/* =========================================================
   인물 이야기 — 메인 이벤트(main.*) · 짧은 만남(basic.*) · 호감도 기록
   메인 이벤트 조건은 장면 머리말(aff= year= spirit= place= auto=1)에서 온다 → story/library.ts
   ========================================================= */
import type { CharId, GameState, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { TURNS } from '@/content/calendar';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { ui } from '@/store/ui';
import { affChips } from './chips';
import { addAff, addSighting, refresh } from './state';
import { getScene, mainEventsOf, type MainEvent } from './story/library';
import { josa } from './story/context';
import { emit } from './triggers';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const yearOf = (st: GameState) => TURNS[Math.min(st.turn, TURNS.length - 1)].year;

export function nextMain(st: GameState, c: CharId): MainEvent | null {
  const list = mainEventsOf(c);
  const e = list.find(x => x.step === st.mainStep[c] + 1);
  if (!e) return null;
  if (yearOf(st) < e.year || st.aff[c] < e.aff || st.stat.spirit < e.spirit) return null;
  return e;
}
export const mainDone = (st: GameState, c: CharId) => st.mainStep[c] >= mainEventsOf(c).length;

export async function playMain(st: GameState, e: MainEvent, theme: 'day' = 'day', place?: string) {
  const c = e.ch as CharId;
  const before = { ...st.aff };
  st.met[c] = true;
  addAff(st, c, BALANCE.affection.main);
  st.stat.spirit += BALANCE.affection.spiritOnMeet;
  if (place) addSighting(st, c, place);
  await ui.playScene(e.id, { theme });
  ui.setTheme('day');
  st.mainStep[c] = e.step;
  emit(st, `main:${c}.${e.step}`);
  logAff(st, before, `${CHARACTERS[c].name} — 이야기가 움직였다`, c);
}

export function logAff(st: GameState, before: Record<CharId, number>, title: string, c: CharId, body?: string) {
  const diff: Partial<Record<CharId, number>> = {};
  for (const k of CHAR_ORDER) if (st.aff[k] !== before[k]) diff[k] = st.aff[k] - before[k];
  ui.runLog({ title, body, tone: 'char', mark: CHARACTERS[c].hanja[0], color: CHARACTERS[c].color, chips: affChips(diff) });
  refresh();
}

/** 기본 이벤트 — 짧은 만남. 첫 만남(메인 이벤트 1)을 본 사람만 (st.met) */
export async function basicMeet(st: GameState, c: CharId, where: string, bg: string) {
  if (!st.met[c]) return;
  const before = { ...st.aff };
  addAff(st, c, BALANCE.affection.basic);
  st.stat.spirit += BALANCE.affection.spiritOnMeet;
  addSighting(st, c, where);
  const small = getScene(`basic.${c}`).nodes;
  const nodes: StoryNode[] = [{ t: 'say', text: `${where}에서 ${josa(CHARACTERS[c].name, '과/와')} 마주쳤다.`, line: 0 }, pick(small)];
  await ui.playScene(nodes, { theme: 'day', bg });
  ui.setTheme('day');
  emit(st, `meet:${c}`);
  logAff(st, before, `${josa(CHARACTERS[c].name, '을/를')} 만났다`, c, where);
}

/** 자동 발생형 메인 이벤트 — 첫 만남(1번)은 조건이 되면 모두, 그 밖에는 한 달에 하나 */
export async function autoMainEvent(st: GameState) {
  for (const c of CHAR_ORDER) {
    const e = nextMain(st, c);
    if (e && e.auto && e.step === 1) await playMain(st, e, 'day');
  }
  for (const c of CHAR_ORDER) {
    const e = nextMain(st, c);
    if (e && e.auto) { await playMain(st, e, 'day'); return; }
  }
}
