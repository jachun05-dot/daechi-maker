import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { saves, game } from './engine/state';
import { useUI } from './store/ui';
import { initNative } from './native';
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

void initNative();

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
