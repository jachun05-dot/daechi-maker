/* =========================================================
   월말 학사 이벤트 — 판정은 여기, 대사는 stories/events/school.story
   ========================================================= */
import type { CareerId, GameState, SkillKey, StoryNode } from './types';
import type { Turn } from '@/content/calendar';
import { BALANCE } from '@/config/balance';
import { CAREERS, SUBJECT_LABEL } from '@/content/careers';
import { ui, type Chip } from '@/store/ui';
import { applyDelta, bestCareers, careerFit, topTalent, type Delta } from './timetable';
import { deltaChips } from './chips';
import { emit } from './triggers';
import { refresh } from './state';
import { getScene } from './story/library';

/** 장면을 보여 준 뒤 진행 화면에 결과 한 줄을 남긴다 */
async function showEvent(T: Turn, scene: string | StoryNode[], vars: Record<string, string | number>, after?: () => Chip[]) {
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
    case 'exam': return exam(st, T);
    case 'sports': {
      const win = st.stat.fit >= BALANCE.sports.base + st.turn * BALANCE.sports.perTurn;
      await showEvent(T, 'event.sports', { win: win ? 1 : 0 }, () => deltaChips(applyDelta(st, win ? { cha: 2, stress: -8 } : { stress: -4 })));
      emit(st, win ? 'sports:win' : 'sports:lose');
      return;
    }
    case 'festival': {
      const kinds: [string, string, number, SkillKey[]][] = [
        ['music', '밴드 공연', (st.skill.vocal + st.skill.dance) / 2, ['vocal', 'dance']],
        ['acting', '연극 무대', (st.skill.acting + st.skill.voice) / 2, ['acting', 'voice']],
        ['debate', '축제 MC', (st.skill.debate + st.skill.language) / 2, ['debate']],
      ];
      const [kind, stage, score, skills] = kinds.sort((a, b) => b[2] - a[2])[0];
      const ok = score >= BALANCE.festival.base + st.turn * BALANCE.festival.perTurn;
      const delta: Delta = ok ? { sense: 3, cha: 3, stress: -10, [skills[0]]: 3 } : { cha: 1, stress: -3 };
      await showEvent(T, 'event.festival', { kind, stage, ok: ok ? 1 : 0 }, () => deltaChips(applyDelta(st, delta)));
      emit(st, ok ? 'festival:ok' : 'festival:fail');
      return;
    }
    case 'counsel': return T.year === 1 ? counselHint(st, T) : counselDecide(st, T);
    case 'suneung': {
      const r = st.stat.int / BALANCE.suneung.intFull;
      await showEvent(T, 'event.suneung', { result: r >= 1 ? 'great' : r >= 0.6 ? 'ok' : 'bad' }, () => deltaChips(applyDelta(st, { stress: -20 })));
      emit(st, 'suneung');
      return;
    }
  }
}

async function exam(st: GameState, T: Turn) {
  const E = BALANCE.exam;
  const academic = st.focus && st.focus !== 'arts';
  const ratio = st.stat.int * (academic ? 1 + E.focusBonus : 1) / (E.base + st.turn * E.perTurn);
  const tier = E.tiers.find(t => ratio >= t.min)!;
  await showEvent(T, 'event.exam', {
    exam: T.title.split(' · ')[0], rank: tier.rank, tier: tier.tier,
    hasFocus: st.focus ? 1 : 0, focus: st.focus ? SUBJECT_LABEL[st.focus] : '',
  }, () => deltaChips(applyDelta(st, tier.eff as Delta)));
  emit(st, `exam:${tier.tier}`);
}

/** 1학년 진로 상담 — 처음으로 꿈의 후보가 언급된다 */
async function counselHint(st: GameState, T: Turn) {
  const hint = topTalent(st);
  st.goalHint = hint;
  await showEvent(T, 'event.counsel.hint', { hint: CAREERS[hint].short });
  emit(st, 'counsel:hint');
}

/** 2학년 진로 상담 — 꿈을 정한다 */
async function counselDecide(st: GameState, T: Turn) {
  const ranked = bestCareers(st);
  const offer: CareerId[] = [...new Set([ranked[0], ranked[1], ...(st.goal ? [st.goal] : []), ...(st.goalHint ? [st.goalHint] : [])])];
  const nodes: StoryNode[] = [
    ...getScene('event.counsel.decide').nodes,
    { t: 'choice', line: 0, options: offer.map(c => ({
      text: `${CAREERS[c].goal} (지금 적합도 ${Math.floor(Math.min(1, careerFit(st, c)) * 100)}%)`, eff: {}, value: c, body: [],
    })) },
  ];
  const v = await showEvent(T, nodes, {});
  if (v && v in CAREERS) {
    st.goal = v as CareerId;
    ui.toast(`꿈을 정했다 · ${CAREERS[st.goal].goal}`);
    emit(st, 'counsel:decide');
  }
}
