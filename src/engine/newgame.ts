/* 새 게임: 프롤로그 꿈 → 기상 → 이름 → 질문 3개로 루트 결정 → 입학식 */
import type { RouteId, StoryNode } from './types';
import { QUESTIONS, ROUTES } from '@/content/routes';
import { STAT_FULL } from './schedule';
import { ui, useUI } from '@/store/ui';
import { game, migrate, newState, refresh, saves } from './state';
import { deliverMessages } from './phone';
import { won } from './chips';
import { beginTurn } from './week';
import type { GameState } from './types';

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

  const tally: Record<RouteId, number> = { med: 0, idol: 0, actor: 0, ceo: 0 };
  let last: RouteId = 'med';
  for (const q of QUESTIONS) {
    const nodes: StoryNode[] = [
      { t: 'say', text: q.q, line: 0 },
      { t: 'choice', line: 0, options: q.answers.map(a => ({ text: a.text, eff: {}, value: a.route, body: [] })) },
    ];
    const r = (await ui.playScene(nodes, { theme: 'day', bg: 'room_night' })) as RouteId;
    tally[r]++; last = r;
  }
  const max = Math.max(...Object.values(tally));
  const route = tally[last] === max ? last : (Object.keys(tally) as RouteId[]).find(k => tally[k] === max)!;
  const R = ROUTES[route];

  game.state = newState(name, route);
  game.meta.lastRoute = route;
  game.meta.memories.self1 = true;
  game.meta.plays++;
  saves.saveMeta();

  const bonus = Object.entries(R.bonus).map(([k, v]) => `${STAT_FULL[k as keyof typeof STAT_FULL]} +${v}`).join(', ') + (R.bonusMoney ? `, 초기 용돈 +${won(R.bonusMoney)}` : '');
  await ui.modal({
    title: '꿈이 정해졌다',
    text: `[${R.label}]\n\n현생의 꿈 · ${R.goal}\n전생 · ${R.past}\n\n${R.desc}\n\n초기 보너스 · ${bonus}`,
    buttons: [{ label: '이번 생을 시작한다', value: true, primary: true }],
  });

  await ui.playScene('opening.1', { theme: 'day' });
  ui.setTheme('day');
  game.state.flags.open1 = true;
  deliverMessages(game.state);
  ui.setBusy(false);
  await beginTurn();
}

export function loadGame(data: GameState) {
  game.state = migrate(data);
  useUI.setState({ titleOpen: false, theme: 'day', tab: 'schedule', phoneRoom: null, busy: false });
  refresh();
  ui.toast(`이어서 살아갑니다 · ${data.name}`);
}

export function toTitle() {
  useUI.setState({ titleOpen: true, run: null, vn: null, sheetSlot: null, theme: 'day', busy: false });
}
