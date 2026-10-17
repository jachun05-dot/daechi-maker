/* =========================================================
   세이브 — 자동 저장 · 슬롯 3개 · 회차 기록(도감·엔딩·앨범) · 설정 · 백업
   실제 저장 위치는 platform/storage.ts 가 정한다 (웹: 브라우저, 앱: 앱 전용 저장소)
   불러온 세이브는 반드시 migrate() 를 거친다 → ./migrate.ts
   ========================================================= */
import type { GameState, MetaState, Settings } from '../types';
import { PREFIX, store } from '@/platform/storage';
import { defaultMeta, defaultSettings, game } from '../state';
import { migrateMeta } from './migrate';

export { migrate, sanitize, SAVE_VERSION } from './migrate';

export const KEY = { auto: 'ehwa3_auto', slot: (i: number) => `ehwa3_slot${i}`, meta: 'ehwa3_meta', settings: 'ehwa3_settings' };
export const SLOTS = [1, 2, 3];


/** 저장소에서 회차 기록·설정을 읽어 game 에 올린다 (시작할 때, 백업을 들여온 뒤) */
export function loadPersisted() {
  game.meta = migrateMeta({ ...defaultMeta(), ...(store.getJSON<MetaState>(KEY.meta) ?? {}) });
  game.settings = { ...defaultSettings(), ...(store.getJSON<Settings>(KEY.settings) ?? {}) };
}

export const saves = {
  autosave() { if (game.state && !game.midMonth) { game.state.savedAt = Date.now(); store.setJSON(KEY.auto, game.state); } },
  clearAuto() { store.remove(KEY.auto); },
  readAuto: () => store.getJSON<GameState>(KEY.auto),
  readSlot: (i: number) => store.getJSON<GameState>(KEY.slot(i)),
  writeSlot(i: number) { if (!game.state || game.midMonth) return false; game.state.savedAt = Date.now(); return store.setJSON(KEY.slot(i), game.state); },
  saveMeta() { store.setJSON(KEY.meta, game.meta); },
  saveSettings() { store.setJSON(KEY.settings, game.settings); },
  wipeAll() {
    [KEY.auto, ...SLOTS.map(KEY.slot), KEY.meta].forEach(k => store.remove(k));
    game.meta = defaultMeta();
    game.state = null;
  },
};

/* ---------- 백업 코드 ----------
   모든 세이브·도감·설정을 글자 한 줄로. 기기를 바꾸거나 앱을 지웠다 깔 때 옮기는 용도.
   형식: EHWA1z.<gzip+base64> (압축 가능한 환경) 또는 EHWA1.<base64>            */
interface Backup { app: 'ehwa'; v: 1; at: number; data: Record<string, string> }

const b64 = (bytes: Uint8Array) => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = (s: string) => Uint8Array.from(atob(s), c => c.charCodeAt(0));
async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await out.arrayBuffer());
}

export async function exportBackup(): Promise<string> {
  const data: Record<string, string> = {};
  for (const k of store.keys()) if (k.startsWith(PREFIX)) data[k] = store.get(k) ?? '';
  const bytes = new TextEncoder().encode(JSON.stringify({ app: 'ehwa', v: 1, at: Date.now(), data } satisfies Backup));
  if (typeof CompressionStream !== 'undefined') return `EHWA1z.${b64(await pipe(bytes, new CompressionStream('gzip')))}`;
  return `EHWA1.${b64(bytes)}`;
}

/** 백업 코드를 들여온다. 지금 기기의 기록은 백업 내용으로 바뀐다 (백업에 없는 슬롯은 그대로) */
export async function importBackup(code: string): Promise<{ ok: true; at: number; count: number } | { ok: false; error: string }> {
  try {
    const m = code.trim().replace(/\s+/g, '').match(/^EHWA1(z?)\.(.+)$/);
    if (!m) return { ok: false, error: '백업 코드 형식이 아니에요' };
    let bytes = unb64(m[2]);
    if (m[1]) {
      if (typeof DecompressionStream === 'undefined') return { ok: false, error: '이 기기에서는 압축된 백업을 열 수 없어요' };
      bytes = await pipe(bytes, new DecompressionStream('gzip'));
    }
    const b = JSON.parse(new TextDecoder().decode(bytes)) as Backup;
    if (b.app !== 'ehwa' || typeof b.data !== 'object') return { ok: false, error: '이 게임의 백업이 아니에요' };
    const entries = Object.entries(b.data).filter(([k, v]) => k.startsWith(PREFIX) && typeof v === 'string');
    for (const [k, v] of entries) if (!store.set(k, v)) return { ok: false, error: '저장 공간이 부족해요' };
    loadPersisted();
    return { ok: true, at: b.at, count: entries.length };
  } catch {
    return { ok: false, error: '백업 코드가 손상됐어요 (끝까지 복사됐는지 확인해 주세요)' };
  }
}
