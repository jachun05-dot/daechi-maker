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
  // 장면 앞 자막 · 장면 안 장소 이동 자막 — 끝난 것은 다시 띄우지 않는다
  const [introDone, setIntroDone] = useState(0);
  const [moveDone, setMoveDone] = useState(0);
  // 배경이 바뀌면 이전 배경 위로 새 배경이 서서히 겹쳐진다
  const [prevBg, setPrevBg] = useState<string | null>(null);
  const bgRef = useRef<string | null>(null);
  useEffect(() => {
    const bg = vn?.view.bg ?? null;
    if (bgRef.current && bg && bgRef.current !== bg) {
      setPrevBg(bgRef.current);
      const t = setTimeout(() => setPrevBg(null), 900);
      bgRef.current = bg;
      return () => clearTimeout(t);
    }
    bgRef.current = bg;
  }, [vn?.view.bg]);
  const view = vn?.view;
  const full = view?.text ?? '';
  const typing = view?.mode === 'say' && shown < full.length;
  // 전환 자막이 떠 있는 동안은 첫 줄을 치지 않는다 (스킵 중이면 자막도 건너뜀)
  const introOn = !!vn?.intro && vn.intro.key !== introDone;
  useEffect(() => { if (skip && vn?.intro) setIntroDone(vn.intro.key); }, [skip, vn?.intro]);

  // 타자기 효과
  useEffect(() => {
    if (!view || view.mode !== 'say') return;
    if (skip) { setShown(full.length); return; }
    setShown(0);
    if (introOn) return;
    const t = setInterval(() => setShown(n => { if (n >= full.length) { clearInterval(t); return n; } return n + 1; }), SPEED[settings.textSpeed]);
    return () => clearInterval(t);
  }, [view, skip, full, settings.textSpeed, introOn]);

  // 자동 진행 · 스킵
  useEffect(() => {
    if (!view || view.mode === 'choice' || typing || (introOn && !skip)) return;
    if (!auto && !skip) return;
    const delay = skip ? (view.mode === 'card' ? 400 : 60) : view.mode === 'card' ? 2400 : 1000 + full.length * 35;
    const t = setTimeout(() => ui.vnAdvance(), delay);
    return () => clearTimeout(t);
  }, [view, typing, auto, skip, full, introOn]);

  // 흔들림 · 번쩍임
  useEffect(() => { if (!view?.shake) return; setShake(true); const t = setTimeout(() => setShake(false), 500); return () => clearTimeout(t); }, [view?.shake]);
  useEffect(() => {
    const el = flashRef.current;
    if (!view?.flash || !el) return;
    el.style.background = view.flash.color;
    el.classList.remove('go'); void el.offsetWidth; el.classList.add('go');
  }, [view?.flash?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  // 장면이 끝나면 스킵 해제
  useEffect(() => { if (!vn) { setSkip(false); setLogOpen(false); bgRef.current = null; setPrevBg(null); } }, [vn]);

  if (!vn || !view) return null;
  const night = view.theme === 'night';
  const bgUrl = bgImage(view.bg), cgUrl = view.cg ? cgImage(view.cg) : undefined;
  const standUrl = view.stand ? standImage(view.stand.id, view.stand.expr, night) : undefined;

  const intro = vn.intro && vn.intro.key !== introDone ? vn.intro : null;
  const move = view.move && view.move.key !== moveDone && view.move.text ? view.move : null;
  const bgStyle = (key: string) => {
    const url = bgImage(key);
    return { background: url ? `url("${url}") ${BACKGROUNDS[key]?.focus ?? 'center'}/cover no-repeat` : (BACKGROUNDS[key]?.color ?? '#222') };
  };

  const onTap = () => {
    if (intro) { setIntroDone(intro.key); return; }
    if (logOpen || view.mode === 'choice') return;
    if (typing) { setShown(full.length); return; }
    ui.vnAdvance();
  };

  return (
    <div className={`layer vn${shake ? ' shake' : ''}${vn.closing ? ' closing' : ''}`} onClick={onTap}>
      {prevBg && <div className="vn-bg" style={bgStyle(prevBg)} />}
      <div className={`vn-bg${prevBg ? ' fadein' : ''}`} key={view.bg} style={bgStyle(view.bg)}>
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

      {move && (
        <div className="vn-move" key={`m${move.key}`} onAnimationEnd={() => setMoveDone(move.key)}><span>{move.text}</span></div>
      )}
      {intro && (
        <div className="vn-intro" key={`i${intro.key}`} onAnimationEnd={e => e.target === e.currentTarget && setIntroDone(intro.key)}>
          <small>{intro.when}</small>
          {intro.where && <b>{intro.where}</b>}
        </div>
      )}

      {logOpen && (
        <div className="vn-log" onClick={e => e.stopPropagation()}>
          <div className="vn-log-ls">{vn.player.log.map((l, i) => <p key={i}>{l.speaker && <b>{l.speaker}</b>}{l.text}</p>)}</div>
          <button onClick={() => setLogOpen(false)}>닫기</button>
        </div>
      )}
    </div>
  );
}
