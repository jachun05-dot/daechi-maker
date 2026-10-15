/* 주간 진행 · 모달 · 암전 · 크레딧 · 토스트 */
import { useEffect, useRef, useState } from 'react';
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { ROUTES } from '@/content/routes';
import { CREDITS_QUOTE } from '@/content/endings';
import { Chips } from '../common/Chips';
import { Mono } from '../common/Mono';

export function RunOverlay() {
  const run = useUI(s => s.run);
  const ls = useRef<HTMLDivElement>(null);
  useEffect(() => { ls.current?.scrollTo({ top: ls.current.scrollHeight, behavior: 'smooth' }); }, [run?.logs.length, run?.button]);
  if (!run) return null;
  return (
    <div className="layer run">
      <div className="run-h"><h2>{run.title}</h2><span>{run.sub}</span></div>
      <div className="run-ls" ref={ls}>
        {run.logs.map(l => (
          <div key={l.id} className={`log ${l.tone ?? ''}`}>
            <Mono src={l.image} text={l.mark ?? '·'} color={l.color} />
            <div className="log-tx">
              {l.tag && <div className="log-tag">{l.tag}</div>}
              <b>{l.title}</b>
              {l.body && <p>{l.body}</p>}
              {l.chips && <Chips chips={l.chips} />}
            </div>
          </div>
        ))}
      </div>
      <div className="run-f">{run.button && <button className="btn primary block" onClick={() => ui.runPress()}>{run.button}</button>}</div>
    </div>
  );
}

export function Modal() {
  const m = useUI(s => s.modal);
  const [value, setValue] = useState('');
  useEffect(() => setValue(''), [m]);
  if (!m) return null;
  return (
    <div className="layer modal">
      <div className="modal-box">
        {m.title && <h3>{m.title}</h3>}
        {m.text && <p className="modal-text">{m.text}</p>}
        {m.letter && <div className="letter">{m.letter}</div>}
        {m.endings && <div className="modal-endings">{m.endings.map(e => <div key={e.title} className="ending-row"><b>{e.title}</b><span>{e.kind}</span></div>)}</div>}
        {m.input !== undefined && <input autoFocus maxLength={8} placeholder={m.input} value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && ui.closeModal(value.trim() || m.input)} />}
        <div className="modal-btns">
          {m.buttons.map(b => <button key={b.label} className={`btn${b.primary ? ' primary' : ''}`} onClick={() => ui.closeModal(m.input !== undefined ? value.trim() || m.input : b.value)}>{b.label}</button>)}
        </div>
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
        <h3>主人公</h3><p>{st.name} <span className="sm">/ {ROUTES[st.route].past}</span></p>
        <h3>因緣</h3>{CHAR_ORDER.map(k => <p key={k}>{CHARACTERS[k].name} <span className="sm">/ {CHARACTERS[k].past}</span></p>)}
        <h3>그리고</h3><p>대치동의 밤을 견뎌 낸 모든 학생들과<br />사백삼십여 년 전,<br />꿈을 품에 넣고 칼을 들었던<br />이름 없는 의병들에게</p>
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
