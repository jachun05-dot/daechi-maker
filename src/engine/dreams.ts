/* =========================================================
   밤의 꿈 — 달이 끝나면 조건이 맞는 전생 꿈을 하나 꾼다
   꿈 목록·조건은 전생 시대 팩의 dreams/*.story 머리말 → story/library.ts DREAMS
   ========================================================= */
import type { CharId, GameState } from './types';
import { BALANCE } from '@/config/balance';
import { ui } from '@/store/ui';
import { game, refresh, unlockMemory } from './state';
import { DREAMS, type Dream } from './story/library';
import { emit } from './triggers';

export function pickDream(st: GameState): Dream | null {
  const cand = DREAMS.filter(d => {
    if (d.auto || st.memories[d.id]) return false;
    const c = d.ch as CharId;
    if (!st.met[c] || st.aff[c] < d.aff || st.stat.spirit < d.spirit) return false;
    if (d.ep > 1 && !DREAMS.some(p => p.ch === d.ch && p.ep === d.ep - 1 && st.memories[p.id])) return false;
    return d.requires.every(r => st.memories[r]);
  }).sort((a, b) => st.aff[b.ch as CharId] - st.aff[a.ch as CharId]);
  return cand[0] ?? null;
}

export async function dreamSequence(d: Dream, replay = false) {
  await ui.inkIn(`— 그날 밤, 꿈을 꾸었다 —\n${d.title}`, 'night');
  ui.setTheme('night');
  const p = ui.playScene(d.id, { theme: 'night', bg: 'dream', replay });
  await ui.inkOut();
  await p;
  if (!replay && game.state) {
    if (unlockMemory(d.id)) { game.state.stat.spirit += BALANCE.dreamSpiritBonus; game.state.newMemory = true; }
    emit(game.state, `dream:${d.id}`);
  }
  await ui.inkIn(replay ? '' : '— 새벽, 눈을 떴다 —', 'day');
  ui.setTheme('day');
  await ui.inkOut();
  if (!replay) ui.toast(`전생의 기억 조각 해금 · ${d.title}`);
  refresh();
}
