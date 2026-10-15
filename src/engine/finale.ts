/* =========================================================
   3학년 12월 — 졸업 → 사야 출국 → 마지막 기억 → 엔딩
   판정 순서: ① 커리어  ② 파트너(진/노멀/자아실현)  ③ 크레딧  ④ 사야 에필로그
   ========================================================= */
import type { CharId } from './types';
import { BALANCE } from '@/config/balance';
import { ENDINGS } from '@/content/endings';
import { ui, useUI } from '@/store/ui';
import { careerResult } from './schedule';
import { DREAMS, getScene } from './story/library';
import { fill } from './story/context';
import { game, recordEnding, S, saves } from './state';
import { dreamSequence } from './week';

const FIVE: CharId[] = ['ian', 'mujin', 'sihyun', 'seoha', 'taejun'];
const hasAllMemories = (c: CharId) => [1, 2, 3].every(n => S().memories[`${c}${n}`]);

async function play(sceneId: string, got: string[]) {
  await ui.playScene(sceneId, { theme: 'day' });
  const ending = getScene(sceneId).attrs.ending;
  if (ending) { recordEnding(ending); got.push(ending); }
}

export async function finale() {
  const st = S(), E = BALANCE.ending;
  const got: string[] = [];

  await ui.playScene('event.graduation', { theme: 'day' });

  const hidden = st.memories.saya4 && st.aff.saya >= E.sayaHidden.aff
    && (st.goal === 'med' || st.stat.spirit >= E.sayaHidden.spirit || st.stat.int >= E.sayaHidden.int);
  if (st.met.saya && st.aff.saya >= E.sayaMinAff) await ui.playScene(hidden ? 'saya.leave.hidden' : 'saya.leave', { theme: 'day' });

  const self3 = DREAMS.find(d => d.id === 'self3');
  if (self3) await dreamSequence(self3);

  // ① 커리어
  const career = careerResult(st);
  await play(`career.${career}`, got);

  // ② 파트너
  const trueCands = FIVE.filter(c => st.aff[c] >= E.trueAff && hasAllMemories(c)).sort((a, b) => st.aff[b] - st.aff[a]);
  const best = [...FIVE].sort((a, b) => st.aff[b] - st.aff[a])[0];
  if (career !== 'none' && trueCands.length) await play(`true.${trueCands[0]}`, got);
  else if (career === 'none' && st.aff[best] >= E.normalAff) await play(`normal.${best}`, got);
  else if (career !== 'none') await play('solo', got);

  // ③ 크레딧
  await ui.credits();

  // ④ 사야
  if (st.flags.saya_saved) {
    await ui.playScene('saya.alive', { theme: 'day' });
    const ctx = { state: st, name: st.name, route: st.route, vars: {} };
    const letter = getScene('saya.letter').nodes.map(n => (n.t === 'say' ? fill(n.text, ctx) : '')).join('\n\n');
    await ui.modal({ title: '사야의 편지', letter, buttons: [{ label: '편지를 가슴에 안는다', value: true, primary: true }] });
    await play('saya.alive.after', got);
  } else {
    await play(st.met.saya ? 'saya.dead' : 'saya.dead.stranger', got);
  }

  game.meta.clears++;
  saves.saveMeta();
  saves.clearAuto();
  const list = got.map(id => ENDINGS.find(e => e.id === id)).filter((e): e is (typeof ENDINGS)[number] => !!e);
  await ui.modal({
    title: `${st.name}의 이번 생`,
    text: `해금한 전생 기억 ${Object.keys(game.meta.memories).length}/${DREAMS.length} · 엔딩 ${Object.keys(game.meta.endings).length}/${ENDINGS.length}\n전생의 기억과 엔딩은 다음 생에도 남습니다.`,
    endings: list.map(e => ({ title: e.title, kind: e.kind })),
    buttons: [{ label: '타이틀로', value: true, primary: true }],
  });
  game.state = null;
  useUI.setState({ theme: 'day', titleOpen: true, tab: 'schedule' });
}
