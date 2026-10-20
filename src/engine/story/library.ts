/* =========================================================
   장면 사전 — .story 파일을 읽어 id → 장면으로 만든다
   두 겹으로 읽는다:
     1) 공용   src/content/stories/**            (현생 · 대치동)
     2) 시대   src/content/eras/{시대}/stories/** (전생 · 프롤로그 · 꿈)
   시대 쪽에 공용과 같은 id 의 장면이 있으면 시대 쪽이 이긴다 (시대별로 대사만 바꿔 끼우기).
   같은 겹 안에서 id 가 겹치면 오류.
   ========================================================= */
import type { Scene } from '../types';
import { parseStory, StoryError } from './parser';
import { ERA } from '@/content/eras';

const BASE_FILES = import.meta.glob('/src/content/stories/**/*.story', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;
const ERA_FILES = import.meta.glob('/src/content/eras/*/stories/**/*.story', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export interface SceneBook { scenes: Record<string, Scene>; errors: string[] }

const where = (s: Scene) => (s.pack && s.pack !== 'base' ? `eras/${s.pack}/stories/${s.file}` : `stories/${s.file}`);

/** 공용 + 해당 시대 팩의 장면을 읽는다 (테스트는 모든 시대를 하나씩 검사한다) */
export function loadScenes(eraId: string): SceneBook {
  const scenes: Record<string, Scene> = {};
  const errors: string[] = [];
  const layer = (files: Record<string, string>, root: string, pack: string) => {
    const mine = new Set<string>();
    for (const [path, text] of Object.entries(files)) {
      if (!path.startsWith(root)) continue;
      const file = path.slice(root.length);
      try {
        for (const s of parseStory(text, file)) {
          s.pack = pack;
          if (mine.has(s.id)) errors.push(`${where(s)} — 장면 id "${s.id}"가 ${where(scenes[s.id])}에도 있습니다`);
          mine.add(s.id);
          scenes[s.id] = s;
        }
      } catch (e) {
        const msg = e instanceof StoryError ? e.message : String(e);
        errors.push(pack === 'base' ? msg : `[${pack}] ${msg}`);
      }
    }
  };
  layer(BASE_FILES, '/src/content/stories/', 'base');
  layer(ERA_FILES, `/src/content/eras/${eraId}/stories/`, eraId);
  return { scenes, errors };
}

const BOOK = loadScenes(ERA.id);
export const SCENES: Record<string, Scene> = BOOK.scenes;
export const STORY_ERRORS: string[] = BOOK.errors;

export function getScene(id: string): Scene {
  const s = SCENES[id];
  if (!s) throw new Error(`장면 "${id}"을(를) 찾을 수 없습니다`);
  return s;
}
export const hasScene = (id: string) => id in SCENES;

/** 접두사로 장면 목록 (id 순서가 아닌 파일 내 순서 유지) */
export const scenesWithPrefix = (prefix: string) => Object.values(SCENES).filter(s => s.id.startsWith(prefix));

/** 전생 꿈 목록 — 시대 팩 dreams/*.story 의 머리말 속성으로 정의 */
export interface Dream { id: string; ch: string; ep: number; title: string; aff: number; spirit: number; auto: boolean; hidden: boolean; requires: string[] }
export const dreamsOf = (scenes: Record<string, Scene>): Dream[] => Object.values(scenes)
  .filter(s => s.file.startsWith('dreams/'))
  .map(s => ({
    id: s.id,
    ch: s.attrs.ch ?? s.file.replace('dreams/', '').replace('.story', ''),
    ep: Number(s.attrs.ep ?? 1),
    title: s.attrs.title ?? s.id,
    aff: Number(s.attrs.aff ?? 0),
    spirit: Number(s.attrs.spirit ?? 0),
    auto: s.attrs.auto === '1',
    hidden: s.attrs.hidden === '1',
    requires: s.attrs.requires ? s.attrs.requires.split(',') : [],
  }));
export const DREAMS: Dream[] = dreamsOf(SCENES);

/** 인물 메인 이벤트 — main/*.story 의 `=== main.{인물}.{번호}` 장면
 *  속성: aff(최소 호감도) year(최소 학년) spirit(최소 감응) place(지도 장소 id) auto=1(자동 발생) */
export interface MainEvent { id: string; ch: string; step: number; aff: number; year: number; spirit: number; place: string | null; auto: boolean }
export const MAIN_EVENTS: MainEvent[] = Object.values(SCENES)
  .filter(s => /^main\.\w+\.\d+$/.test(s.id))
  .map(s => {
    const [, ch, n] = s.id.split('.');
    return { id: s.id, ch, step: Number(n), aff: Number(s.attrs.aff ?? 0), year: Number(s.attrs.year ?? 1), spirit: Number(s.attrs.spirit ?? 0), place: s.attrs.place ?? null, auto: s.attrs.auto === '1' };
  })
  .sort((a, b) => (a.ch === b.ch ? a.step - b.step : a.ch.localeCompare(b.ch)));
export const mainEventsOf = (ch: string) => MAIN_EVENTS.filter(e => e.ch === ch);
