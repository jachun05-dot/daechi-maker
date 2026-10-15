/* =========================================================
   방학 — 특강을 고르면 시간이 빠르게 지나가고,
   호감도가 가장 높은 두 명에게서 특별 이벤트 제안이 온다
   ========================================================= */
import type { CharId, GameState, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { LECTURES } from '@/content/vacation';
import { ui } from '@/store/ui';
import { applyDelta, growthMult, type Delta } from './timetable';
import { deltaChips } from './chips';
import { addAff, refresh } from './state';
import { pushMsg } from './phone';
import { hasScene } from './story/library';

const STAGES = { summer: 3, winter: 2 } as const;

export async function runVacation(st: GameState, season: 'summer' | 'winter') {
  await ui.playScene('vacation.start', { theme: 'day', vars: { season } });
  ui.setTheme('day');

  // 1. 특강 선택
  const lecId = await ui.modal<string>({
    title: season === 'summer' ? '여름방학 특강' : '겨울방학 특강',
    text: '하나를 고르면 방학이 빠르게 지나갑니다.',
    options: LECTURES.map(l => ({ label: l.name, desc: l.desc, chips: deltaChips(l.delta), value: l.id, disabled: (l.delta.money ?? 0) < 0 && st.money + l.delta.money! < 0 })),
    buttons: [],
  });
  const lec = LECTURES.find(l => l.id === lecId) ?? LECTURES[LECTURES.length - 1];
  ui.runOpen(season === 'summer' ? '여름방학' : '겨울방학', lec.name);
  const got = applyDelta(st, lec.delta, growthMult(st));
  ui.runLog({ title: lec.name, body: lec.desc, chips: deltaChips(got), mark: '講' });
  refresh();
  await ui.runWait('방학 중에 온 메시지');
  ui.runClose();
  await ui.playScene('vacation.lecture', { theme: 'day', vars: { lecture: lec.name } });

  // 2. 특별 이벤트 제안 — 호감도 상위 두 명
  const invited = CHAR_ORDER
    .filter(c => st.met[c] && st.aff[c] > 0 && st.vacStage[c][season] < STAGES[season])
    .sort((a, b) => st.aff[b] - st.aff[a])
    .slice(0, BALANCE.vacation.invites);
  if (!invited.length) return;
  for (const c of invited) pushMsg(st, c, `방학인데… 시간 있어? 같이 가고 싶은 데가 있어서.`);
  refresh();

  const nodes: StoryNode[] = [
    { t: 'say', text: `휴대폰에 메시지가 ${invited.length}개 와 있었다. ${invited.map(c => CHARACTERS[c].name).join(', ')}.`, line: 0 },
    { t: 'choice', line: 0, options: [
      ...invited.map(c => ({ text: `${CHARACTERS[c].name}의 제안을 받아들인다`, eff: {}, value: c, body: [] })),
      { text: invited.length > 1 ? '둘 다 거절하고 특강에 집중한다' : '거절하고 특강에 집중한다', eff: {}, value: 'decline', body: [] },
    ] },
  ];
  const v = await ui.playScene(nodes, { theme: 'day', bg: 'room' });

  if (v === 'decline' || !v) {
    const bonus: Delta = {};
    for (const [k, x] of Object.entries(lec.delta)) if (x > 0 && !['hp', 'stress', 'money'].includes(k)) bonus[k as keyof Delta] = x * BALANCE.vacation.declineBonus;
    applyDelta(st, bonus);
    await ui.playScene('vacation.decline', { theme: 'day' });
  } else {
    const c = v as CharId;
    const stage = st.vacStage[c][season] + 1;
    st.vacStage[c][season] = stage;
    addAff(st, c, BALANCE.affection.vacation);
    const id = `vac.${c}.${season}${stage}`;
    if (hasScene(id)) await ui.playScene(id, { theme: 'day' });
    for (const o of invited) if (o !== c) pushMsg(st, o, '…그래. 재밌게 보내.');
  }
  ui.setTheme('day');
  refresh();
}
