/* =========================================================
   한 주(턴) 진행: 일정 실행 → 조우 → 월말 이벤트 → 밤의 꿈 → 다음 턴
   ========================================================= */
import type { CharId, GameState } from './types';
import { BALANCE } from '@/config/balance';
import { SLOTS } from '@/content/schedule';
import { TURNS, SEASON_LABEL } from '@/content/calendar';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { ui, sleep, useUI } from '@/store/ui';
import { applyDelta, getOption } from './schedule';
import { affChips, deltaChips, won } from './chips';
import { S, clamp, hpMax, refresh, saves, unlockMemory, game } from './state';
import { DREAMS, getScene, hasScene, type Dream } from './story/library';
import { josa } from './story/context';
import { deliverMessages, pushMsg } from './phone';
import { scheduleImage } from './assets';
import { monthEvent } from './events';
import { finale } from './finale';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

export async function runWeek() {
  const st = S();
  if (useUI.getState().busy || st.plan.some(p => !p)) return;
  ui.setBusy(true);
  st.lastPlan = [...st.plan];
  const T = TURNS[st.turn];
  ui.runOpen(`${T.label} · 이번 주`, `${SEASON_LABEL[T.season]} · ${T.title}`);
  let quota = BALANCE.encounter.maxScenesPerWeek, broke = false;

  for (let i = 0; i < SLOTS.length; i++) {
    const slot = SLOTS[i], o = getOption(i, st.plan[i])!;
    await sleep(350);
    const tag = `${slot.label} · ${slot.time} · ${o.place}`;
    if ((o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0) {
      const d = applyDelta(st, { hp: 4, stress: 3 }, false);
      ui.runLog({ title: `${o.name} 취소`, tag, body: '용돈이 부족해 계획을 포기하고 집으로 돌아왔다. 통장 잔고를 보며 한숨을 쉬었다.', chips: deltaChips(d), tone: 'warn', mark: '취' });
      refresh();
      continue;
    }
    const d = applyDelta(st, o.delta, true);
    ui.runLog({ title: o.name, tag, body: pick(o.logs), chips: deltaChips(d), mark: o.place[0], image: scheduleImage(o.id) });
    refresh();

    if (o.who && Math.random() < (st.met[o.who] ? BALANCE.encounter.chance : BALANCE.encounter.firstMeetChance)) {
      await sleep(250);
      if (quota > 0) { quota--; await encounter(o.who, o.bg); }
      else glance(o.who);
    }
    if (st.hp <= 0) { await sick(); broke = true; break; }
    if (st.stress >= 100) { await slump(); broke = true; break; }
  }

  await sleep(300);
  ui.runLog({
    title: '한 주가 끝났다', tone: 'sum', mark: '終',
    body: broke ? '계획대로 되지 않은 한 주였다. 그래도, 내일은 온다.' : '빼곡했던 시간표의 마지막 칸에 체크 표시를 했다.',
    chips: [{ label: `체력 ${st.hp}/${hpMax(st)}`, tone: 'plain' }, { label: `스트레스 ${st.stress}`, tone: 'plain' }, { label: won(st.money), tone: 'money' }],
  });
  await ui.runWait('하루를 마무리한다');
  await sihyunRescue(st);
  await monthEvent(st, T);

  if (st.turn === TURNS.length - 1) { ui.runClose(); ui.setBusy(false); return finale(); }

  const dream = pickDream(st);
  if (dream) {
    ui.runLog({ title: '밤이 깊었다', mark: '夜', body: '눈꺼풀이 무거워졌다. 어디선가 아주 먼 북소리가, 사백 년 너머에서 들려왔다.' });
    await ui.runWait('꿈속으로');
    ui.runClose();
    await dreamSequence(dream);
  } else {
    ui.runLog({ title: '꿈 없는 밤', mark: '眠', body: pick(['이상하게 조용한 밤이었다. 꿈속의 불길도, 목소리도 없이.', '어렴풋이 북소리가 들린 것 같았지만, 눈을 뜨자 기억나지 않았다.', '깊이 잤다. 머리맡의 배꽃 향기가 꿈을 막아 준 것처럼.']) });
    await ui.runWait('아침이 밝았다');
    ui.runClose();
  }
  ui.setBusy(false);
  await endTurn();
}

/* ---------- 조우 ---------- */
async function encounter(c: CharId, bg: string) {
  const st = S();
  const before = { ...st.aff };
  st.met[c] = true;
  const step = st.encounterStep[c];
  const id = `enc.${c}.${step + 1}`;
  let nodes, gain;
  if (hasScene(id) && st.aff[c] >= Number(getScene(id).attrs.min ?? 0)) {
    nodes = getScene(id).nodes; st.encounterStep[c]++; gain = BALANCE.encounter.scriptedGain;
  } else {
    const small = getScene(`enc.${c}.small`).nodes;
    nodes = [{ t: 'say' as const, text: `${josa(CHARACTERS[c].name, '과/와')} 마주쳤다.`, line: 0 }, pick(small)];
    gain = BALANCE.encounter.smallGain;
  }
  st.aff[c] = clamp(st.aff[c] + gain, 0, 100);
  st.stat.spirit += BALANCE.encounter.spiritGain;
  await ui.playScene(nodes, { theme: 'day', bg });
  ui.setTheme('day');
  const diff: Partial<Record<CharId, number>> = {};
  for (const k of CHAR_ORDER) if (st.aff[k] !== before[k]) diff[k] = st.aff[k] - before[k];
  ui.runLog({ title: `${CHARACTERS[c].name} — 인연이 깊어졌다`, tone: 'char', mark: CHARACTERS[c].hanja[0], color: CHARACTERS[c].color, chips: affChips(diff) });
  refresh();
}

function glance(c: CharId) {
  const st = S();
  st.met[c] = true;
  st.aff[c] = clamp(st.aff[c] + BALANCE.encounter.glanceGain, 0, 100);
  ui.runLog({ title: `${josa(CHARACTERS[c].name, '과/와')} 잠깐 눈인사를 나눴다`, tone: 'char', mark: CHARACTERS[c].hanja[0], color: CHARACTERS[c].color, chips: affChips({ [c]: BALANCE.encounter.glanceGain }) });
}

/* ---------- 위기 ---------- */
async function sick() {
  const st = S(), B = BALANCE.sick;
  ui.runLog({ title: '강제 병결', tone: 'warn', mark: '病', body: '눈앞이 하얘지더니, 그대로 쓰러졌다. 남은 일정은 모두 취소되었다.' });
  await ui.playScene('event.sick', { theme: 'day' });
  ui.setTheme('day');
  st.hp = Math.round(hpMax(st) * B.hpRatioAfter);
  st.stress = clamp(st.stress + B.stressAdd, 0, 100);
  st.money = Math.max(0, st.money - B.hospitalCost);
  pushMsg(st, 'mom', '병원비는 엄마가 냈다. 대신 이번 주는 무조건 쉬어. 알았지?');
  ui.runLog({ title: '이틀간 입원', mark: '院', chips: [{ label: `체력 ${st.hp}`, tone: 'up' }, { label: `용돈 −${B.hospitalCost / 10000}만`, tone: 'money' }] });
  refresh();
}

async function slump() {
  const st = S();
  ui.runLog({ title: '슬럼프', tone: 'warn', mark: '亂', body: '펜을 쥔 손이 움직이지 않았다. 모든 게 의미 없게 느껴졌다.' });
  const v = await ui.playScene('event.slump', { theme: 'day' });
  ui.setTheme('day');
  st.stress = v === 'sihyun' ? 30 : v === 'mujin' ? 40 : 45;
  if (v === 'sleep') st.hp = clamp(st.hp + 30, 0, hpMax(st));
  const lose = pick(['int', 'art', 'sense', 'cha'] as const);
  st.stat[lose] = Math.max(0, st.stat[lose] - BALANCE.slump.statPenalty);
  ui.runLog({ title: '다시 일어섰다', mark: '起', body: '바닥을 친 덕분에 오히려 가벼워졌다.', chips: deltaChips({ stress: st.stress, [lose]: -BALANCE.slump.statPenalty }) });
  refresh();
}

async function sihyunRescue(st: GameState) {
  const year = TURNS[st.turn].year;
  if (!(st.stress >= 70 && st.met.sihyun && st.aff.sihyun >= 15 && !st.flags[`rescue${year}`])) return;
  st.flags[`rescue${year}`] = true;
  const before = st.stress;
  await ui.playScene('event.sihyun_rescue', { theme: 'day' });
  ui.setTheme('day');
  ui.runLog({ title: '한밤의 탈출 — 류시현', tone: 'char', mark: '柳', color: CHARACTERS.sihyun.color, body: '숨통이 트였다.', chips: deltaChips({ stress: st.stress - before }) });
  refresh();
}

/* ---------- 밤의 꿈 ---------- */
export function pickDream(st: GameState): Dream | null {
  const cand = DREAMS.filter(d => {
    if (d.auto || st.memories[d.id]) return false;
    const c = d.ch as CharId;
    if (!st.met[c] || st.aff[c] < d.aff || st.stat.spirit < d.spirit) return false;
    if (d.ep > 1 && !DREAMS.some(p => p.ch === d.ch && p.ep === d.ep - 1 && st.memories[p.id])) return false;
    return d.requires.every(r => st.memories[r]);
  }).sort((a, b) => st.aff[b.ch as CharId] - st.aff[a.ch as CharId]);
  return cand[0] ?? null;
}

export async function dreamSequence(d: Dream, replay = false) {
  await ui.inkIn(`— 그날 밤, 꿈을 꾸었다 —\n${d.title}`, 'night');
  ui.setTheme('night');
  const p = ui.playScene(d.id, { theme: 'night', bg: 'dream', replay });
  await ui.inkOut();
  await p;
  if (!replay && game.state) {
    if (unlockMemory(d.id)) { game.state.stat.spirit += BALANCE.dreamSpiritBonus; game.state.newMemory = true; }
  }
  await ui.inkIn(replay ? '' : '— 새벽, 눈을 떴다 —', 'day');
  ui.setTheme('day');
  await ui.inkOut();
  if (!replay) ui.toast(`전생의 기억 조각 해금 · ${d.title}`);
  refresh();
}

/* ---------- 턴 넘김 ---------- */
async function endTurn() {
  const st = S();
  st.turn++;
  const T = TURNS[st.turn], P = BALANCE.perTurn;
  st.money += P.allowance;
  st.hp = clamp(st.hp + (T.vacation ? P.hpRegenVacation : P.hpRegen), 0, hpMax(st));
  st.stress = clamp(st.stress - P.stressDecay, 0, 100);
  st.plan = [null, null, null, null, null];
  const n = deliverMessages(st);
  if (n) setTimeout(() => ui.toast(`새 메시지 ${n}개`), 900);
  await beginTurn();
}

export async function beginTurn() {
  const st = S();
  const T = TURNS[st.turn];
  if (T.month === 3 && !st.flags[`open${T.year}`]) {
    st.flags[`open${T.year}`] = true;
    if (T.year > 1) {
      await ui.playScene(`opening.${T.year}`, { theme: 'day' });
      ui.setTheme('day');
    }
    // 2학년 3월: 주인공의 두 번째 전생 기억(self2)
    const self2 = DREAMS.find(d => d.id === 'self2');
    if (T.year === 2 && self2 && !st.memories.self2) await dreamSequence(self2);
  }
  refresh();
  saves.autosave();
}
