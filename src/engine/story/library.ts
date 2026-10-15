/* src/content/stories/ 아래의 모든 .story 파일을 읽어 장면 사전으로 만든다 */
import type { Scene } from '../types';
import { parseStory, StoryError } from './parser';

const files = import.meta.glob('/src/content/stories/**/*.story', { eager: true, query: '?raw', import: 'default' }) as Record<string, string>;

export const SCENES: Record<string, Scene> = {};
export const STORY_ERRORS: string[] = [];

for (const [path, text] of Object.entries(files)) {
  const file = path.replace('/src/content/stories/', '');
  try {
    for (const s of parseStory(text, file)) {
      if (SCENES[s.id]) STORY_ERRORS.push(`${file} — 장면 id "${s.id}"가 ${SCENES[s.id].file}에도 있습니다`);
      SCENES[s.id] = s;
    }
  } catch (e) {
    STORY_ERRORS.push(e instanceof StoryError ? e.message : String(e));
  }
}

export function getScene(id: string): Scene {
  const s = SCENES[id];
  if (!s) throw new Error(`장면 "${id}"을(를) 찾을 수 없습니다`);
  return s;
}
export const hasScene = (id: string) => id in SCENES;

/** 접두사로 장면 목록 (id 순서가 아닌 파일 내 순서 유지) */
export const scenesWithPrefix = (prefix: string) => Object.values(SCENES).filter(s => s.id.startsWith(prefix));

/** 전생 꿈 목록 — dreams/*.story 의 머리말 속성으로 정의 */
export interface Dream { id: string; ch: string; ep: number; title: string; aff: number; spirit: number; auto: boolean; hidden: boolean; requires: string[] }
export const DREAMS: Dream[] = Object.values(SCENES)
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

/** 인물 메인 이벤트 — events/main.{인물}.story 의 `=== main.{인물}.{번호}` 장면
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
