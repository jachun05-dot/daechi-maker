/* =========================================================
   전생 시대 팩 목록 · 지금 쓰는 시대 고르기
   - 기본값: src/config/game.ts 의 GAME.era
   - 비교용: 주소 뒤에 ?era=joseon 처럼 붙이거나, 설정 화면에서 바꾼다 (팩이 둘 이상일 때)
   ========================================================= */
import { GAME } from '@/config/game';
import type { EraPack } from './types';
import { joseon } from './joseon';

export const ERAS: Record<string, EraPack> = { joseon };
export const ERA_KEY = 'ehwa_era';

function pick(): EraPack {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('era');
    if (q && ERAS[q]) { localStorage.setItem(ERA_KEY, q); return ERAS[q]; }
    const saved = localStorage.getItem(ERA_KEY);
    if (saved && ERAS[saved]) return ERAS[saved];
  } catch { /* 테스트·미리보기 환경 */ }
  return ERAS[GAME.era] ?? joseon;
}

/** 지금 게임이 쓰는 전생 시대 */
export const ERA: EraPack = pick();

/** 다음 실행부터 다른 시대로 (새로고침 필요) */
export function chooseEra(id: string) {
  try { localStorage.setItem(ERA_KEY, id); } catch { /* 무시 */ }
}
export type { EraPack } from './types';
