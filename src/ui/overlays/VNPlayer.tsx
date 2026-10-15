/* =========================================================
   비주얼 노벨 화면 — 배경 / CG / 스탠딩 / 대사창 / 선택지 / 타이틀 카드
   이미지는 src/engine/assets.ts 규칙으로 자동 연결 (없으면 빈 칸)
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { BACKGROUNDS } from '@/content/backgrounds';
import { bgImage, cgImage, standImage, standPath } from '@/engine/assets';
import { FxLayer } from '../common/FxLayer';

const SPEED = [42, 24, 9];

export function VNPlayer() {
  const vn = useUI(s => s.vn);
  const { settings } = useGame();
  const [shown, setShown] = useState(0);
  const [auto, setAuto] = useState(false);
  const [skip, setSkip] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const [shake, setShake] = useState(false);
  const flashRef = useRef<HTMLDivElement>(null);
  const view = vn?.view;
  const full = view?.text ?? '';
  const typing = view?.mode === 'say' && shown < full.length;

  // 타자기 효과
  useEffect(() => {
    if (!view || view.mode !== 'say') return;
    if (skip) { setShown(full.length); return; }
    setShown(0);
    const t = setInterval(() => setShown(n => { if (n >= full.length) { clearInterval(t); return n; } return n + 1; }), SPEED[settings.textSpeed]);
    return () => clearInterval(t);
  }, [view, skip, full, settings.textSpeed]);

  // 자동 진행 · 스킵
  useEffect(() => {
    if (!view || view.mode === 'choice' || typing) return;
    if (!auto && !skip) return;
    const delay = skip ? (view.mode === 'card' ? 400 : 60) : view.mode === 'card' ? 2400 : 1000 + full.length * 35;
    const t = setTimeout(() => ui.vnAdvance(), delay);
    return () => clearTimeout(t);
  }, [view, typing, auto, skip, full]);

  // 흔들림 · 번쩍임
  useEffect(() => { if (!view?.shake) return; setShake(true); const t = setTimeout(() => setShake(false), 500); return () => clearTimeout(t); }, [view?.shake]);
  useEffect(() => {
    const el = flashRef.current;
    if (!view?.flash || !el) return;
    el.style.background = view.flash.color;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }, [view?.flash?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // 장면이 끝나면 스킵 해제
  useEffect(() => { if (!vn) { setSkip(false); setLogOpen(false); } }, [vn]);

  if (!vn || !view) return null;
  const night = view.theme === 'night';
  const bgUrl = bgImage(view.bg), cgUrl = view.cg ? cgImage(view.cg) : undefined;
  const standUrl = view.stand ? standImage(view.stand.id, view.stand.expr, night) : undefined;

  const onTap = () => {
    if (logOpen || view.mode === 'choice') return;
    if (typing) { setShown(full.length); return; }
    ui.vnAdvance();
  };

  return (
    <div className={`layer vn${shake ? ' shake' : ''}`} onClick={onTap}>
      <div className="vn-bg" style={{ background: bgUrl ? `url("${bgUrl}") center/cover no-repeat` : (BACKGROUNDS[view.bg]?.color ?? '#222') }}>
        {!bgUrl && settings.showSlots && <span className="vn-bg-hint">bg/{view.bg}.jpg · {BACKGROUNDS[view.bg]?.label}</span>}
      </div>
      <div className="vn-shade" />
      <FxLayer type={view.fx} />
      {view.stand && (
        <div className="vn-stand" key={`${view.stand.id}-${night}`}>
          {standUrl ? <img src={standUrl} alt="" /> : settings.showSlots && <div className="slot-hint stand-hint">{standPath(view.stand.id, view.stand.expr, night)}</div>}
        </div>
      )}
      {view.cg && (
        <div className="vn-cg">{cgUrl ? <img src={cgUrl} alt="" /> : settings.showSlots && <div className="slot-hint">cg/{view.cg}.jpg</div>}</div>
      )}

      <div className="vn-tools" onClick={e => e.stopPropagation()}>
        <button className={auto ? 'on' : ''} onClick={() => setAuto(a => !a)}>AUTO</button>
        <button className={skip ? 'on' : ''} onClick={() => setSkip(s => !s)}>SKIP</button>
        <button onClick={() => setLogOpen(true)}>LOG</button>
      </div>

      {view.mode === 'choice' && (
        <div className="vn-choices" onClick={e => e.stopPropagation()}>
          {view.choices.map((c, i) => (
            <button key={i} className={c.special ? 'special' : ''} style={{ animationDelay: `${i * 70}ms` }} onClick={() => ui.vnChoose(i)}>{c.text}</button>
          ))}
        </div>
      )}

      {view.mode === 'card' && view.card && (
        <div className="vn-card">
          <div className="k">{view.card.kicker}</div>
          <div className="t">{view.card.title}</div>
          {view.card.sub && <div className="s">{view.card.sub}</div>}
        </div>
      )}

      {view.mode !== 'card' && (
        <div className="vn-box">
          {view.speaker && <div className="vn-name" style={view.speakerColor && !night ? { background: view.speakerColor } : undefined}>{view.speaker}</div>}
          <p className={view.speaker ? 'vn-text' : 'vn-text narr'}>{view.mode === 'say' ? full.slice(0, shown) : full}</p>
          {!typing && view.mode === 'say' && <span className="vn-next">▼</span>}
        </div>
      )}

      <div className="vn-flash" ref={flashRef} />

      {logOpen && (
        <div className="vn-log" onClick={e => e.stopPropagation()}>
          <div className="vn-log-ls">{vn.player.log.map((l, i) => <p key={i}>{l.speaker && <b>{l.speaker}</b>}{l.text}</p>)}</div>
          <button onClick={() => setLogOpen(false)}>닫기</button>
        </div>
      )}
    </div>
  );
}
