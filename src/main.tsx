import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { saves, game } from './engine/state';
import { loadPersisted } from './engine/save';
import { initStorage, store } from './platform/storage';
import { ui, useUI } from './store/ui';
import { initNative } from './platform/native';
import './styles/tokens.css';
import './styles/app.css';
import './styles/screens.css';
import './styles/vn.css';

// 앱이 백그라운드로 갈 때 자동 저장
window.addEventListener('pagehide', () => saves.autosave());
document.addEventListener('visibilitychange', () => { if (document.hidden) saves.autosave(); });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('contextmenu', e => e.preventDefault());

// 테스트 자동화·디버깅용 핸들
Object.assign(window, { __ehwa: { game, ui: useUI } });

// 저장소(웹: 브라우저 · 앱: 앱 전용 저장소)를 먼저 읽고 화면을 그린다
async function start() {
  try { await initStorage(); } catch (e) { console.warn('[storage] 읽기 실패 — 이번 실행은 저장되지 않을 수 있어요', e); }
  loadPersisted();
  store.onError(() => useUI.getState() && ui.toast('저장하지 못했어요 — 기기 저장 공간을 확인해 주세요'));
  void initNative();
  createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
}
void start();
