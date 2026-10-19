/* =========================================================
   3학년 12월 — 졸업 → 마지막 전생의 밤 → 커리어 → 마지막 선택 → 인연 → 프롤로그 재생 → 크레딧
   ========================================================= */
import type { CharId, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { ENDINGS } from '@/content/endings';
import { CHARACTERS, ROMANCEABLE } from '@/content/characters';
import { ui, useUI } from '@/store/ui';
import { judgeCareer } from './career';
import { DREAMS, getScene, hasScene } from './story/library';
import { game, recordEnding, S, saves } from './state';
import { dreamSequence } from './dreams';
import { mainDone } from './people';

async function play(sceneId: string, got: string[], vars: Record<string, string | number> = {}) {
  await ui.playScene(sceneId, { theme: 'day', vars });
  const ending = getScene(sceneId).attrs.ending;
  if (ending) { recordEnding(ending); got.push(ending); }
}

export async function finale() {
  const st = S(), E = BALANCE.ending;
  const got: string[] = [];

  await ui.playScene('event.graduation', { theme: 'day' });
  const self3 = DREAMS.find(d => d.id === 'self3');
  if (self3 && !st.memories.self3) await dreamSequence(self3);

  // ① 커리어 — 꿈을 못 이뤄도 키운 대로 다른 길이 열린다 (engine/career.ts)
  const career = judgeCareer(st);
  await play(`career.${career.ending.key}`, got, { kind: career.kind });
  const careerOk = !['near', 'base'].includes(career.ending.kind);

  // ② 마지막 선택 — 만난 인물 중 플레이어가 직접 고른다
  const cands = ROMANCEABLE.filter(c => st.met[c]);
  let partner: CharId | 'none' = 'none';
  let truth = 0;
  if (cands.length || st.met.ihyun) {
    const nodes: StoryNode[] = [
      ...getScene('final.choice').nodes,
      { t: 'choice', line: 0, options: [
        ...cands.map(c => ({ text: CHARACTERS[c].finalChoice, eff: {}, value: c, body: [] })),
        ...(st.met.ihyun ? [{ text: CHARACTERS.ihyun.finalChoice, eff: {}, value: 'ihyun', body: [] }] : []),
        { text: '아무에게도 가지 않는다', eff: {}, value: 'none', body: [] },
      ] },
    ];
    const v = (await ui.playScene(nodes, { theme: 'day' })) as CharId | 'none';

    if (v === 'ihyun') {
      if (st.aff.ihyun >= E.ihyunAff && mainDone(st, 'ihyun')) {
        await play('ihyun.end', got);
        if (st.flags.ihyun_truth) await play('ihyun.hidden', got);
        partner = 'ihyun';                 // 손의 주인은 보이지 않는다
      } else await play('reject.ihyun', got);
    } else if (v && v !== 'none') {
      if (st.aff[v] >= E.acceptAff) {
        const isTrue = careerOk && mainDone(st, v);
        await play(`${isTrue ? 'true' : 'normal'}.${v}`, got);
        // 한태준 히든 — [임시 조건] 진 엔딩 + 겨울 방학 이벤트 2단계까지 함께함
        if (isTrue && v === 'taejun' && st.vacStage.taejun.winter >= 2 && hasScene('hidden.taejun')) await play('hidden.taejun', got);
        partner = v;
        if (isTrue && v === 'ian') truth = 1;   // 찐남주: 손의 진짜 주인이 드러난다
      } else await play(`reject.${v}`, got);
    }
  }

  // ③ 프롤로그 재생 — 진주성에서 손을 잡은 얼굴
  await ui.playScene('prologue.hand', { theme: 'night', bg: 'fortress', vars: { partner, truth } });
  ui.setTheme('day');

  // ④ 크레딧
  await ui.credits();

  game.meta.clears++;
  saves.saveMeta();
  saves.clearAuto();
  const list = got.map(id => ENDINGS.find(e => e.id === id)).filter((e): e is (typeof ENDINGS)[number] => !!e);
  await ui.modal({
    title: `${st.name}의 이번 생`,
    text: [
      `해금한 전생 기억 ${Object.keys(game.meta.memories).length}/${DREAMS.length} · 엔딩 ${Object.keys(game.meta.endings).length}/${ENDINGS.length}`,
      career.also.length ? `이런 길도 열려 있었어요 · ${career.also.map(e => e.title).join(', ')}` : '',
      career.close.length ? `조금만 더 했으면 · ${career.close.map(e => e.title).join(', ')}` : '',
      '전생의 기억과 엔딩은 다음 생에도 남습니다.',
    ].filter(Boolean).join('\n'),
    endings: list.map(e => ({ title: e.title, kind: e.kind })),
    buttons: [{ label: '타이틀로', value: true, primary: true }],
  });
  game.state = null;
  useUI.setState({ theme: 'day', titleOpen: true, tab: 'schedule' });
}
