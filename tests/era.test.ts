/* 전생 시대 팩 검증 — 새 시대 팩(src/content/eras/{id})을 만들면 여기서 빠진 것을 알려 준다 */
import { describe, expect, it } from 'vitest';
import { ERAS } from '@/content/eras';
import { GAME } from '@/config/game';
import { BASE_BACKGROUNDS } from '@/content/backgrounds';
import { CHAR_ORDER } from '@/content/characters';
import { CAREER_ORDER } from '@/content/careers';
import { dreamsOf, loadScenes } from '@/engine/story/library';
import type { StoryNode } from '@/engine/types';

/** 시대가 바뀌어도 엔진·메신저가 부르는 장면 */
const ERA_SCENES = ['prologue', 'prologue.hand'];
const reference = dreamsOf(loadScenes(GAME.era).scenes).map(d => d.id).sort();

function bgs(nodes: StoryNode[], out: string[] = []) {
  for (const n of nodes) {
    if (n.t === 'cmd' && n.name === 'bg') out.push(n.args[0]);
    if (n.t === 'if') n.branches.forEach(b => bgs(b.body, out));
    if (n.t === 'choice') n.options.forEach(o => bgs(o.body, out));
  }
  return out;
}

describe.each(Object.values(ERAS))('전생 시대 팩 $id', era => {
  const book = loadScenes(era.id);

  it('이야기 파일에 문법 오류가 없다', () => expect(book.errors).toEqual([]));

  it('프롤로그 장면과 기본 시대와 같은 꿈 id 를 모두 갖는다 (메신저·도감이 id 로 부른다)', () => {
    expect(ERA_SCENES.filter(id => !book.scenes[id])).toEqual([]);
    expect(dreamsOf(book.scenes).map(d => d.id).sort()).toEqual(reference);
  });

  it('모든 인물·진로의 전생 설정이 채워져 있다', () => {
    const empty = [
      ...CHAR_ORDER.filter(c => !era.chars[c]?.past || !era.chars[c]?.pastRole || !era.chars[c]?.pastDesc),
      ...CAREER_ORDER.filter(c => !era.careers[c]?.past || !era.careers[c]?.item || !era.careers[c]?.pastDream),
    ];
    expect(empty).toEqual([]);
  });

  it('전생과 이어진 커리어 엔딩마다 장면이 있다', () => {
    expect(era.careerEndings.filter(e => book.scenes[`career.${e.key}`]?.attrs.ending !== e.id).map(e => e.key)).toEqual([]);
    expect(era.careerEndings.every(e => e.kind === 'past')).toBe(true);
  });

  it('장면이 쓰는 배경이 공용 또는 이 시대 팩에 있다', () => {
    const known = { ...BASE_BACKGROUNDS, ...era.backgrounds };
    const missing = Object.values(book.scenes).flatMap(s => bgs(s.nodes).filter(b => !known[b]).map(b => `${s.id}: ${b}`));
    expect(missing).toEqual([]);
  });
});
