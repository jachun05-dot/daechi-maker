/* 스마트폰 메신저 */
import type { GameState } from './types';
import { BALANCE } from '@/config/balance';
import { CHAR_ORDER } from '@/content/characters';
import { JIYU, MOM_ALLOWANCE, PHONE } from '@/content/phone';
import { fill } from './story/context';
import { clamp } from './state';

const ctxOf = (st: GameState) => ({ state: st, name: st.name, route: st.route, vars: {} });

export function pushMsg(st: GameState, room: string, text: string, replies?: { text: string; aff: number }[]) {
  (st.chats[room] ??= []).push({ from: 'them', text: fill(text, ctxOf(st)) });
  st.unread[room] = (st.unread[room] ?? 0) + 1;
  if (replies) st.replies[room] = replies;
}

/** 턴이 넘어갈 때 도착하는 메시지들. 도착한 개수를 돌려준다 */
export function deliverMessages(st: GameState): number {
  let n = 0;
  for (const m of JIYU) if (m.turn === st.turn) { pushMsg(st, 'jiyu', m.text); n++; }
  for (const c of CHAR_ORDER) {
    if (!st.met[c]) continue;
    const i = st.phoneStep[c] ?? 0, m = PHONE[c][i];
    if (m && st.aff[c] >= m.min && Math.random() < BALANCE.phoneChance) { pushMsg(st, c, m.text, m.replies); st.phoneStep[c] = i + 1; n++; }
  }
  if (st.turn % 3 === 0) { pushMsg(st, 'mom', MOM_ALLOWANCE[(st.turn / 3) % MOM_ALLOWANCE.length]); n++; }
  return n;
}

export function answer(st: GameState, room: string, index: number) {
  const r = st.replies[room]?.[index];
  if (!r) return;
  st.chats[room].push({ from: 'me', text: r.text });
  if (room in st.aff && r.aff) {
    st.aff[room as 'ian'] = clamp(st.aff[room as 'ian'] + r.aff, 0, 100);
    st.chats[room].push({ from: 'sys', text: '메시지에 하트를 눌렀습니다' });
  }
  delete st.replies[room];
}
