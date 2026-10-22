/* 연애 시스템 — 관계 단계 · 열쇠 · 취향 · 소문 · 고백 · 데이트 판정 (docs/romance/README.md) */
import { describe, expect, it } from 'vitest';
import v3 from './fixtures/save-v3.json';
import type { CharId, GameState, StoryNode } from '@/engine/types';
import { applyEffect, newState } from '@/engine/state';
import { parseEffect, parseStory } from '@/engine/story/parser';
import { checkCond, evalCond } from '@/engine/story/context';
import { SCENES } from '@/engine/story/library';
import { migrate } from '@/engine/save';
import { TURNS } from '@/content/calendar';
import { PLACES } from '@/content/places';
import { CHAR_ORDER } from '@/content/characters';
import { ROMANCE, STAGE } from '@/content/romance';
import { BALANCE } from '@/config/balance';
import {
  allKeysOpen, availableKeys, becomeLovers, breakUp, canConfess, dateOdds, daysApart, declineConfess, hearts, likedPlaces,
  pickJealousy, raiseStage, recordDate, rollDate, spentTime, stageAfterMain, takeNews, waitConfess,
} from '@/engine/romance';

const turnOf = (year: number, month: number) => TURNS.findIndex(t => t.year === year && t.month === month);
function game(over: Partial<GameState> = {}) {
  const st = newState('테스트');
  Object.assign(st, over);
  return st;
}
/** 고백 직전 상태 — 썸 · 호감 충분 · 열쇠 둘 · 2학년 12월 */
function ready(c: CharId = 'taejun') {
  const st = game({ turn: turnOf(2, 12) });
  st.met[c] = true;
  st.aff[c] = 70;
  st.bond[c].stage = STAGE.some;
  st.bond[c].keys = availableKeys(c).slice(0, 2).map(k => k.id);
  return st;
}

describe('이야기 문법', () => {
  it('key: lock: stage: like: 를 읽는다', () => {
    const e = parseEffect(['key:taejun.1', 'lock:taejun.3', 'stage:ian.친구', 'stage:mujin.4', 'like:taejun.river', 'taejun+3'], 't', 1);
    expect(e.keys).toEqual(['taejun.1']);
    expect(e.locks).toEqual(['taejun.3']);
    expect(e.stage).toEqual({ ian: STAGE.friend, mujin: STAGE.some });
    expect(e.likes).toEqual(['taejun.river']);
    expect(e.aff).toEqual({ taejun: 3 });
  });
  it('없는 인물·단계는 오류', () => {
    expect(() => parseEffect(['key:nobody.1'], 't', 1)).toThrow();
    expect(() => parseEffect(['stage:ian.원수'], 't', 1)).toThrow();
  });
  it('조건식 — stage · key · lover · rumor · hearts', () => {
    const st = game();
    st.bond.taejun.stage = 3; st.bond.taejun.keys = ['1']; st.lover = null; st.bond.ian.rumor = 5; st.aff.ian = 45;
    const ctx = { state: st, name: '나', vars: {} };
    for (const c of ['stage.taejun>=3', 'key.taejun.1', 'key.taejun>=1', '!key.taejun.2', 'lover=none', 'rumor.ian>=5', 'hearts.ian=2']) {
      expect(checkCond(c)).toBeNull();
      expect(evalCond(c, ctx)).toBe(true);
    }
    expect(checkCond('stage.nobody>=1')).not.toBeNull();
  });
});

describe('관계 단계', () => {
  it('장면으로만 오르고 내려가지 않는다', () => {
    const st = game();
    stageAfterMain(st, 'taejun', 'main.taejun.2');   // 머리말 stage="친구"
    expect(st.bond.taejun.stage).toBe(STAGE.friend);
    stageAfterMain(st, 'taejun', 'main.taejun.1');   // 첫 만남 — 그대로
    expect(st.bond.taejun.stage).toBe(STAGE.friend);
    takeNews();
  });
  it('연인은 고백으로만, 사귀는 사람이 있으면 다른 사람은 친구까지', () => {
    const st = game();
    raiseStage(st, 'ian', STAGE.lover);
    expect(st.bond.ian.stage).toBe(STAGE.some);
    becomeLovers(st, 'taejun');
    raiseStage(st, 'mujin', STAGE.some);
    expect(st.bond.mujin.stage).toBe(STAGE.friend);
    takeNews();
  });
  it('하트는 호감 20마다 한 칸, 최대 5', () => {
    const st = game();
    st.aff.ian = 59; expect(hearts(st, 'ian')).toBe(2);
    st.aff.ian = 100; expect(hearts(st, 'ian')).toBe(5);
  });
});

