/* 콘텐츠 검증 — 스토리·스케줄을 수정한 뒤 `npm test` 로 오타를 잡으세요 */
import { describe, expect, it } from 'vitest';
import { SCENES, STORY_ERRORS, DREAMS } from '@/engine/story/library';
import { checkCond } from '@/engine/story/context';
import type { StoryNode } from '@/engine/types';
import { BACKGROUNDS } from '@/content/backgrounds';
import { CHAR_ORDER } from '@/content/characters';
import { SLOTS } from '@/content/schedule';
import { ENDINGS } from '@/content/endings';
import { ROUTE_ORDER } from '@/content/routes';

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
    const need = ['prologue', 'wakeup', 'opening.1', 'opening.2', 'opening.3', 'self1', 'self2', 'self3',
      'event.exam', 'event.sports', 'event.festival', 'event.counsel', 'event.suneung', 'event.summer', 'event.winter', 'event.graduation',
      'event.sick', 'event.slump', 'event.sihyun_rescue', 'saya.leave', 'saya.leave.hidden',
      ...ROUTE_ORDER.map(r => `career.${r}`), 'career.none', 'solo',
      ...CHAR_ORDER.filter(c => c !== 'saya').flatMap(c => [`true.${c}`, `normal.${c}`]),
      ...CHAR_ORDER.flatMap(c => [`enc.${c}.1`, `enc.${c}.small`]),
      'saya.dead', 'saya.dead.stranger', 'saya.alive', 'saya.letter', 'saya.alive.after'];
    expect(need.filter(id => !SCENES[id])).toEqual([]);
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

describe('스케줄', () => {
  it('배경·인물·id가 올바르다', () => {
    const problems: string[] = [];
    const seen = new Set<string>();
    for (const s of SLOTS) for (const o of s.options) {
      if (seen.has(o.id)) problems.push(`중복 id ${o.id}`);
      seen.add(o.id);
      if (!BACKGROUNDS[o.bg]) problems.push(`${o.id}: 배경 ${o.bg} 없음`);
      if (o.who && !(CHAR_ORDER as string[]).includes(o.who)) problems.push(`${o.id}: 인물 ${o.who} 없음`);
      if (!o.logs.length) problems.push(`${o.id}: logs 비어 있음`);
    }
    expect(problems).toEqual([]);
  });
});
