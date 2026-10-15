/* =========================================================
   한 달(턴) 진행
   평일 시간표 자동 진행 → 주말 계획판 (토·일 낮·저녁, weekend.ts) × 4주 → 월말 이벤트 → 밤의 꿈 → 다음 달
   ========================================================= */
import type { CharId, GameState, StoryNode } from './types';
import { BALANCE } from '@/config/balance';
import { TURNS, SEASON_LABEL, DAY_LABEL, type Turn } from '@/content/calendar';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { CLUBS } from '@/content/timetable';
import { SCHOOL_PEOPLE } from '@/content/presence';
import { SUBJECT_LABEL } from '@/content/careers';
import { ui, useUI } from '@/store/ui';
import { addDelta, applyDelta, clubAt, findClub, findOption, growthMult, topTalent, type Delta } from './timetable';
import { affChips, deltaChips, won } from './chips';
import { S, addAff, addSighting, clamp, game, hpMax, refresh, saves, unlockMemory } from './state';
import { DREAMS, getScene, mainEventsOf, type Dream, type MainEvent } from './story/library';
import { josa } from './story/context';
import { chatEvent, dayOf, dayTick } from './phone';
import { monthEvent } from './events';
import { runVacation } from './vacation';
import { finale } from './finale';
import { computePresence, runWeekend } from './weekend';

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const yearOf = (st: GameState) => TURNS[Math.min(st.turn, TURNS.length - 1)].year;

/* =========================================================
   달 시작
   ========================================================= */
export async function beginTurn() {
  const st = S();
  const T = TURNS[st.turn];
  if (T.month === 3 && !st.flags[`open${T.year}`]) {
    st.flags[`open${T.year}`] = true;
    if (T.year > 1) { await ui.playScene(`opening.${T.year}`, { theme: 'day' }); ui.setTheme('day'); }
    // 2학년 3월: 지금 가장 자라는 재능에 따라 전생의 꿈이 드러난다
    if (T.year === 2 && !st.memories.self2) {
      st.pastRole = topTalent(st);
      const d = DREAMS.find(x => x.id === 'self2');
      if (d) await dreamSequence(d);
    }
  }
  if (!T.summer && st.clubTerm !== T.term) await pickClub(st, T);
  await autoMainEvent(st);
  // 메신저 — 달이 바뀌면 생기는 대화
  chatEvent(st, `turn:${st.turn}`);
  chatEvent(st, `month:${T.month}`);
  if (T.month === 3) chatEvent(st, `year:${T.year}`);
  if (st.turn % 3 === 0) chatEvent(st, 'allowance');
  if (!T.summer) computePresence(st, T, st.turn);
  await dayTick(st, dayOf(st.turn, 0, 0) - 1, false);
  refresh();
  saves.autosave();
}

/** 학기마다 동아리 선택 */
async function pickClub(st: GameState, T: Turn) {
  const year = T.year;
  const club = await ui.modal<string>({
    title: `${T.year}학년 ${T.month >= 8 ? '2' : '1'}학기 동아리`,
    text: '이번 학기 동아리를 고르세요. 정해진 요일 방과후에 고정됩니다.',
    options: CLUBS.map(c => ({
      label: c.name + (c.days.length ? ` (${c.days.map(d => DAY_LABEL[d]).join('·')})` : ''),
      desc: c.desc + (c.who && (!c.whoYears || c.whoYears.includes(year)) && st.met[c.who] ? ` · ${CHARACTERS[c.who].name}이(가) 있다` : ''),
      chips: deltaChips(c.delta), value: c.id,
    })),
    buttons: [],
  });
  st.club = club;
  st.clubTerm = T.term;
  // 동아리 요일에 들어 있던 방과후 일정은 비운다
  const c = findClub(club);
  c?.days.forEach(d => { st.timetable[d * 2] = null; });
}

/** 자동 발생형 메인 이벤트 — 첫 만남(1번)은 조건이 되면 모두, 그 밖에는 한 달에 하나 */
async function autoMainEvent(st: GameState) {
  for (const c of CHAR_ORDER) {
    const e = nextMain(st, c);
    if (e && e.auto && e.step === 1) await playMain(st, e, 'day');
  }
  for (const c of CHAR_ORDER) {
    const e = nextMain(st, c);
    if (e && e.auto) { await playMain(st, e, 'day'); return; }
  }
}

