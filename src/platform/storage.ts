/* =========================================================
   저장소 — 세이브·도감·설정이 실제로 놓이는 곳
   게임 코드는 store.get / store.set 만 쓴다 (동기). 어디에 저장되는지는 여기서만 안다.
     웹  → 브라우저 localStorage
     앱  → Capacitor Preferences (안드로이드 SharedPreferences · iOS UserDefaults)
           웹뷰 저장소는 기기 공간이 부족하면 OS 가 지울 수 있어서 앱에서는 쓰지 않는다
   시작할 때 initStorage() 로 전부 메모리에 읽어 두고, 쓸 때는 메모리 → 저장소 순으로 바로 쓴다.
   ========================================================= */
import { Capacitor } from '@capacitor/core';

/** 이 접두사로 시작하는 키만 게임 데이터로 다룬다 */
export const PREFIX = 'ehwa';

interface Backend {
  name: 'local' | 'app' | 'memory';
  readAll(): Promise<Record<string, string>>;
  /** 동기로 실패를 알 수 있으면 false (웹 저장 공간 초과 등) */
  write(key: string, value: string): boolean;
  remove(key: string): void;
}

const memory: Backend = { name: 'memory', readAll: async () => ({}), write: () => true, remove: () => {} };

const local: Backend = {
  name: 'local',
  async readAll() {
    const out: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX)) out[k] = localStorage.getItem(k) ?? '';
    }
    return out;
  },
  write(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  remove(key) { try { localStorage.removeItem(key); } catch { /* 무시 */ } },
};

function hasLocal() {
  try { return typeof localStorage !== 'undefined' && !!localStorage; } catch { return false; }
}

async function appBackend(): Promise<Backend> {
  const { Preferences } = await import('@capacitor/preferences');
  const fail = (e: unknown) => { console.warn('[storage] 저장 실패', e); onError?.(); };
  return {
    name: 'app',
    async readAll() {
      const { keys } = await Preferences.keys();
      const out: Record<string, string> = {};
      await Promise.all(keys.filter(k => k.startsWith(PREFIX)).map(async k => { out[k] = (await Preferences.get({ key: k })).value ?? ''; }));
      return out;
    },
    write(key, value) { Preferences.set({ key, value }).catch(fail); return true; },
    remove(key) { Preferences.remove({ key }).catch(fail); },
  };
}

let backend: Backend = hasLocal() ? local : memory;
const cache = new Map<string, string>();
let onError: (() => void) | null = null;

/** 앱 시작 때 한 번 (화면을 그리기 전에) */
export async function initStorage() {
  if (Capacitor.isNativePlatform()) {
    backend = await appBackend();
    const saved = await backend.readAll();
    // 예전 버전 앱(웹뷰 localStorage 에 저장하던 때)의 기록을 한 번 옮겨 온다
    if (hasLocal()) {
      const old = await local.readAll();
      for (const [k, v] of Object.entries(old)) if (!(k in saved)) { saved[k] = v; backend.write(k, v); }
    }
    for (const [k, v] of Object.entries(saved)) cache.set(k, v);
  } else {
    for (const [k, v] of Object.entries(await backend.readAll())) cache.set(k, v);
  }
}

export const store = {
  get backend() { return backend.name; },
  get(key: string): string | null { return cache.get(key) ?? null; },
  getJSON<T>(key: string): T | null {
    const v = cache.get(key);
    if (!v) return null;
    try { return JSON.parse(v) as T; } catch { return null; }
  },
  set(key: string, value: string): boolean {
    if (!backend.write(key, value)) return false;
    cache.set(key, value);
    return true;
  },
  setJSON(key: string, value: unknown) { return store.set(key, JSON.stringify(value)); },
  remove(key: string) { cache.delete(key); backend.remove(key); },
  keys() { return [...cache.keys()]; },
  /** 앱 저장소에 쓰다 실패했을 때 (공간 부족 등) */
  onError(fn: () => void) { onError = fn; },
};