describe('열쇠 · 취향', () => {
  it('태준은 이야기에 들어간 열쇠만 센다, 열쇠가 없는 인물은 진 엔딩 조건에서 빠진다', () => {
    expect(availableKeys('taejun').map(k => k.id)).toEqual(['1', '2']);
    const st = game();
    expect(allKeysOpen(st, 'ian')).toBe(true);
    expect(allKeysOpen(st, 'taejun')).toBe(false);
  });
  it('닫힌 열쇠는 다시 열리지 않는다 · 열쇠 뒤 숨은 취향이 드러난다', () => {
    const st = game();
    applyEffect({ locks: ['taejun.1'] }, st);
    applyEffect({ keys: ['taejun.1', 'taejun.2'] }, st);
    expect(st.bond.taejun.keys).toEqual(['2']);
    expect(st.bond.taejun.locked).toEqual(['1']);
    expect(st.bond.taejun.likes).toContain('river');          // after: '2'
    expect(likedPlaces(st, 'taejun')).toContain('hangang');
    takeNews();
  });
  it('모든 이야기 속 열쇠·취향 토큰이 content/romance.ts 에 있다', () => {
    const bad: string[] = [];
    const check = (e: { keys?: string[]; locks?: string[]; likes?: string[] }, where: string) => {
      for (const k of [...(e.keys ?? []), ...(e.locks ?? [])]) { const [c, id] = k.split('.'); if (!ROMANCE[c as CharId]?.keys.some(x => x.id === id)) bad.push(`${where} ${k}`); }
      for (const k of e.likes ?? []) { const [c, id] = k.split('.'); if (!ROMANCE[c as CharId]?.tastes.some(x => x.id === id)) bad.push(`${where} ${k}`); }
    };
    const walk = (ns: StoryNode[], where: string) => ns.forEach(n => {
      if (n.t === 'effect') check(n.eff, where);
      if (n.t === 'choice') n.options.forEach(o => { check(o.eff, where); walk(o.body, where); });
      if (n.t === 'if') n.branches.forEach(b => walk(b.body, where));
    });
    for (const s of Object.values(SCENES)) walk(s.nodes, s.id);
    expect(bad).toEqual([]);
  });
  it('취향 장소와 학교 학년이 올바르다', () => {
    const ids = new Set(PLACES.map(p => p.id));
    for (const c of CHAR_ORDER) {
      for (const t of ROMANCE[c].tastes) if (t.place) expect(ids.has(t.place), `${c}.${t.id}`).toBe(true);
      for (const t of ROMANCE[c].tastes) if (t.after) expect(ROMANCE[c].keys.some(k => k.id === t.after), `${c}.${t.id}`).toBe(true);
      expect(ROMANCE[c].date.stats.length).toBeGreaterThan(0);
    }
  });
});

describe('데이트 판정', () => {
  it('좋아하는 곳이면 대성공이 늘고, 대성공이면 좋아하는 모습을 알게 된다', () => {
    const st = game({ turn: 6 });
    const away = dateOdds(st, 'taejun', 'gangnam', 1), there = dateOdds(st, 'taejun', 'cheongdam', 1);
    expect(there.great).toBeGreaterThan(away.great);
    expect(rollDate({ great: 0.2, fail: 0.1 }, 0.1)).toBe('great');
    expect(rollDate({ great: 0.2, fail: 0.1 }, 0.25)).toBe('fail');
    expect(rollDate({ great: 0.2, fail: 0.1 }, 0.5)).toBe('ok');
    recordDate(st, 'taejun', 'cheongdam', 'great');
    expect(st.bond.taejun.likes).toEqual(expect.arrayContaining(['stat', 'lounge']));
    expect(st.bond.taejun.dates.great).toBe(1);
    takeNews();
  });
  it('🔑1 을 열면 태준은 꿈 쪽 능력을 본다', () => {
    const st = game({ turn: 6, goal: 'med' });
    st.skill.science = 200;
    const before = dateOdds(st, 'taejun', 'gangnam', 1).great;
    st.bond.taejun.keys = ['1'];
    expect(dateOdds(st, 'taejun', 'gangnam', 1).great).toBeGreaterThan(before);
  });
});