/* =========================================================
   메인 이벤트
   ========================================================= */
export function nextMain(st: GameState, c: CharId): MainEvent | null {
  const list = mainEventsOf(c);
  const e = list.find(x => x.step === st.mainStep[c] + 1);
  if (!e) return null;
  if (yearOf(st) < e.year || st.aff[c] < e.aff || st.stat.spirit < e.spirit) return null;
  return e;
}
export const mainDone = (st: GameState, c: CharId) => st.mainStep[c] >= mainEventsOf(c).length;

export async function playMain(st: GameState, e: MainEvent, theme: 'day' = 'day', place?: string) {
  const c = e.ch as CharId;
  const before = { ...st.aff };
  st.met[c] = true;
  addAff(st, c, BALANCE.affection.main);
  st.stat.spirit += BALANCE.affection.spiritOnMeet;
  if (place) addSighting(st, c, place);
  await ui.playScene(e.id, { theme });
  ui.setTheme('day');
  st.mainStep[c] = e.step;
  chatEvent(st, `main:${c}.${e.step}`);
  logAff(st, before, `${CHARACTERS[c].name} — 이야기가 움직였다`, c);
}

export function logAff(st: GameState, before: Record<CharId, number>, title: string, c: CharId, body?: string) {
  const diff: Partial<Record<CharId, number>> = {};
  for (const k of CHAR_ORDER) if (st.aff[k] !== before[k]) diff[k] = st.aff[k] - before[k];
  ui.runLog({ title, body, tone: 'char', mark: CHARACTERS[c].hanja[0], color: CHARACTERS[c].color, chips: affChips(diff) });
  refresh();
}

/** 기본 이벤트 — 짧은 만남. 첫 만남(메인 이벤트 1)을 본 사람만 (st.met) */
export async function basicMeet(st: GameState, c: CharId, where: string, bg: string) {
  if (!st.met[c]) return;
  const before = { ...st.aff };
  addAff(st, c, BALANCE.affection.basic);
  st.stat.spirit += BALANCE.affection.spiritOnMeet;
  addSighting(st, c, where);
  const small = getScene(`basic.${c}`).nodes;
  const nodes: StoryNode[] = [{ t: 'say', text: `${where}에서 ${josa(CHARACTERS[c].name, '과/와')} 마주쳤다.`, line: 0 }, pick(small)];
  await ui.playScene(nodes, { theme: 'day', bg });
  ui.setTheme('day');
  chatEvent(st, `meet:${c}`);
  logAff(st, before, `${josa(CHARACTERS[c].name, '을/를')} 만났다`, c, where);
}

/* =========================================================
   한 달 실행
   ========================================================= */
