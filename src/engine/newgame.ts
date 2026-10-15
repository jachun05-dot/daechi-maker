/* 새 게임: 전생의 죽음의 순간(프롤로그) → 기상 → 이름 → 입학식 */
import type { GameState } from './types';
import { ui, useUI } from '@/store/ui';
import { game, migrate, newState, refresh, saves } from './state';
import { deliverMessages } from './phone';
import { beginTurn } from './month';

export const DEFAULT_NAME = '서단비';

export async function newGame() {
  if (useUI.getState().busy) return;
  ui.setBusy(true);
  game.state = null;
  useUI.setState({ titleOpen: false, sheetSlot: null, run: null, phoneRoom: null, tab: 'schedule' });

  await ui.inkIn('— 새 학기 전날 밤 —', 'night');
  ui.setTheme('night');
  const prologue = ui.playScene('prologue', { theme: 'night', bg: 'dream' });
  await ui.inkOut();
  await prologue;
  await ui.inkIn('', 'day');
  ui.setTheme('day');
  const wake = ui.playScene('wakeup', { theme: 'day', bg: 'room_night' });
  await ui.inkOut();
  await wake;

  const raw = await ui.modal<string>({ title: '다이어리 첫 장', text: '새 학기 다이어리의 첫 장.\n가장 먼저, 나의 이름을 적는다.', input: DEFAULT_NAME, buttons: [{ label: '적는다', value: true, primary: true }] });
  const name = (raw || DEFAULT_NAME).replace(/[<>|{}]/g, '').slice(0, 8) || DEFAULT_NAME;
  game.meta.lastName = name;
  game.state = newState(name);
  game.meta.memories.self1 = true;
  game.meta.plays++;
  saves.saveMeta();

  await ui.playScene('opening.1', { theme: 'day' });
  ui.setTheme('day');
  game.state.flags.open1 = true;
  deliverMessages(game.state);
  ui.setBusy(false);
  await beginTurn();
}

export function loadGame(data: GameState) {
  game.state = migrate(data);
  game.midMonth = false;
  useUI.setState({ titleOpen: false, theme: 'day', tab: 'schedule', phoneRoom: null, busy: false });
  refresh();
  ui.toast(`이어서 살아갑니다 · ${data.name}`);
}

export function toTitle() {
  game.midMonth = false;
  useUI.setState({ titleOpen: true, run: null, vn: null, map: null, sheetSlot: null, theme: 'day', busy: false });
}
