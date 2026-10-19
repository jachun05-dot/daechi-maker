/* =========================================================
   한 달(턴) 진행 — 흐름만 담당
   달 시작(beginTurn) → 평일(weekday.ts) × 주말(weekend.ts) × 4주 → 월말 이벤트(events.ts)
   → 밤의 꿈(dreams.ts) → 다음 달(endTurn)
   인물 이야기는 people.ts, 위기는 crisis.ts, 메신저 사건은 triggers.ts 로 알린다
   ========================================================= */
import type { GameState } from './types';
import { BALANCE } from '@/config/balance';
import { TURNS, SEASON_LABEL, DAY_LABEL, type Turn } from '@/content/calendar';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { CLUBS } from '@/content/timetable';
import { ui, useUI } from '@/store/ui';
import { findClub, topTalent } from './timetable';
import { deltaChips } from './chips';
import { S, clamp, game, hpMax, refresh, saves } from './state';
import { DREAMS } from './story/library';
import { dayOf, dayTick } from './phone';
import { emit } from './triggers';
import { monthEvent } from './events';
import { runVacation } from './vacation';
import { finale } from './finale';
import { computePresence, runWeekend } from './weekend';
import { runWeekdays } from './weekday';
import { autoMainEvent } from './people';
import { sihyunRescue, slump } from './crisis';
import { dreamSequence, pickDream } from './dreams';
import { beginMonthLog } from './progress';
import { showReport } from './report';

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
  emit(st, `turn:${st.turn}`);
  emit(st, `month:${T.month}`);
  if (T.month === 3) emit(st, `year:${T.year}`);
  if (st.turn % 3 === 0) emit(st, 'allowance');
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
  beginMonthLog(st);

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
      for (const r of [...CHAR_ORDER.filter(c => st.met[c]), 'jiyu' as const]) if (Math.random() < BALANCE.phone.idleChance) emit(st, 'idle', { room: r });
      ui.runOpen(`${T.label} · ${week + 1}주차`, `${SEASON_LABEL[T.season]} · ${T.title}`);
      heavyStreak = await runWeekdays(st, T, week, incidents, heavyStreak);
      if (st.stress >= 70 && !st.flags[`ch_stress${st.turn}`]) { st.flags[`ch_stress${st.turn}`] = true; emit(st, 'stress'); }
      if (st.hp < hpMax(st) * 0.25 && !st.flags[`ch_tired${st.turn}`]) { st.flags[`ch_tired${st.turn}`] = true; emit(st, 'tired'); }
      if (st.stress >= 100 && !slumped) { slumped = true; await slump(st); }
      await ui.runWait('주말 계획');
      ui.runClose();
      await runWeekend(st, T, week, st.turn);
    }
    ui.runClose();
    await sihyunRescue(st, T);
    await monthEvent(st, T);
    if (T.winterAfter) { ui.runClose(); await runVacation(st, 'winter'); await dayTick(st, dayOf(st.turn, 3, 6), false); }
  }

  const last = st.turn === TURNS.length - 1;
  await showReport(st, T, last ? '졸업식으로' : '밤이 깊었다');
  if (last) { ui.runClose(); game.midMonth = false; ui.setBusy(false); return finale(); }

  const dream = pickDream(st);
  ui.runClose();
  if (dream) await dreamSequence(dream);
  game.midMonth = false;
  ui.setBusy(false);
  await endTurn();
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
