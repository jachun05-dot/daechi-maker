/* =========================================================
   진행 화면 — 평일 주간 카드 · 주말 기록 · 이정표 · 월말 성적표
   위쪽 막대(체력·스트레스·용돈)는 진행하는 동안 실시간으로 움직인다.
   ========================================================= */
import { useEffect, useRef, useState } from 'react';
import { useUI, ui, type RunLog, type WeekDayView, type ReportView } from '@/store/ui';
import { useGame } from '@/store/game';
import { BALANCE } from '@/config/balance';
import { hpMax } from '@/engine/state';
import { won } from '@/engine/chips';
import { Chips } from '../common/Chips';
import { Mono } from '../common/Mono';
import { LiveWeek } from './LiveWeek';

export function RunOverlay() {
  const run = useUI(s => s.run);
  const ls = useRef<HTMLDivElement>(null);
  const [instant, setInstant] = useState(false);
  const live = useUI(s => !!s.week);
  useEffect(() => { ls.current?.scrollTo({ top: ls.current.scrollHeight, behavior: 'smooth' }); }, [run?.logs.length, run?.button, live]);
  useEffect(() => setInstant(false), [run?.title]);
  if (!run || run.hidden) return null;
  return (
    <div className={`layer run${instant ? ' instant' : ''}`} onClick={() => { setInstant(true); ui.setFast(true); }}>
      <div className="run-h">
        <div><h2>{run.title}</h2><span>{run.sub}</span></div>
        <RunMeter />
      </div>
      <div className="run-ls" ref={ls}>
        {run.logs.map(l => <LogItem key={l.id} l={l} />)}
        <LiveWeek />
      </div>
      <div className="run-f">{run.button && <button className="btn primary block" onClick={e => { e.stopPropagation(); ui.runPress(); }}>{run.button}</button>}</div>
    </div>
  );
}

/** 체력 · 스트레스 · 용돈 — 진행 중에 바로바로 움직인다 */
function RunMeter() {
  const { state: st } = useGame();
  if (!st) return null;
  const max = hpMax(st), hp = Math.round(st.hp), sr = Math.round(st.stress);
  return (
    <div className="run-meter">
      <div className={hp < max * 0.3 ? 'low' : ''}><span>체력 <b>{hp}</b></span><div className="bar"><i style={{ width: `${(hp / max) * 100}%` }} /></div></div>
      <div className={`stress${sr >= 70 ? ' low' : ''}`}><span>스트레스 <b>{sr}</b></span><div className="bar"><i style={{ width: `${sr}%` }} /></div></div>
      <div className="money"><span>용돈</span><b>{won(st.money)}</b></div>
    </div>
  );
}

function LogItem({ l }: { l: RunLog }) {
  if (l.kind === 'day') return <div className="log-day"><b>{l.title}</b><span>{l.tag}</span></div>;
  if (l.kind === 'week' && l.week) return <WeekCard l={l} days={l.week.days} notes={l.week.notes} />;
  if (l.kind === 'grade') return (
    <div className="log grade"><div className="grade-mark">{l.mark}</div><div className="log-tx"><b>{l.title}</b>{l.body && <p>{l.body}</p>}</div></div>
  );
  if (l.kind === 'report' && l.report) return <Report r={l.report} />;
  return (
    <div className={`log ${l.tone ?? ''}`}>
      <Mono src={l.image} text={l.mark ?? '·'} color={l.color} />
      <div className="log-tx">
        {l.tag && <div className="log-tag">{l.tag}</div>}
        <b>{l.title}</b>
        {l.body && <p>{l.body}</p>}
        {l.chips && <Chips chips={l.chips} />}
      </div>
    </div>
  );
}

const SCHOOL = { ok: ['수업', ''], doze: ['졸음', 'warn'], sleep: ['잠듦', 'bad'] } as const;
const SLOT_STATE: Record<string, string> = { broke: '돈 없음', collapse: '쓰러짐', empty: '빈칸', skip: '빠짐' };

/** 주간 카드 — 월~금이 하루씩 켜지고, 마지막에 한 주 성장이 올라온다 */
function WeekCard({ l, days, notes }: { l: RunLog; days: WeekDayView[]; notes: string[] }) {
  return (
    <div className={`log week ${l.tone ?? ''}`}>
      <div className="week-h"><b>{l.title}</b>{l.tag && <span>{l.tag}</span>}</div>
      <div className="week-days">
        {days.map((d, i) => (
          <div key={i} className={`wd${d.collapse ? ' collapse' : ''}`} style={{ animationDelay: `${i * 0.16}s` }}>
            <b>{d.label}</b>
            <i className={`wd-school ${SCHOOL[d.school][1]}`}>{SCHOOL[d.school][0]}</i>
            {d.slots.map((s, k) => (
              <span key={k} className={`wd-slot ${s.state}`}>{SLOT_STATE[s.state] ?? s.name}</span>
            ))}
            {d.strain && <em className="wd-tag">피로</em>}
            {d.met && <em className="wd-tag met">만남</em>}
          </div>
        ))}
      </div>
      <div className="week-sum">
        {l.body && <p className="week-line">{l.body}</p>}
        {l.chips && l.chips.length > 0 ? <Chips chips={l.chips} /> : <p className="muted">눈에 띄게 달라진 건 없었다.</p>}
        {notes.length > 0 && <p className="week-notes">{notes.join(' · ')}</p>}
      </div>
    </div>
  );
}

/** 월말 성적표 */
function Report({ r }: { r: ReportView }) {
  const max = BALANCE.statBarMax;
  return (
    <div className="report">
      <div className="report-h">
        <div className="report-stamp">{r.verdictMark}</div>
        <div><h3>{r.title}</h3><p>{r.verdict}</p></div>
      </div>
      {r.event && (
        <div className="report-event">
          <span>{r.event.title}</span><b>{r.event.result}</b>
          <Chips chips={r.event.chips} />
        </div>
      )}
      <div className="report-bars">
        {r.bars.map((b, i) => {
          const gain = b.to - b.from;
          return (
            <div key={b.label} className="rb" style={{ animationDelay: `${0.1 + i * 0.06}s` }}>
              <span className="rb-l">{b.label}</span>
              <div className="rb-bar">
                <i className="old" style={{ width: `${Math.min(100, (b.from / max) * 100)}%` }} />
                <i className="new" style={{ left: `${Math.min(100, (b.from / max) * 100)}%`, width: `${Math.max(0, Math.min(100, (b.to / max) * 100) - Math.min(100, (b.from / max) * 100))}%` }} />
              </div>
              <b className="rb-v">{b.to}{b.grade && <em>{b.grade}</em>}</b>
              <span className={`rb-g${gain > 0 ? ' up' : gain < 0 ? ' down' : ''}`}>{gain > 0 ? `+${gain}` : gain < 0 ? `−${-gain}` : '·'}</span>
            </div>
          );
        })}
      </div>
      <div className="report-res">
        {r.res.map(x => <div key={x.label} className={x.tone ?? ''}><span>{x.label}</span><b>{x.value}</b></div>)}
      </div>
      {r.highlights.length > 0 && (
        <div className="report-hl">
          <span>이달의 순간</span>
          <ul>{r.highlights.map((h, i) => <li key={i}>{h}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
