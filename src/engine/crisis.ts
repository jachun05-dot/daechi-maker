/* =========================================================
   위기 — 슬럼프(스트레스 100) · 시현의 구조(스트레스 70 + 조건)
   ========================================================= */
import type { GameState } from './types';
import { BALANCE } from '@/config/balance';
import type { Turn } from '@/content/calendar';
import { ui } from '@/store/ui';
import { deltaChips } from './chips';
import { clamp, hpMax, refresh } from './state';
import { emit } from './triggers';
import { bump, gainChips, snap } from './progress';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export async function slump(st: GameState) {
  ui.runLog({ title: '슬럼프', tone: 'warn', mark: '亂', body: '펜을 쥔 손이 움직이지 않았다. 모든 게 의미 없게 느껴졌다.' });
  bump(st, 'slump');
  emit(st, 'slump');
  const v = await ui.playScene('event.slump', { theme: 'day' });
  ui.setTheme('day');
  st.stress = v === 'sihyun' || v === 'mujin' ? 35 : 45;
  if (v === 'sleep') st.hp = clamp(st.hp + 30, 0, hpMax(st));
  const lose = pick(['int', 'sense', 'cha'] as const);
  st.stat[lose] = Math.max(0, st.stat[lose] - BALANCE.slump.statPenalty);
  ui.runLog({ title: '다시 일어섰다', mark: '起', body: '바닥을 친 덕분에 오히려 가벼워졌다.', chips: deltaChips({ [lose]: -BALANCE.slump.statPenalty }) });
  refresh();
}

export async function sihyunRescue(st: GameState, T: Turn) {
  if (!(st.stress >= 70 && st.met.sihyun && st.aff.sihyun >= 15 && !st.flags[`rescue${T.year}`])) return;
  st.flags[`rescue${T.year}`] = true;
  await ui.playScene('event.sihyun_rescue', { theme: 'day' });
  ui.setTheme('day');
  refresh();
}

/** 야식 — 스트레스가 쌓인 주의 밤. 먹으면 스트레스가 풀리고 다음 주 얼굴이 붓는다 */
export async function snackNight(st: GameState) {
  const before = snap(st);
  ui.runHide();
  const v = await ui.playScene(`event.snack.${1 + Math.floor(Math.random() * 3)}`, { theme: 'day' });
  ui.setTheme('day');
  ui.runShow();
  const ate = v === 'ramen' || v === 'tteok';
  if (ate) { bump(st, 'snack'); if (v === 'tteok') bump(st, 'tteok'); st.flags.puffy = true; }
  ui.runLog({ title: ate ? (v === 'tteok' ? '밤 12시의 떡볶이' : '밤 11시의 라면') : '야식을 참았다', body: ate ? '다음 주 아침이 걱정된다.' : '위대한 승리. 배는 졌다.', chips: gainChips(before, snap(st)), mark: '夜' });
  refresh();
}
