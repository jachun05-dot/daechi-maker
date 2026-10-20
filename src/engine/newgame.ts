/* 새 게임: 전생의 죽음의 순간(프롤로그) → 기상 → 이름 → 입학식 */
import type { GameState } from './types';
import { ERA, ERAS } from '@/content/eras';
import { ui, useUI } from '@/store/ui';
import { game, newState, refresh, saves } from './state';
import { migrate } from './save';
import { resetSessions } from './phone';
import { beginTurn } from './month';
import { setClock } from './clock';

export const DEFAULT_NAME = '서단비';

export async function newGame() {
  if (useUI.getState().busy) return;
  ui.setBusy(true);
  game.state = null;
  resetSessions();
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

  const raw = await ui.modal<string>({ title: '다이어리 첫 장', text: '새 학기 다이어리의 첫 장.\n맨 위 칸에 나의 이름을 적는다.', input: DEFAULT_NAME, buttons: [{ label: '적는다', value: true, primary: true }] });
  const name = (raw || DEFAULT_NAME).replace(/[<>|{}]/g, '').slice(0, 8) || DEFAULT_NAME;
  game.meta.lastName = name;
  game.state = newState(name);
  game.meta.memories.self1 = true;
  game.meta.plays++;
  saves.saveMeta();
  // 새벽에 온 지유 톡을 메신저에도 남긴다
  game.state.chats.jiyu = [
    { from: 'them', text: '야 너 안 자?? 내일 입학식인데 나 떨려서 잠이 안 와ㅠㅠ', time: '일 04:41' },
    { from: 'them', text: '우리 반에 그 로열패밀리 이안 있대. 실화냐;;', time: '일 04:42' },
    { from: 'me', text: '나도 못 자. 이상한 꿈 꿨어.' },
  ];

  await ui.playScene('wakeup.after', { theme: 'day', bg: 'room_night' });

  setClock({ turn: 0, week: 0, day: 0, time: '아침' });
  await ui.playScene('opening.1', { theme: 'day' });
  ui.setTheme('day');
  game.state.flags.open1 = true;
  ui.setBusy(false);
  await beginTurn();
}

export function loadGame(data: GameState) {
  resetSessions();
  const { state: st, notes } = migrate(data);
  game.state = st;
  if (notes.length) console.info('[세이브 정리]', notes);
  game.midMonth = false;
  useUI.setState({ titleOpen: false, theme: 'day', tab: 'schedule', phoneRoom: null, busy: false });
  refresh();
  const era = ERAS[st.era];
  ui.toast(st.era !== ERA.id ? `이 기록은 「${era?.name ?? st.era}」 전생으로 시작한 생이에요 (지금: ${ERA.name})`
    : notes.length ? `이어서 살아갑니다 · 업데이트로 바뀐 내용을 정리했어요 (${notes.join(', ')})`
    : `이어서 살아갑니다 · ${data.name}`);
}

export function toTitle() {
  game.midMonth = false;
  useUI.setState({ titleOpen: true, run: null, vn: null, map: null, sheetSlot: null, theme: 'day', busy: false });
}