describe('소문 · 질투', () => {
  it('학교 안 인물과 같이 있으면 소문이 쌓이고, 가까운 학교 친구가 질투한다', () => {
    const st = game();
    st.met.ian = st.met.mujin = st.met.taejun = true;
    spentTime(st, 'taejun', 5);                       // 학교 밖 — 소문 없음
    expect(st.bond.taejun.rumor).toBe(0);
    for (let i = 0; i < BALANCE.romance.rumor.threshold; i++) spentTime(st, 'mujin', 1);
    expect(pickJealousy(st)).toBeNull();               // 아직 질투할 만큼 가까운 사람이 없다
    st.bond.ian.stage = STAGE.friend; st.aff.ian = 40;
    expect(pickJealousy(st)).toEqual({ who: 'mujin', by: 'ian' });
  });
  it('연인이 먼저 질투한다 (학교 밖이어도)', () => {
    const st = game();
    st.met.ian = st.met.mujin = st.met.taejun = true;
    st.bond.ian.stage = STAGE.friend; st.aff.ian = 40;
    st.aff.taejun = 60; becomeLovers(st, 'taejun');
    st.bond.mujin.rumor = 10;
    expect(pickJealousy(st)).toEqual({ who: 'mujin', by: 'taejun' });
    takeNews();
  });
});

describe('고백 · 연인', () => {
  it('썸 + 열쇠 + 호감 + 시기가 맞아야 고백한다', () => {
    expect(canConfess(ready(), 'taejun')).toBe(true);
    const early = ready(); early.turn = turnOf(2, 11);
    expect(canConfess(early, 'taejun')).toBe(false);
    const late = ready(); late.turn = turnOf(3, 11);
    expect(canConfess(late, 'taejun')).toBe(false);
    const nokey = ready(); nokey.bond.taejun.keys = ['1'];
    expect(canConfess(nokey, 'taejun')).toBe(false);
    const friend = ready(); friend.bond.taejun.stage = STAGE.friend;
    expect(canConfess(friend, 'taejun')).toBe(false);
    expect(canConfess(ready('mujin'), 'mujin')).toBe(true);    // 열쇠가 없는 인물은 썸 + 호감만
  });
  it('기다려 달라고 하면 몇 달 뒤 다시, 거절하면 친구로', () => {
    const st = ready();
    waitConfess(st, 'taejun');
    expect(canConfess(st, 'taejun')).toBe(false);
    st.turn += BALANCE.romance.confess.waitMonths;
    expect(canConfess(st, 'taejun')).toBe(true);
    declineConfess(st, 'taejun');
    expect(st.bond.taejun.stage).toBe(STAGE.friend);
    expect(canConfess(st, 'taejun')).toBe(false);
  });
  it('사귀면 다른 썸은 친구로 정리되고, 오래 못 보면 헤어질 수 있다', () => {
    const st = ready();
    st.bond.mujin.stage = STAGE.some;
    const ended = becomeLovers(st, 'taejun');
    expect(st.lover).toBe('taejun');
    expect(ended).toEqual(['mujin']);
    expect(st.bond.mujin.stage).toBe(STAGE.friend);
    expect(canConfess(ready('mujin'), 'mujin')).toBe(true);
    st.day += 80;
    expect(daysApart(st)).toBe(80);
    breakUp(st, 'taejun');
    expect(st.lover).toBeNull();
    expect(st.bond.taejun.stage).toBe(STAGE.friend);
    takeNews();
  });
});

describe('세이브', () => {
  it('예전 세이브는 본 메인 이벤트로 단계를 어림한다', () => {
    const { state } = migrate(v3);
    expect(state.lover).toBeNull();
    for (const c of CHAR_ORDER) {
      const b = state.bond[c];
      expect(b.keys).toEqual([]);
      expect(b.stage).toBe(!state.met[c] || state.mainStep[c] < 1 ? 0 : b.stage);
      if (state.met[c] && state.mainStep[c] >= 1) expect(b.stage).toBeGreaterThanOrEqual(1);
    }
  });
  it('사귀는 사람이 없는데 연인 단계면 썸으로 고친다', () => {
    const st = newState('x') as unknown as Record<string, any>;
    st.bond.ian.stage = 5;
    st.bond.ian.keys = ['없는열쇠'];
    const { state } = migrate(st);
    expect(state.bond.ian.stage).toBe(STAGE.some);
    expect(state.bond.ian.keys).toEqual([]);
  });
});

describe('공용 장면', () => {
  it('고백 · 질투 · 위기 · 엇갈림 장면이 있고, 엔진이 쓰는 value 를 돌려준다', () => {
    const values = (id: string) => SCENES[id].nodes.flatMap(n => (n.t === 'choice' ? n.options.map(o => o.value) : []));
    expect(values('confess.common')).toEqual(['yes', 'wait', 'no']);
    expect(values('jealous.common')).toEqual(['explain', 'honest', 'ignore']);
    expect(values('breakup.common')).toEqual(['stay', 'go']);
    expect(SCENES['miss.common']).toBeTruthy();
    expect(parseStory('=== x\n* a {value:yes}\n', 't').length).toBe(1);
  });
});
