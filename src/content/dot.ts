/* =========================================================
   도트 애니메이션 — 여주 SD 도트 (평일 판정 연출)
   그림: src/assets/images/dot/{인물}/{동작}.png — 칸 80×128 을 가로로 이어 붙인 시트 (프레임 수 = 너비 ÷ 80)
   만드는 법: docs/art/IMAGE_WORK.md ⑥ · scripts/dot_clean.py
   그림이 없는 동작은 대신할 동작 + 코드 효과(폴짝·끄덕·털썩)로 흉내 낸다 → 그림을 넣으면 코드 수정 없이 바뀐다
   ========================================================= */
import type { Cat } from './rolls';

/** 시트 한 칸 크기 (도트) */
export const DOT_CELL = { w: 80, h: 128 } as const;

export type DotAnim = 'walk' | 'idle' | Cat | 'great' | 'ok' | 'fail' | 'doze';

export interface DotAnimDef {
  /** 초당 프레임 */
  fps: number;
  /** 프레임 순서 (0부터). 없으면 0,1,2,… */
  order?: number[];
  /** 반복하나 (판정 반응은 한 번 하고 마지막 프레임에서 멈춘다) */
  loop: boolean;
  /** 그림이 없을 때 대신 쓸 동작 (차례로 찾는다) */
  fallback: DotAnim[];
  /** 대신 쓸 때 덧입히는 움직임 (CSS: dot-hop 폴짝 · dot-nod 끄덕 · dot-slump 털썩 · dot-bob 들썩 · dot-doze 꾸벅) */
  effect?: 'hop' | 'nod' | 'slump' | 'bob' | 'doze';
}

export const DOT_ANIMS: Record<DotAnim, DotAnimDef> = {
  // 걷기 — 2 → 4 → 3 → 4 (1번은 쓰지 않음, 사용자가 고른 순서)
  walk:   { fps: 7, order: [1, 3, 2, 3], loop: true, fallback: [] },
  idle:   { fps: 3, loop: true, fallback: ['walk'], effect: 'bob' },
  // 일정 분류별 — 하는 동안 반복 (src/content/rolls.ts 의 cat)
  study:  { fps: 4, loop: true, fallback: ['idle'], effect: 'bob' },
  art:    { fps: 6, loop: true, fallback: ['idle'], effect: 'bob' },
  work:   { fps: 5, loop: true, fallback: ['idle'], effect: 'bob' },
  body:   { fps: 8, loop: true, fallback: ['walk'] },   // 그림이 없으면 제자리 걷기로
  rest:   { fps: 2, loop: true, fallback: ['idle'], effect: 'doze' },
  social: { fps: 5, loop: true, fallback: ['idle'], effect: 'bob' },
  doze:   { fps: 2, loop: true, fallback: ['rest', 'idle'], effect: 'doze' },
  // 판정 반응 — 한 번
  great:  { fps: 10, loop: false, fallback: ['idle'], effect: 'hop' },
  ok:     { fps: 6, loop: false, fallback: ['idle'], effect: 'nod' },
  fail:   { fps: 7, loop: false, fallback: ['idle'], effect: 'slump' },
};
