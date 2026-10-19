/* 모달 · 암전 · 크레딧 · 토스트 (진행 화면은 Run.tsx) */
import { useEffect, useState } from 'react';
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { CAREERS } from '@/content/careers';
import { CREDITS_QUOTE } from '@/content/endings';
import { ERA } from '@/content/eras';
import { Chips } from '../common/Chips';

export function Modal() {
  const m = useUI(s => s.modal);
  const [value, setValue] = useState('');
  useEffect(() => setValue(m?.area?.value ?? ''), [m]);
  if (!m) return null;
  return (
    <div className="layer modal">
      <div className="modal-box">
        {m.title && <h3>{m.title}</h3>}
        {m.text && <p className="modal-text">{m.text}</p>}
        {m.letter && <div className="letter">{m.letter}</div>}
        {m.options && (
          <div className="modal-opts">
            {m.options.map((o, i) => (
              <button key={i} className="opt" disabled={o.disabled} onClick={() => ui.closeModal(o.value)}>
                <div className="opt-tx"><b>{o.label}</b>{o.desc && <p>{o.desc}</p>}{o.chips && <Chips chips={o.chips} />}</div>
              </button>
            ))}
          </div>
        )}
        {m.endings && <div className="modal-endings">{m.endings.map(e => <div key={e.title} className="ending-row"><b>{e.title}</b><span>{e.kind}</span></div>)}</div>}
        {m.input !== undefined && <input autoFocus maxLength={8} placeholder={m.input} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && ui.closeModal(value.trim() || m.input)} />}
        {m.area && <textarea className="modal-area" readOnly={m.area.readOnly} placeholder={m.area.placeholder} value={value}
          onFocus={e => m.area?.readOnly && e.currentTarget.select()} onChange={e => setValue(e.target.value)} />}
        {m.buttons.length > 0 && <div className="modal-btns">
          {m.buttons.map(b => <button key={b.label} className={`btn${b.primary ? ' primary' : ''}`} onClick={() => ui.closeModal(m.input !== undefined ? value.trim() || m.input : m.area && !m.area.readOnly && b.value !== false ? value : b.value)}>{b.label}</button>)}
        </div>}
      </div>
    </div>
  );
}

export function Ink() {
  const ink = useUI(s => s.ink);
  if (!ink) return null;
  return <div className={`layer ink ${ink.mode}${ink.on ? ' on' : ''}`}><p>{ink.text}</p></div>;
}

export function Credits() {
  const open = useUI(s => s.credits);
  const { state: st } = useGame();
  if (!open || !st) return null;
  return (
    <div className="layer credits">
      <button className="credits-skip" onClick={() => ui.creditsDone()}>SKIP</button>
      <div className="credits-roll" onAnimationEnd={() => ui.creditsDone()}>
        <h3>이화(梨花)에 지는 달</h3><p className="sm">대치동 환생록</p>
        <h3>主人公</h3><p>{st.name} <span className="sm">/ {CAREERS[st.pastRole ?? 'med'].past}</span></p>
        <h3>因緣</h3>{CHAR_ORDER.map(k => <p key={k}>{CHARACTERS[k].name} <span className="sm">/ {CHARACTERS[k].past}</span></p>)}
        <h3>그리고</h3><p>{ERA.dedication.split('\n').map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</p>
        <p className="sm quote">{CREDITS_QUOTE}</p>
        <h3>— 終 —</h3>
      </div>
    </div>
  );
}

export function Toast() {
  const t = useUI(s => s.toast);
  return t ? <div key={t.key} className="toast">{t.text}</div> : null;
}
