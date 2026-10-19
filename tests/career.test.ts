/* 커리어 엔딩 — 모든 엔딩에 장면이 있고, 실제로 도달할 수 있는지 */
import { describe, expect, it } from 'vitest';
import { CAREER_ENDINGS, type CareerEnding } from '@/content/careerEndings';
import { SCENES } from '@/engine/story/library';
import { eligible, hist, judgeCareer } from '@/engine/career';
import { newState } from '@/engine/state';
import { BALANCE } from '@/config/balance';
import type { GameState } from '@/engine/types';

const fresh = () => newState('테스트');

/** 조건(need)마다 그 엔딩을 만족시키는 생활 기록 */
const SETUP: Record<string, (st: GameState) => void> = {
  ilta: st => { st.tally['o:tutor'] = 20; },
  nurse: st => { st.placeVisits.hospital = 6; },
  curator: st => { st.placeVisits.hannam = 6; },
  webnovel: st => { st.tally['o:library'] = 20; },
  director: st => { st.placeVisits.seongsu = 5; st.placeVisits.hongdae = 5; },
  composer: st => { st.placeVisits.nakwon = 5; },
  cafe: st => { st.tally['o:cafe'] = 90; st.money = 250_000; },
  creator: st => { st.skill.dance = 40; st.skill.vocal = 30; },
  startup: st => { st.money = 500_000; },
  pe: st => { st.tally.sportsWin = 2; },
  alpine: st => { st.placeVisits.bukhansan = 6; },
  hairmake: st => { st.placeVisits.cheongdam = 6; },
  fashion: st => { st.placeVisits.seongsu = 6; },
  stylist: st => { st.goal = 'idol'; },
  med_near: st => { st.goal = 'med'; Object.assign(st.stat, { int: 170 }); Object.assign(st.skill, { science: 150, medicine: 160 }); },
  idol_near: st => { st.goal = 'idol'; Object.assign(st.stat, { sense: 65, style: 55 }); Object.assign(st.skill, { vocal: 110, dance: 95 }); },
  actor_near: st => { st.goal = 'actor'; Object.assign(st.stat, { sense: 55 }); Object.assign(st.skill, { acting: 120, voice: 70 }); },
  leader_near: st => { st.goal = 'leader'; Object.assign(st.stat, { cha: 60 }); Object.assign(st.skill, { language: 150, debate: 140 }); },
  burnout: st => { st.tally.slump = 2; },
  gymtuber: st => { st.stat.fit = 95; },
  psychic: st => { st.stat.spirit = 270; },
  albaking: st => { st.tally['o:cafe'] = 160; },
  dokseo: st => { st.tally['o:dokseo'] = 160; },
  wonjang: st => { st.money = 350_000; },
  foodmap: st => { for (const p of ['home', 'daechi', 'gangnam', 'schoolgym', 'cheongdam', 'bongeunsa', 'hannam', 'palace', 'daehakro', 'nakwon', 'hospital', 'seongsu', 'hongdae', 'hangang']) st.placeVisits[p] = 1; st.money = 0; },
  civil: st => { Object.assign(st.stat, { int: 80, sense: 70, cha: 75, fit: 70, style: 65 }); },
  neet: st => { st.stress = 10; },
  facecafe: st => { st.stat.style = 90; },
  casting: st => { st.tally.casting = 3; },
  tteokbokki: st => { st.tally.snack = 7; },
  historian: st => { st.placeVisits.palace = 6; },
  hanui: st => { st.pastRole = 'med'; },
  gugak: st => { st.pastRole = 'idol'; },
  madang: st => { st.pastRole = 'actor'; },
};

/** 그 엔딩을 만족하는 상태 — req 는 딱 넘기고, max 는 기본(10)으로 둔다 */
function stateFor(e: CareerEnding) {
  const st = fresh();
  for (const [k, v] of Object.entries(e.req ?? {})) { if (k in st.stat) st.stat[k as 'int'] = v! + 1; else st.skill[k as 'vocal'] = v! + 1; }
  SETUP[e.key]?.(st);
  return st;
}

describe('커리어 엔딩', () => {
  it('모든 엔딩에 장면(career.{key})이 있고 ending id 가 맞다', () => {
    const bad = CAREER_ENDINGS.filter(e => SCENES[`career.${e.key}`]?.attrs.ending !== e.id).map(e => e.key);
    expect(bad).toEqual([]);
  });

  it('id·key 가 겹치지 않는다', () => {
    expect(new Set(CAREER_ENDINGS.map(e => e.id)).size).toBe(CAREER_ENDINGS.length);
    expect(new Set(CAREER_ENDINGS.map(e => e.key)).size).toBe(CAREER_ENDINGS.length);
  });

  it('다른 길·전생·아쉬운·웃픈 엔딩은 모두 도달할 수 있다', () => {
    const unreachable = CAREER_ENDINGS.filter(e => ['stat', 'past', 'near', 'fun'].includes(e.kind)).filter(e => !eligible(e, hist(stateFor(e)))).map(e => e.key);
    expect(unreachable).toEqual([]);
  });

  it('아무것도 안 하면 새내기 (또는 백수) — 꿈 엔딩이 나오지 않는다', () => {
    const v = judgeCareer(fresh());
    expect(['none', 'neet', 'civil']).toContain(v.ending.key);
  });

  it('정한 꿈을 이루면 꿈, 크게 넘으면 대성공 — 다른 길보다 먼저', () => {
    const st = fresh(); st.goal = 'med';
    const req = BALANCE.careers.med;
    st.stat.int = req.int!; st.skill.science = req.science!; st.skill.medicine = req.medicine!;
    st.placeVisits.hospital = 6; st.stat.sense = 70;   // 간호사 조건도 함께 넘김
    expect(judgeCareer(st).ending.key).toBe('med');
    expect(judgeCareer(st).also.map(e => e.key)).toContain('nurse');
    st.stat.int *= 1.3; st.skill.science *= 1.3; st.skill.medicine *= 1.3;
    expect(judgeCareer(st).ending.key).toBe('med_great');
  });

  it('꿈을 아주 아깝게 놓치면 아쉬운 엔딩, 조금 멀면 열린 다른 길이 먼저', () => {
    const st = stateFor(CAREER_ENDINGS.find(e => e.key === 'med_near')!);   // 관문 94%
    expect(judgeCareer(st).ending.key).toBe('med_near');
    st.stat.int = 155;                                                       // 86% — 의학 연구원은 그대로 열려 있다
    expect(judgeCareer(st).ending.key).toBe('lab');
    expect(judgeCareer(st).also.map(e => e.key)).toContain('med_near');
  });
});
