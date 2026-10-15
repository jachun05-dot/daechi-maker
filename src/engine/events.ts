/* =========================================================
   월말 학사 이벤트 — 판정은 여기, 대사는 stories/events/school.story
   ========================================================= */
import type { GameState, StatKey } from './types';
import type { Turn } from '@/content/calendar';
import { BALANCE } from '@/config/balance';
import { ROUTES } from '@/content/routes';
import { ui, type Chip } from '@/store/ui';
import { applyDelta, careerFit, type Delta } from './schedule';
import { deltaChips } from './chips';
import { pushMsg } from './phone';
import { refresh } from './state';

/** 장면을 보여 준 뒤 주간 진행 화면에 결과 한 줄을 남긴다 */
async function showEvent(T: Turn, scene: string, vars: Record<string, string | number>, after?: () => Chip[]) {
  ui.runClose();
  const value = await ui.playScene(scene, { theme: 'day', vars });
  ui.setTheme('day');
  const chips = after?.() ?? [];
  ui.runOpen(`${T.label} · ${T.title}`, '이달의 일정');
  ui.runLog({ title: T.title, mark: '月', chips });
  refresh();
  return value;
}

export async function monthEvent(st: GameState, T: Turn) {
  switch (T.event) {
    case 'exam':
    case 'exam_winter': {
      await exam(st, T);
      if (T.event === 'exam_winter') await showEvent(T, 'event.winter', { year: T.year }, () => deltaChips(applyDelta(st, { hp: 15, stress: -8 }, false)));
      return;
    }
    case 'sports': {
      const win = st.stat.fit >= BALANCE.sports.base + st.turn * BALANCE.sports.perTurn;
      await showEvent(T, 'event.sports', { win: win ? 1 : 0 }, () => deltaChips(applyDelta(st, win ? { charm: 4, stress: -8 } : { stress: -4 }, false)));
      return;
    }
    case 'festival': {
      const kinds: [StatKey, string][] = [['art', '밴드 공연'], ['sense', '연극 무대'], ['cha', '축제 MC']];
      const [kind, stage] = kinds.sort((a, b) => st.stat[b[0]] - st.stat[a[0]])[0];
      const ok = st.stat[kind] >= BALANCE.festival.base + st.turn * BALANCE.festival.perTurn;
      const delta: Delta = ok ? { charm: 6, [kind]: 5, stress: -10 } : { charm: 2, stress: -3 };
      await showEvent(T, 'event.festival', { kind, stage, ok: ok ? 1 : 0 }, () => deltaChips(applyDelta(st, delta, false)));
      return;
    }
    case 'counsel': {
      const fit = careerFit(st, st.goal);
      const best = (Object.keys(BALANCE.careers) as GameState['goal'][]).sort((a, b) => careerFit(st, b) - careerFit(st, a))[0];
      const canSwitch = best !== st.goal && careerFit(st, best) > fit + BALANCE.counselSwitchGap;
      const v = await showEvent(T, 'event.counsel', {
        pct: Math.floor(Math.min(1, fit) * 100), level: fit >= 0.8 ? 'good' : fit >= 0.5 ? 'maybe' : 'hard',
        switch: canSwitch ? 1 : 0, best, bestGoal: ROUTES[best].goal,
      });
      if (v === 'switch') { st.goal = best; ui.toast(`꿈이 바뀌었다 · ${ROUTES[best].goal}`); }
      return;
    }
    case 'suneung': {
      const r = st.stat.int / BALANCE.suneung.intFull;
      await showEvent(T, 'event.suneung', { result: r >= 1 ? 'great' : r >= 0.6 ? 'ok' : 'bad' }, () => deltaChips(applyDelta(st, { stress: -20 }, false)));
      return;
    }
    case 'summer':
      await showEvent(T, 'event.summer', {}, () => deltaChips(applyDelta(st, { hp: 15 }, false)));
      return;
  }
}

async function exam(st: GameState, T: Turn) {
  const E = BALANCE.exam;
  const ratio = st.stat.int / (E.base + st.turn * E.perTurn);
  const tier = E.tiers.find(t => ratio >= t.min)!;
  const mom: Record<string, string> = {
    top: '우리 딸 전교 1등!!!\n용돈 10만 원 더 보냈다!! 사랑해!!',
    high: '성적표 봤어~ 잘했다 우리 딸\n용돈 조금 더 넣었어!',
    mid: '성적표 봤다.\n다음엔 조금만 더 해보자? 엄마는 믿어.',
    low: '…성적표 봤다.\n저녁에 얘기 좀 하자.',
  };
  await showEvent(T, 'event.exam', { exam: T.title.split(' · ')[0], rank: tier.rank, tier: tier.tier }, () => deltaChips(applyDelta(st, tier.eff, false)));
  pushMsg(st, 'mom', mom[tier.tier]);
  const good = tier.tier === 'top' || tier.tier === 'high';
  if (st.met.ian && st.aff.ian >= 20 && good) pushMsg(st, 'ian', '시험 잘 봤다며. 도서관에 소문 다 났어.\n…축하해. 진심으로.');
  if (st.met.taejun && st.aff.taejun >= 20) pushMsg(st, 'taejun', good ? '너 나보다 잘 봤더라. …인정.' : '시험 별로였냐. …마카롱 사 줄까.');
}
