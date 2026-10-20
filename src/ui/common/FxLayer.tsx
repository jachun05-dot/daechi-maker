/* =========================================================
   PixiJS 파티클 레이어 — 배꽃·벚꽃·낙엽·눈·비·불티
   입자 모양·속도는 아래 PRESETS 에서 조정
   ========================================================= */
import { useEffect, useRef } from 'react';
import { Application, Container, Graphics, Sprite, Texture } from 'pixi.js';
import type { FxType } from '@/engine/types';
import { game } from '@/engine/state';

interface Preset { count: number; make: (g: Graphics) => void; vy: [number, number]; vx: [number, number]; spin: number; scale: [number, number]; rise?: boolean; additive?: boolean; alpha: [number, number]; sway: number }

const PRESETS: Record<Exclude<FxType, 'none'>, Preset> = {
  petal:  { count: 26, make: g => g.ellipse(0, 0, 6, 4).fill({ color: 0xffffff }), vy: [0.4, 1.0], vx: [-0.3, 0.5], spin: 0.03, scale: [0.6, 1.3], alpha: [0.6, 1], sway: 0.6 },
  sakura: { count: 26, make: g => g.ellipse(0, 0, 6, 4).fill({ color: 0xf6b9cc }), vy: [0.4, 1.0], vx: [-0.3, 0.5], spin: 0.03, scale: [0.6, 1.3], alpha: [0.7, 1], sway: 0.6 },
  leaf:   { count: 18, make: g => g.ellipse(0, 0, 7, 4).fill({ color: 0xd9733a }), vy: [0.5, 1.1], vx: [-0.4, 0.4], spin: 0.04, scale: [0.6, 1.2], alpha: [0.7, 1], sway: 0.9 },
  snow:   { count: 46, make: g => g.circle(0, 0, 3).fill({ color: 0xffffff }), vy: [0.3, 0.9], vx: [-0.2, 0.2], spin: 0, scale: [0.4, 1.2], alpha: [0.6, 1], sway: 0.4 },
  rain:   { count: 70, make: g => g.rect(0, 0, 1.2, 22).fill({ color: 0xc6d4ff }), vy: [9, 13], vx: [-1.6, -1.2], spin: 0, scale: [0.7, 1.1], alpha: [0.25, 0.55], sway: 0 },
  ember:  { count: 34, make: g => { g.circle(0, 0, 6).fill({ color: 0xff7a2a, alpha: 0.25 }); g.circle(0, 0, 2.2).fill({ color: 0xffc070 }); }, vy: [0.4, 1.1], vx: [-0.3, 0.3], spin: 0, scale: [0.6, 1.4], rise: true, additive: true, alpha: [0.5, 1], sway: 0.5 },
};

const r = (a: number, b: number) => a + Math.random() * (b - a);

export function FxLayer({ type, density = 1 }: { type: FxType; density?: number }) {
  const host = useRef<HTMLDivElement>(null);
  const enabled = game.settings.fx && type !== 'none' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!enabled || !host.current) return;
    const el = host.current;
    const preset = PRESETS[type as Exclude<FxType, 'none'>];
    const app = new Application();
    let alive = true, started = false;

    app.init({ backgroundAlpha: 0, resizeTo: el, antialias: true, autoDensity: true, resolution: Math.min(2, window.devicePixelRatio || 1) }).then(() => {
      started = true;
      if (!alive) { app.destroy(true, { children: true }); return; }
      el.appendChild(app.canvas);
      const g = new Graphics();
      preset.make(g);
      const tex: Texture = app.renderer.generateTexture(g);
      const layer = new Container();
      app.stage.addChild(layer);
      const W = () => app.screen.width, H = () => app.screen.height;
      const parts = Array.from({ length: Math.round(preset.count * density) }, () => {
        const s = new Sprite(tex);
        s.anchor.set(0.5);
        if (preset.additive) s.blendMode = 'add';
        const p = { s, vx: r(...preset.vx), vy: r(...preset.vy), spin: r(-preset.spin, preset.spin), phase: Math.random() * 6.28 };
        s.scale.set(r(...preset.scale));
        s.alpha = r(...preset.alpha);
        s.x = Math.random() * W();
        s.y = Math.random() * H();
        layer.addChild(s);
        return p;
      });
      app.ticker.add(t => {
        const w = W(), h = H(), dt = t.deltaTime;
        for (const p of parts) {
          p.phase += 0.02 * dt;
          p.s.x += (p.vx + Math.sin(p.phase) * preset.sway) * dt;
          p.s.y += (preset.rise ? -p.vy : p.vy) * dt;
          p.s.rotation += p.spin * dt;
          if (preset.rise ? p.s.y < -20 : p.s.y > h + 30) { p.s.y = preset.rise ? h + 20 : -30; p.s.x = Math.random() * w; }
          if (p.s.x < -30) p.s.x = w + 20; else if (p.s.x > w + 30) p.s.x = -20;
        }
      });
    });
    return () => { alive = false; if (started) app.destroy(true, { children: true }); };
  }, [type, density, enabled]);

  if (!enabled) return null;
  return <div ref={host} className="fx-canvas" />;
}
