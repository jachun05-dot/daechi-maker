/* =========================================================
   평일 실시간 진행 — 위: 오늘 장면 (그림 + 움직임 + 판정 도장 + 오른 것)
                     아래: 월~금 띠 (칸마다 결과 · 사건 아이콘)
   그림: src/assets/images/schedule/{일정id}.jpg · {id}_great.jpg · {id}_fail.jpg (없으면 갈래 색과 아이콘)
   ========================================================= */
import { useUI, ui, type LiveSlot, type LiveWeek as Week } from '@/store/ui';
import { scheduleShot } from '@/engine/assets';
import { CAT_LOOK, type Cat } from '@/content/rolls';
import { SLOT_LABEL } from '@/engine/timetable';

const STAMP: Record<string, [string, string] | undefined> = {
  great: ['대성공!', 'great'], ok: ['성공', 'ok'], fail: ['실수…', 'fail'],
  skip: ['빠짐', 'mute'], broke: ['돈 없음', 'mute'], collapse: ['쓰러짐', 'fail'], empty: ['빈칸', 'mute'],
};
const MARK: Record<string, string> = { great: '★', ok: '✓', fail: '✕', skip: '–', broke: '₩', collapse: 'z', empty: '·', wait: '' };

export function LiveWeek() {
  const w = useUI(s => s.week);
  if (!w) return null;
  return (
    <div className="lw">
      <Today w={w} />
      {w.choice && <Choice w={w} />}
      <Strip w={w} />
    </div>
  );
}

function Today({ w }: { w: Week }) {
  const cur = w.cur ?? { day: 0, slot: 0 };
  const day = w.days[cur.day];
  const s: LiveSlot = day.slots[cur.slot];
  const look = CAT_LOOK[(s.cat as Cat) ?? 'study'] ?? CAT_LOOK.study;
  const img = s.id ? scheduleShot(s.id, s.state) : undefined;
  const stamp = STAMP[s.state];
  const key = `${cur.day}-${cur.slot}-${s.state}`;
  return (
    <div className={`lw-today st-${s.state}`}>
      <div key={key} className={`lw-shot${img ? '' : ' none'}`} style={img ? { backgroundImage: `url("${img}")` } : { background: `linear-gradient(135deg, ${look.from}, ${look.to})` }}>
        {!img && <span className="lw-icon">{look.icon}</span>}
      </div>
      <div className="lw-fx" key={`fx-${key}`}>
        {Array.from({ length: s.state === 'great' ? 10 : 6 }, (_, i) => (
          <i key={i} style={{ left: `${8 + ((i * 37) % 84)}%`, animationDelay: `${(i * 0.23) % 1.4}s` }}>{s.state === 'great' ? '✦' : look.fx}</i>
        ))}
      </div>
      <div className="lw-cap">
        <span>{day.label}요일 · {SLOT_LABEL[cur.slot as 0 | 1]}{s.club ? ' · 동아리' : ''}{s.immerse ? ' · 몰입' : ''}</span>
        <b>{s.name || '빈칸'}</b>
      </div>
      {stamp && s.state !== 'wait' && <div key={`st-${key}`} className={`lw-stamp ${stamp[1]}`}>{stamp[0]}</div>}
      {s.gains && s.gains.length > 0 && (
        <div key={`g-${key}`} className="lw-gains">{s.gains.slice(0, 4).map((g, i) => <span key={i} style={{ animationDelay: `${0.15 + i * 0.08}s` }}>{g}</span>)}</div>
      )}
      {s.line && <p key={`l-${key}`} className="lw-line">{s.line}</p>}
      {w.choice && <div className="lw-pause">잠깐, 오늘은…</div>}
    </div>
  );
}

function Choice({ w }: { w: Week }) {
  const c = w.choice!;
  return (
    <div className="lw-choice" onClick={e => e.stopPropagation()}>
      <div className="lw-choice-h"><span>{c.icon}</span><div><small>{w.days[c.day].label}요일</small><b>{c.title}</b></div></div>
      <p>{c.text}</p>
      <div className="lw-choice-b">
        {c.options.map((o, i) => (
          <button key={i} className="btn" onClick={() => ui.weekChoose(i)}><b>{o.label}</b>{o.hint && <small>{o.hint}</small>}</button>
        ))}
      </div>
    </div>
  );
}

function Strip({ w }: { w: Week }) {
  return (
    <div className="lw-strip">
      {w.days.map((d, i) => {
        const now = w.cur?.day === i;
        return (
          <div key={i} className={`lw-d${now ? ' now' : ''}${d.school === 'wait' && !now ? ' wait' : ''}`}>
            <b>{d.label}</b>
            <i className={`lw-school ${d.school}`}>{d.school === 'doze' ? '졸음' : d.school === 'sleep' ? '잠듦' : d.school === 'ok' ? '수업' : ''}</i>
            {d.slots.map((s, k) => {
              const look = CAT_LOOK[(s.cat as Cat) ?? 'study'] ?? CAT_LOOK.study;
              return (
                <span key={k} className={`lw-s ${s.state}${now && w.cur?.slot === k ? ' on' : ''}`} style={{ borderColor: look.from }}>
                  <em>{s.name || '빈칸'}</em>{MARK[s.state] && <u>{MARK[s.state]}</u>}
                </span>
              );
            })}
            {d.event && <span className={`lw-ev${d.event.ok === false ? ' bad' : ''}`} title={d.event.text}>{d.event.icon}</span>}
            {d.tags.map(t => <small key={t} className={`lw-tag t-${t}`}>{t}</small>)}
          </div>
        );
      })}
      <EventLine w={w} />
    </div>
  );
}

/** 오늘(또는 가장 최근) 일어난 사건 한 줄 */
function EventLine({ w }: { w: Week }) {
  const upto = w.cur?.day ?? 4;
  const d = [...w.days.slice(0, upto + 1)].reverse().find(x => x.event);
  if (!d?.event) return null;
  return <p key={d.event.text} className={`lw-evline${d.event.ok === false ? ' bad' : ''}`}><span>{d.event.icon}</span><b>{d.label} · {d.event.title}</b> {d.event.text}</p>;
}
