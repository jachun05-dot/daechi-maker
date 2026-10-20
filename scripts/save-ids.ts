/* npm run save-ids — 지금 콘텐츠의 세이브 id 목록을 tests/fixtures/save-ids.json 에 기록 (새 버전을 낼 때) */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { collectSaveIds } from '@/engine/save/ids';

const ids = collectSaveIds();
writeFileSync(join(process.cwd(), 'tests/fixtures/save-ids.json'), JSON.stringify(ids, null, 1) + '\n');
console.log(Object.entries(ids).map(([k, v]) => `${k} ${v.length}`).join(' · '));