export async function runMonth() {
  const st = S();
  if (useUI.getState().busy) return;
  const T = TURNS[st.turn];
  ui.setBusy(true);
  game.midMonth = true;
  st.lastTimetable = [...st.timetable];

  if (T.summer) {
    await runVacation(st, 'summer');
    await dayTick(st, dayOf(st.turn, 3, 6), false);
  } else {
    // 이번 달 돌발 사건이 일어날 (주, 요일)
    const incidents = new Set<string>();
    while (incidents.size < BALANCE.incidentsPerMonth) incidents.add(`${Math.floor(Math.random() * 4)}-${Math.floor(Math.random() * 5)}`);
    let heavyStreak = 0;
    let slumped = false;
    for (let week = 0; week < 4; week++) {
      if (week > 0) computePresence(st, T, st.turn);
      // 근황 톡 — 만난 사람과 지유가 가끔 먼저 연락한다
      for (const r of [...CHAR_ORDER.filter(c => st.met[c]), 'jiyu' as const]) if (Math.random() < BALANCE.phone.idleChance) chatEvent(st, 'idle', r);
      ui.runOpen(`${T.label} · ${week + 1}주차`, `${SEASON_LABEL[T.season]} · ${T.title}`);
      heavyStreak = await runWeekdays(st, T, week, incidents, heavyStreak);
      if (st.stress >= 70 && !st.flags[`ch_stress${st.turn}`]) { st.flags[`ch_stress${st.turn}`] = true; chatEvent(st, 'stress'); }
      if (st.hp < hpMax(st) * 0.25 && !st.flags[`ch_tired${st.turn}`]) { st.flags[`ch_tired${st.turn}`] = true; chatEvent(st, 'tired'); }
      if (st.stress >= 100 && !slumped) { slumped = true; await slump(st); }
      await ui.runWait('주말로');
      ui.runClose();
      await runWeekend(st, T, week, st.turn);
    }
    ui.runOpen(`${T.label} · 한 달 정리`, `${SEASON_LABEL[T.season]} · ${T.title}`);
    ui.runLog({
      title: '한 달이 끝났다', tone: 'sum', mark: '終',
      chips: [{ label: `체력 ${Math.round(st.hp)}/${hpMax(st)}`, tone: 'plain' }, { label: `스트레스 ${Math.round(st.stress)}`, tone: 'plain' }, { label: won(st.money), tone: 'money' }],
    });
    await ui.runWait('이달의 일정');
    await sihyunRescue(st, T);
    await monthEvent(st, T);
    if (T.winterAfter) { ui.runClose(); await runVacation(st, 'winter'); await dayTick(st, dayOf(st.turn, 3, 6), false); }
  }

  if (st.turn === TURNS.length - 1) { ui.runClose(); game.midMonth = false; ui.setBusy(false); return finale(); }

  const dream = pickDream(st);
  ui.runClose();
  if (dream) await dreamSequence(dream);
  game.midMonth = false;
  ui.setBusy(false);
  await endTurn();
}

