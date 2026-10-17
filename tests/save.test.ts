/* 세이브 호환 — 이야기·설계를 고쳐도 예전 세이브가 깨지지 않는지 */
import { afterEach, describe, expect, it } from 'vitest';
import v3 from './fixtures/save-v3.json';
import releasedIds from './fixtures/save-ids.json';
import { migrate, SAVE_VERSION, exportBackup, importBackup } from '@/engine/save';
import { collectSaveIds, type SaveIds } from '@/engine/save/ids';
import { RENAMES, RETIRED } from '@/content/renames';
import { DREAMS } from '@/engine/story/library';
import { PLACES } from '@/content/places';
import { store } from '@/platform/storage';

const clone = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe('세이브 불러오기', () => {
  it('예전(v3) 세이브가 지금 버전으로 바뀌고 내용은 그대로다', () => {
    const { state, notes } = migrate(v3);
    expect(notes).toEqual([]);
    expect(state.version).toBe(SAVE_VERSION);
    expect(state.era).toBe('joseon');
    expect(state.turn).toBe(v3.turn);
    expect(state.aff).toEqual(v3.aff);
    expect(state.memories).toEqual(v3.memories);
    for (const p of Object.values(state.pending)) expect(Array.isArray(p.picked)).toBe(true);
  });

  it('두 번 거쳐도 같다', () => {
    const once = migrate(v3).state;
    expect(migrate(once).state).toEqual(once);
  });

  it('원본은 건드리지 않는다', () => {
    const raw = clone(v3);
    migrate(raw);
    expect(raw).toEqual(v3);
  });

  it('지금 콘텐츠에 없는 것은 정리한다', () => {
    const raw = clone(v3) as Record<string, any>;
    raw.memories.no_such_dream = true;
    raw.pending.ian = { id: 'chat.ian.no_such_chat', arrived: 0, time: '월 23:00', opened: false, path: [0] };
    raw.chatQueue.push({ id: 'chat.mujin.gone', due: 1 });
    raw.placeVisits.atlantis = 3;
    raw.promiseNext = [{ c: 'ian', place: 'atlantis', slot: 0 }];
    raw.timetable = ['no_such_option', ...Array(9).fill(null)];
    raw.club = 'no_such_club';
    raw.mainStep.ian = 99;
    raw.goal = 'astronaut';
    raw.aff.zed = 50;
    raw.turn = 999;
    const { state, notes } = migrate(raw);
    expect(state.memories.no_such_dream).toBeUndefined();
    expect(state.pending.ian).toBeUndefined();
    expect(state.chatQueue.some(q => q.id === 'chat.mujin.gone')).toBe(false);
    expect(state.placeVisits.atlantis).toBeUndefined();
    expect(state.promiseNext).toEqual([]);
    expect(state.timetable[0]).toBeNull();
    expect(state.club).toBeNull();
    expect(state.mainStep.ian).toBeLessThan(99);
    expect(state.goal).toBeNull();
    expect('zed' in state.aff).toBe(false);
    expect(state.turn).toBeLessThan(999);
    expect(notes.length).toBeGreaterThan(0);
  });

  it('빠진 필드·엉뚱한 값은 새 게임 기본값으로 채운다', () => {
    for (const junk of [null, 'hello', 42, {}, { name: 7, aff: 'x', chats: [] }]) {
      const { state } = migrate(junk);
      expect(state.version).toBe(SAVE_VERSION);
      expect(typeof state.aff.ian).toBe('number');
      expect(Array.isArray(state.timetable)).toBe(true);
      expect(typeof state.chats).toBe('object');
    }
  });
});

describe('id 를 바꿨을 때 (content/renames.ts)', () => {
  afterEach(() => { RENAMES.scenes = {}; RENAMES.places = {}; });

  it('세이브가 새 id 를 따라간다', () => {
    const dream = DREAMS[0].id, place = PLACES[0].id;
    RENAMES.scenes = { old_dream: dream };
    RENAMES.places = { old_place: place };
    const raw = clone(v3) as Record<string, any>;
    raw.memories = { old_dream: true };
    raw.placeVisits = { old_place: 2 };
    const { state, notes } = migrate(raw);
    expect(state.memories).toEqual({ [dream]: true });
    expect(state.placeVisits[place]).toBe(2);
    expect(notes).toEqual([]);
  });

  it('출시된 id 가 말없이 사라지지 않았다 (지웠으면 RETIRED, 바꿨으면 RENAMES 에)', () => {
    const now = collectSaveIds();
    const missing: string[] = [];
    for (const kind of Object.keys(releasedIds) as (keyof SaveIds)[]) {
      const have = new Set(now[kind]);
      for (const id of (releasedIds as SaveIds)[kind]) {
        const to = RENAMES[kind][id];
        if (have.has(id) || RETIRED[kind].includes(id) || (to && have.has(to))) continue;
        missing.push(`${kind}: ${id}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

describe('백업 코드', () => {
  it('만들고 들여오면 그대로 돌아온다', async () => {
    store.set('ehwa3_slot2', JSON.stringify({ name: '백업 테스트', turn: 5 }));
    const code = await exportBackup();
    expect(code.startsWith('EHWA1')).toBe(true);
    store.remove('ehwa3_slot2');
    const r = await importBackup(code);
    expect(r.ok).toBe(true);
    expect(store.getJSON<{ name: string }>('ehwa3_slot2')?.name).toBe('백업 테스트');
  });

  it('망가진 코드는 거절한다', async () => {
    expect((await importBackup('아무 글')).ok).toBe(false);
    expect((await importBackup('EHWA1z.abc')).ok).toBe(false);
  });
});
