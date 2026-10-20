/* =========================================================
   세이브에 들어가는 콘텐츠 id 모음 — 출시 뒤 지우거나 바꾸면 안 되는 이름들
   tests/fixtures/save-ids.json 에 출시 때의 목록을 남겨 두고 (npm run save-ids),
   테스트가 지금 콘텐츠와 비교한다 → content/renames.ts
   ========================================================= */
import type { IdMap } from '@/content/renames';
import { PLACES } from '@/content/places';
import { AFTER_SCHOOL, CLUBS, NIGHT } from '@/content/timetable';
import { SCENES } from '../story/library';
import { PHOTOS } from '../phone';

export type SaveIds = Record<keyof IdMap, string[]>;

export function collectSaveIds(): SaveIds {
  const scenes = Object.keys(SCENES).filter(id =>
    // 전생 꿈 · 톡 · 먼저 연락하기 답장 · 앨범에 남는 장면
    SCENES[id].file.startsWith('dreams/') || /^(chat|call|main|vac|weather)\./.test(id));
  return {
    scenes: scenes.sort(),
    places: PLACES.map(p => p.id).sort(),
    options: [...AFTER_SCHOOL, ...NIGHT, ...CLUBS].map(o => o.id).sort(),
    photos: PHOTOS.map(p => p.id).sort(),
  };
}
