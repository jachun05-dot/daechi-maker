/* =========================================================
   도트 스프라이트 — 시트(칸 80×128 가로 이어 붙임)를 프레임 순서대로 넘긴다
   - 그림이 없는 동작은 content/dot.ts 의 fallback 동작 + 코드 효과(폴짝·끄덕·털썩)로 대신
   - 흐려지지 않게: 화면 점 기준 정수 배율로만 키운다 (height 는 원하는 대략의 키)
   ========================================================= */
import { useEffect, useMemo, useState } from 'react';
import { DOT_ANIMS, DOT_CELL, type DotAnim } from '@/content/dot';
import { dotImage } from '@/engine/assets';

const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const sheetFrames: Record<string, number> = {};

/** 그림이 있는 동작을 찾는다 — 없으면 대신할 동작 (효과는 처음 고른 동작 것) */
export function resolveDot(char: string, anim: DotAnim): { anim: DotAnim; url: string; substitute: boolean } | null {
  const seen = new Set<DotAnim>();
  const walk = (a: DotAnim, sub: boolean): ReturnType<typeof resolveDot> => {
    if (seen.has(a)) return null;
    seen.add(a);
    const url = dotImage(char, a);
    if (url) return { anim: a, url, substitute: sub };
    for (const f of DOT_ANIMS[a].fallback) { const r = walk(f, true); if (r) return r; }
    return null;
  };
  return walk(anim, false);
}

interface Props {
  char?: string;
  anim: DotAnim;
  /** 원하는 대략의 키 (CSS px) — 정수 배율로 맞춘다 */
  height: number;
  className?: string;
}

export function DotSprite({ char = 'heroine', anim, height, className }: Props) {
  const r = useMemo(() => resolveDot(char, anim), [char, anim]);
  const want = DOT_ANIMS[anim];
  // 대신 쓰는 그림이면 서 있는 한 장 + 효과로 흉내 낸다 (효과가 없는 동작만 대신 그림을 그대로 움직인다 — 운동 → 제자리 걷기)
  const play = r ? DOT_ANIMS[r.anim] : want;
  const still = !!r?.substitute && !!want.effect;
  const [frames, setFrames] = useState(() => (r ? sheetFrames[r.url] ?? 1 : 1));
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!r) return;
    if (sheetFrames[r.url]) { setFrames(sheetFrames[r.url]); return; }
    const img = new Image();
    img.onload = () => { sheetFrames[r.url] = Math.max(1, Math.round(img.naturalWidth / DOT_CELL.w)); setFrames(sheetFrames[r.url]); };
    img.src = r.url;
  }, [r]);

  const order = play.order ?? Array.from({ length: frames }, (_, k) => k);
  useEffect(() => {
    setI(0);
    if (!r || still || reduced() || order.length < 2) return;
    let k = 0;
    const t = setInterval(() => {
      k++;
      if (!want.loop && k >= order.length) { clearInterval(t); return; }
      setI(k % order.length);
    }, 1000 / play.fps);
    return () => clearInterval(t);
  }, [r, still, frames, anim]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return null;
  // 화면 점(device pixel) 기준 정수 배율
  const dpr = typeof window !== 'undefined' ? Math.max(1, window.devicePixelRatio || 1) : 1;
  const s = Math.max(1, Math.round((height * dpr) / DOT_CELL.h)) / dpr;
  const frame = still ? (DOT_ANIMS[r.anim].order?.[0] ?? 0) : order[Math.min(i, order.length - 1)] ?? 0;
  const fx = r.substitute && !reduced() ? want.effect : undefined;
  return (
    <div
      className={`dot${fx ? ` dot-${fx}` : ''}${className ? ` ${className}` : ''}`}
      key={anim}
      aria-hidden
      style={{
        width: DOT_CELL.w * s, height: DOT_CELL.h * s,
        backgroundImage: `url("${r.url}")`,
        backgroundSize: `${frames * DOT_CELL.w * s}px ${DOT_CELL.h * s}px`,
        backgroundPosition: `${-frame * DOT_CELL.w * s}px 0`,
      }}
    />
  );
}