/* ---------- 평일 ---------- */
async function runWeekdays(st: GameState, T: Turn, week: number, incidents: Set<string>, heavyStreak: number) {
  const W = BALANCE.weekday, D = BALANCE.drowsy, SC = BALANCE.school;
  const total: Delta = {};
  let dozed = 0, collapsed = 0, broke = 0;
  for (let day = 0; day < 5; day++) {
    // 학교 — 피로해도 무조건 간다. 체력이 낮으면 졸아서 덜 오른다
    const ratio = st.hp / hpMax(st);
    const eff = st.hp <= 0 ? D.zero : ratio < D.lowRatio ? D.low : D.normal;
    if (eff < 1) dozed++;
    const school: Delta = { int: SC.int, hp: W.schoolHp };
    if (st.focus) {
      school.int = (school.int ?? 0) + SC.focusInt;
      for (const sk of BALANCE.subjectSkills[st.focus]) school[sk] = (school[sk] ?? 0) + SC.focusSkill / BALANCE.subjectSkills[st.focus].length;
    }
    addDelta(total, applyDelta(st, school, eff * growthMult(st)));

    // 방과후 · 야간
    if (st.hp <= 0) {
      collapsed++;
      addDelta(total, applyDelta(st, { hp: W.collapseRecover }));
    } else {
      let heavyToday = false;
      for (const slot of [0, 1] as const) {
        const club = clubAt(st, day, slot);
        const o = club ?? findOption(slot, st.timetable[day * 2 + slot]);
        if (!o) continue;
        if ((o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0) { broke++; continue; }
        addDelta(total, applyDelta(st, o.delta, growthMult(st)));
        if (club || (o as { heavy?: boolean }).heavy) heavyToday = true;
      }
      heavyStreak = heavyToday ? heavyStreak + 1 : 0;
      if (heavyStreak >= W.heavyStreak) addDelta(total, applyDelta(st, { hp: W.heavyStreakHp }));
    }
    addDelta(total, applyDelta(st, { hp: W.nightRegen }));

    if (incidents.has(`${week}-${day}`)) await incident(st, T, day);
    await dayTick(st, dayOf(st.turn, week, day), true);
  }
  refresh();
  const notes: string[] = [];
  if (dozed) notes.push(`수업 중에 ${dozed}일 졸았다.`);
  if (collapsed) notes.push(`${collapsed}일은 쓰러지듯 잠들어 방과후 일정을 날렸다.`);
  if (broke) notes.push(`용돈이 모자라 ${broke}번 일정을 건너뛰었다.`);
  ui.runLog({
    title: `${week + 1}주차 평일`, tag: st.focus ? `집중 과목 · ${SUBJECT_LABEL[st.focus]}` : '집중 과목 없음',
    body: notes.join(' ') || '시간표대로 한 주를 보냈다.', chips: deltaChips(total), tone: collapsed || dozed ? 'warn' : undefined, mark: '平',
  });
  return heavyStreak;
}

/** 평일 돌발 사건 — 학교 사람, 동아리, 그날 일정에서 마주치는 인물 */
async function incident(st: GameState, T: Turn, day: number) {
  // 이안은 찐남주(기본 루트) — 학교에서 더 자주 마주친다
  const cands: { c: CharId; where: string; bg: string }[] = SCHOOL_PEOPLE[T.year].flatMap(c => Array(c === 'ian' ? 2 : 1).fill({ c, where: '이화고', bg: 'classroom' }));
  const club = findClub(st.club);
  if (club?.who && (!club.whoYears || club.whoYears.includes(T.year)) && club.days.includes(day)) cands.push({ c: club.who, where: club.name, bg: 'school' }, { c: club.who, where: club.name, bg: 'school' });
  for (const slot of [0, 1] as const) {
    const o = findOption(slot, st.timetable[day * 2 + slot]);
    if (o?.who && !(o.who === 'seoha' && T.year > 1)) cands.push({ c: o.who, where: o.place, bg: 'academy' }, { c: o.who, where: o.place, bg: 'academy' });
  }
  // 아직 첫 만남(메인 이벤트 1)을 안 본 사람은 마주치지 않는다
  const p = pick(cands.filter(x => st.met[x.c]));
  if (!p) return;
  ui.runClose();
  await basicMeet(st, p.c, `${DAY_LABEL[day]}요일 ${p.where}`, p.bg);
  ui.runOpen(`${T.label}`, '평일');
}

/* ---------- 위기 ---------- */
export async function slump(st: GameState) {
  ui.runLog({ title: '슬럼프', tone: 'warn', mark: '亂', body: '펜을 쥔 손이 움직이지 않았다. 모든 게 의미 없게 느껴졌다.' });
  chatEvent(st, 'slump');
  const v = await ui.playScene('event.slump', { theme: 'day' });
  ui.setTheme('day');
  st.stress = v === 'sihyun' || v === 'mujin' ? 35 : 45;
  if (v === 'sleep') st.hp = clamp(st.hp + 30, 0, hpMax(st));
  const lose = pick(['int', 'sense', 'cha'] as const);
  st.stat[lose] = Math.max(0, st.stat[lose] - BALANCE.slump.statPenalty);
  ui.runLog({ title: '다시 일어섰다', mark: '起', body: '바닥을 친 덕분에 오히려 가벼워졌다.', chips: deltaChips({ [lose]: -BALANCE.slump.statPenalty }) });
  refresh();
}

async function sihyunRescue(st: GameState, T: Turn) {
  if (!(st.stress >= 70 && st.met.sihyun && st.aff.sihyun >= 15 && !st.flags[`rescue${T.year}`])) return;
  st.flags[`rescue${T.year}`] = true;
  await ui.playScene('event.sihyun_rescue', { theme: 'day' });
  ui.setTheme('day');
  refresh();
}

/* =========================================================
   밤의 꿈
   ========================================================= */
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
    chatEvent(game.state, `dream:${d.id}`);
  }
  await ui.inkIn(replay ? '' : '— 새벽, 눈을 떴다 —', 'day');
  ui.setTheme('day');
  await ui.inkOut();
  if (!replay) ui.toast(`전생의 기억 조각 해금 · ${d.title}`);
  refresh();
}

/* =========================================================
   다음 달로
   ========================================================= */
async function endTurn() {
  const st = S();
  st.turn++;
  const P = BALANCE.perTurn;
  st.money += P.allowance;
  st.stress = clamp(st.stress - P.stressDecay, 0, 100);
  st.timetable = Array(10).fill(null);
  st.focus = null;
  st.phoneTime = BALANCE.phone.callsPerMonth;
  await beginTurn();
}
