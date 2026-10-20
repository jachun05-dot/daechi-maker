/* 스토리 문법·재생기 동작 테스트 */
import { describe, expect, it } from 'vitest';
import { parseStory } from '@/engine/story/parser';
import { ScenePlayer } from '@/engine/story/player';
import { evalCond, fill, type StoryCtx } from '@/engine/story/context';
import { newState } from '@/engine/state';
import type { Effect } from '@/engine/types';

const ctx = (): StoryCtx => { const state = newState('서단비'); state.goal = 'med'; return { state, name: state.name, vars: { tier: 'top' } }; };

describe('parser', () => {
  const [scene] = parseStory(`=== test min=3 title="두 단어"
[bg library]
나레이션
ian(smile)| 안녕
* 첫째 {ian+3 spirit+1 vocal+2 special}
  me| 좋아요
  [if aff.ian>=3]
    호감 3 이상
  [else]
    호감 부족
* 둘째 {value:b if:met.ian}
  둘째 선택
\\* 별표로 시작하는 나레이션
`, 'test.story');

  it('머리말 속성', () => expect(scene.attrs).toEqual({ min: '3', title: '두 단어' }));
  it('대사·표정·선택지 구조', () => {
    expect(scene.nodes[2]).toMatchObject({ t: 'say', who: 'ian', expr: 'smile', text: '안녕' });
    const c = scene.nodes[3];
    expect(c.t).toBe('choice');
    if (c.t !== 'choice') return;
    expect(c.options[0].eff).toEqual({ aff: { ian: 3 }, stat: { spirit: 1 }, skill: { vocal: 2 } });
    expect(c.options[0].special).toBe(true);
    expect(c.options[1]).toMatchObject({ value: 'b', cond: 'met.ian' });
    expect(scene.nodes[4]).toMatchObject({ t: 'say', text: '* 별표로 시작하는 나레이션' });
  });
  it('잘못된 효과는 줄 번호와 함께 에러', () => {
    expect(() => parseStory('=== x\n[effect foo+1]', 'bad.story')).toThrow('bad.story:2');
  });
  it('잘못된 들여쓰기는 에러', () => {
    expect(() => parseStory('=== x\n줄\n  들여쓴 줄', 'bad.story')).toThrow('bad.story:3');
  });

  it('재생: 선택지 효과 적용과 조건 분기', () => {
    const c = ctx();
    const applied: Effect[] = [];
    const p = new ScenePlayer(scene.nodes, c, {}, e => { applied.push(e); c.state!.aff.ian += e.aff?.ian ?? 0; });
    expect(p.next()).toMatchObject({ mode: 'say', text: '나레이션', bg: 'library' });
    expect(p.next()).toMatchObject({ speaker: '이안', stand: { id: 'ian', expr: 'smile' } });
    const v = p.next();
    expect(v.mode).toBe('choice');
    expect(v.choices).toHaveLength(1); // 둘째는 met.ian 조건으로 숨김
    expect(p.choose(0)).toMatchObject({ speaker: '서단비', text: '좋아요' });
    expect(p.next().text).toBe('호감 3 이상');
    expect(applied).toHaveLength(1);
  });
});

describe('context', () => {
  it('치환과 조사', () => {
    const c = ctx();
    expect(fill('{name}이(가) {goal}을(를) 꿈꾼다', c)).toBe('서단비가 한국대 의대 진학을 꿈꾼다');
    expect(fill('{var.tier}', c)).toBe('top');
    expect(fill('무대(으)로, 밴드 공연(으)로', c)).toBe('무대로, 밴드 공연으로');
  });
  it('조건식', () => {
    const c = ctx();
    expect(evalCond('goal=med && var.tier=top', c)).toBe(true);
    expect(evalCond('past=med', c)).toBe(true);
    expect(evalCond('aff.ian>=1 || int>=10', c)).toBe(true);
    expect(evalCond('year=1 && vocal<1', c)).toBe(true);
    expect(evalCond('!met.ian', c)).toBe(true);
    expect(evalCond('flag.x', c)).toBe(false);
  });
});
