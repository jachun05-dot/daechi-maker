/* 콘텐츠 검증 — 스토리·스케줄을 수정한 뒤 `npm test` 로 오타를 잡으세요 */
import { describe, expect, it } from 'vitest';
import { SCENES, STORY_ERRORS, DREAMS } from '@/engine/story/library';
import { checkCond } from '@/engine/story/context';
import type { StoryNode } from '@/engine/types';
import { BACKGROUNDS } from '@/content/backgrounds';
import { CHAR_ORDER } from '@/content/characters';
import { AFTER_SCHOOL, NIGHT, CLUBS } from '@/content/timetable';
import { PLACES } from '@/content/places';
import { WEEKEND_PLACES } from '@/content/presence';
import { LECTURES } from '@/content/vacation';
import { ENDINGS } from '@/content/endings';
import { CAREER_ORDER } from '@/content/careers';
import { ROMANCEABLE } from '@/content/characters';
import { MAIN_EVENTS } from '@/engine/story/library';

const FX = ['none', 'petal', 'sakura', 'leaf', 'snow', 'rain', 'ember'];
const CMDS = ['bg', 'fx', 'stand', 'cg', 'shake', 'flash', 'card'];

function walk(nodes: StoryNode[], fn: (n: StoryNode) => void) {
  for (const n of nodes) {
    fn(n);
    if (n.t === 'if') n.branches.forEach(b => walk(b.body, fn));
    if (n.t === 'choice') n.options.forEach(o => walk(o.body, fn));
  }
}

describe('스토리 파일', () => {
  it('문법 오류가 없다', () => expect(STORY_ERRORS).toEqual([]));

  it('명령·배경·조건·호출 대상이 모두 올바르다', () => {
    const problems: string[] = [];
    for (const s of Object.values(SCENES)) {
      walk(s.nodes, n => {
        const at = `${s.file}:${n.line}`;
        if (n.t === 'cmd') {
          if (!CMDS.includes(n.name)) problems.push(`${at} 알 수 없는 명령 [${n.name}]`);
          if (n.name === 'bg' && !BACKGROUNDS[n.args[0]]) problems.push(`${at} 배경 "${n.args[0]}"이 backgrounds.ts에 없음`);
          if (n.name === 'fx' && !FX.includes(n.args[0])) problems.push(`${at} 효과 "${n.args[0]}" 없음 (${FX.join('/')})`);
          if (n.name === 'stand' && n.args[0] !== 'off' && !(CHAR_ORDER as string[]).includes(n.args[0])) problems.push(`${at} 인물 "${n.args[0]}" 없음`);
        }
        if (n.t === 'call' && !SCENES[n.id]) problems.push(`${at} [call ${n.id}] 장면 없음`);
        if (n.t === 'if') n.branches.forEach(b => { const e = b.cond && checkCond(b.cond); if (e) problems.push(`${at} ${e}`); });
        if (n.t === 'choice') n.options.forEach(o => { const e = o.cond && checkCond(o.cond); if (e) problems.push(`${at} ${e}`); });
      });
    }
    expect(problems).toEqual([]);
  });

  it('엔진이 찾는 장면이 모두 있다', () => {
    const need = ['prologue', 'wakeup', 'prologue.hand', 'opening.1', 'opening.2', 'opening.3', 'self1', 'self2', 'self3',
      'event.exam', 'event.sports', 'event.festival', 'event.counsel.hint', 'event.counsel.decide', 'event.suneung', 'event.graduation',
      'event.slump', 'event.sihyun_rescue', 'vacation.start', 'vacation.lecture', 'vacation.decline', 'final.choice',
      ...CAREER_ORDER.map(r => `career.${r}`), 'career.none',
      ...ROMANCEABLE.flatMap(c => [`true.${c}`, `normal.${c}`, `reject.${c}`]),
      'reject.ihyun', 'ihyun.end', 'ihyun.hidden', 'hidden.taejun',
      ...CHAR_ORDER.flatMap(c => [`basic.${c}`, `main.${c}.1`, 'summer1', 'summer2', 'summer3', 'winter1', 'winter2'].map((x, i) => (i < 2 ? x : `vac.${c}.${x}`)))];
    expect(need.filter(id => !SCENES[id])).toEqual([]);
  });

  it('메인 이벤트는 인물별로 1부터 빠짐없이 이어지고 장소가 올바르다', () => {
    const problems: string[] = [];
    for (const c of CHAR_ORDER) {
      const list = MAIN_EVENTS.filter(e => e.ch === c);
      list.forEach((e, i) => { if (e.step !== i + 1) problems.push(`${e.id}: 번호가 ${i + 1}이어야 함`); });
      list.forEach(e => {
        if (!e.auto && !e.place) problems.push(`${e.id}: place= 또는 auto=1 이 필요`);
        if (e.place && !PLACES.some(p => p.id === e.place)) problems.push(`${e.id}: 장소 ${e.place} 없음`);
      });
    }
    expect(problems).toEqual([]);
  });

  it('엔딩 장면의 ending id가 endings.ts에 있다', () => {
    const ids = ENDINGS.map(e => e.id);
    const bad = Object.values(SCENES).filter(s => s.attrs.ending && !ids.includes(s.attrs.ending)).map(s => `${s.id} → ${s.attrs.ending}`);
    expect(bad).toEqual([]);
  });

  it('전생 꿈의 requires 대상이 있다', () => {
    const ids = DREAMS.map(d => d.id);
    expect(DREAMS.flatMap(d => d.requires.filter(r => !ids.includes(r)))).toEqual([]);
  });
});

describe('시간표 · 지도 · 방학', () => {
  it('id와 배경·인물·장소가 올바르다', () => {
    const problems: string[] = [];
    for (const group of [[...AFTER_SCHOOL, ...NIGHT], CLUBS, PLACES, LECTURES]) {
      const ids = new Set<string>();
      for (const o of group) { if (ids.has(o.id)) problems.push(`중복 id ${o.id}`); ids.add(o.id); }
    }
    for (const o of [...AFTER_SCHOOL, ...NIGHT]) {
      if (!o.days.length) problems.push(`${o.id}: days 비어 있음`);
      if (o.who && !(CHAR_ORDER as string[]).includes(o.who)) problems.push(`${o.id}: 인물 ${o.who} 없음`);
    }
    for (const p of PLACES) {
      if (!BACKGROUNDS[p.bg]) problems.push(`${p.id}: 배경 ${p.bg} 없음`);
      if (!p.actions.length) problems.push(`${p.id}: actions 비어 있음`);
    }
    for (const c of CHAR_ORDER) for (const y of [1, 2, 3] as const)
      for (const pl of WEEKEND_PLACES[c][y]) if (!PLACES.some(p => p.id === pl)) problems.push(`${c} ${y}학년: 장소 ${pl} 없음`);
    // 요일마다 고를 수 있는 일정이 최소 하나는 있어야 한다
    for (let d = 0; d < 5; d++) for (const list of [AFTER_SCHOOL, NIGHT]) if (!list.some(o => o.days.includes(d))) problems.push(`${d}요일에 고를 일정 없음`);
    expect(problems).toEqual([]);
  });
});
