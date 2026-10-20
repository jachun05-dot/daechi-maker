/* 스케줄 탭 — 한 달 평일 시간표 (월~금 × 방과후·야간) */
import { useGame } from '@/store/game';
import { useUI, ui } from '@/store/ui';
import { TURNS, DAY_LABEL } from '@/content/calendar';
import { CAREERS, SUBJECT_LABEL } from '@/content/careers';
import { CHARACTERS } from '@/content/characters';
import { BALANCE } from '@/config/balance';
import { useMemo } from 'react';
import { clubAt, findClub, findOption, optionsFor, timetableReady, SLOT_LABEL, SLOT_TIME, isBase, isSkill, type Delta, type TimetableOption } from '@/engine/timetable';
import { forecastMonth, hasTalent, monthGoal, recommendTimetable, PRESETS, type Forecast } from '@/engine/forecast';
import { reqLabel, reqMet } from '@/engine/progress';
import { deltaChips, won } from '@/engine/chips';
import { hpMax, refresh } from '@/engine/state';
import { scheduleImage } from '@/engine/assets';
import { runMonth } from '@/engine/month';
import { josa } from '@/engine/story/context';
import type { GameState, SubjectKey } from '@/engine/types';
import { Chips } from '../common/Chips';
import { Mono } from '../common/Mono';
import { Icon } from '../common/Icon';
import { NeedGame } from '../common/NeedGame';

function hint(st: GameState) {
  const T = TURNS[st.turn];
  if (st.turn === 0) return '요일마다 방과후와 야간 일정을 골라 한 달 시간표를 짜세요. 주말에는 서울 지도에서 갈 곳을 고릅니다.';
  if (T.summer) return '여름방학. 특강을 하나 고르면 방학이 빠르게 지나갑니다. 호감도가 높은 사람에게서 연락이 올지도 몰라요.';
  if (st.hp < hpMax(st) * 0.3) return '체력이 낮으면 수업 중에 졸아서 덜 성장해요. 쉬는 칸을 넣어 주세요.';
  if (st.stress >= 75) return '스트레스가 한계에 가까워요. 100이 되면 슬럼프가 옵니다.';
  return '무거운 일정을 쉬는 칸 없이 사흘 넘게 이으면 피로가 더 쌓여요. 새 일정은 실력이 쌓이면 열려요.';
}

export function ScheduleTab() {
  const { state: st } = useGame();
  if (!st) return <NeedGame />;
  const T = TURNS[st.turn];

  if (T.summer) return (
    <div className="stack">
      <Hero st={st} />
      <section className="card">
        <div className="card-h"><h3>여름방학</h3></div>
        <p className="muted">방학 동안에는 시간표와 주말 지도 대신 방학 특강을 고릅니다.</p>
        <button className="btn primary block run-btn" onClick={() => runMonth()}><Icon name="play" size={16} />방학 시작</button>
      </section>
    </div>
  );

  return <Planner st={st} />;
}

function Planner({ st }: { st: GameState }) {
  const T = TURNS[st.turn];
  const club = findClub(st.club);
  const key = `${st.timetable.join(',')}|${st.focus}|${st.club}|${st.turn}`;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fc = useMemo(() => (st.timetable.some(Boolean) ? forecastMonth(st) : null), [key]);
  const goal = monthGoal(st, T, fc);
  const ready = timetableReady(st);
  return (
    <div className="stack">
      <Hero st={st} />

      <section className={`card goal ${goal.tone ?? ''}`}>
        <div className="card-h"><h3>{goal.title}</h3>{goal.ratio !== undefined && <small>{Math.round(goal.ratio * 100)}%</small>}</div>
        {goal.ratio !== undefined && <div className="bar goal-bar"><i style={{ width: `${goal.ratio * 100}%` }} /></div>}
        <ul className="goal-ls">{goal.lines.map((l, i) => <li key={i}>{l}</li>)}</ul>
      </section>

      <section className="card">
        <div className="card-h"><h3>이번 달 집중 과목</h3><small>수업 시간 · 시험 보너스</small></div>
        <div className="seg wrap">
          {(Object.keys(SUBJECT_LABEL) as SubjectKey[]).map(k => (
            <button key={k} className={st.focus === k ? 'on' : ''} onClick={() => { st.focus = st.focus === k ? null : k; refresh(); }}>{SUBJECT_LABEL[k]}</button>
          ))}
        </div>
        <p className="muted">동아리 · {club ? `${club.name}${club.days.length ? ` (${club.days.map(d => DAY_LABEL[d]).join('·')} 방과후)` : ''}` : '미정'}</p>
      </section>

      <section className="card">
        <div className="card-h"><h3>평일 시간표</h3><small>한 달 동안 4주 반복</small></div>
        <div className="presets">
          <span>추천</span>
          {PRESETS.map(p => <button key={p.id} className="btn small" title={p.desc} onClick={() => {
            const noTalent = p.id === 'talent' && !hasTalent(st);
            st.timetable = recommendTimetable(st, noTalent ? 'balance' : p.id);
            refresh();
            ui.toast(noTalent ? '아직 두드러진 재능이 없어 고르게 짰어요' : `${p.label} 위주 · ${p.desc}`);
          }}>{p.label}</button>)}
        </div>
        <div className="tt">
          <div className="tt-row tt-head"><span />{DAY_LABEL.map(d => <b key={d}>{d}</b>)}</div>
          {([0, 1] as const).map(slot => (
            <div key={slot} className="tt-row">
              <span className="tt-slot">{SLOT_LABEL[slot]}<small>{SLOT_TIME[slot]}</small></span>
              {DAY_LABEL.map((_, day) => {
                const c = clubAt(st, day, slot);
                const o = findOption(slot, st.timetable[day * 2 + slot]);
                if (c) return <div key={day} className="tt-cell club"><b>{c.name}</b></div>;
                return (
                  <button key={day} className={`tt-cell${o ? ' set' : ''}${o?.heavy ? ' heavy' : ''}`} onClick={() => useUI.setState({ sheetSlot: day * 2 + slot })}>
                    {o ? <b>{o.name}</b> : <Icon name="plus" size={16} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {fc ? <ForecastPanel st={st} f={fc} /> : <p className="muted center">칸을 채우면 한 달 예상이 나와요. 막막하면 위의 추천을 눌러 보세요.</p>}
        <div className="row">
          <button className="btn small" disabled={!st.lastTimetable} onClick={() => { st.timetable = [...st.lastTimetable!]; refresh(); ui.toast('지난달 시간표를 불러왔어요'); }}><Icon name="undo" size={16} />지난달 시간표</button>
          <button className="btn small" onClick={() => { st.timetable = Array(10).fill(null); refresh(); }}>비우기</button>
        </div>
        <button className="btn primary block run-btn" disabled={!ready} onClick={() => runMonth()}><Icon name="play" size={16} />이번 달 시작</button>
        {!ready && <p className="muted center">빈 칸을 모두 채우면 시작할 수 있어요.</p>}
      </section>
      <CellSheet />
    </div>
  );
}

/** 한 달 예상 — 월말 체력·스트레스·용돈과 위험 신호, 예상 성장 */
function ForecastPanel({ st, f }: { st: GameState; f: Forecast }) {
  const max = hpMax(st);
  const warns: string[] = [];
  if (f.collapse) warns.push(`체력이 바닥나 ${f.collapse}일 쓰러져요 — 그날 일정은 날아가요`);
  else if (f.doze >= 3) warns.push(`수업 중 ${f.doze}일 졸 것 같아요 — 수업 효율이 떨어져요`);
  if (f.broke) warns.push(`용돈이 모자라 ${f.broke}번 건너뛰게 돼요`);
  if (f.stressEnd >= 85) warns.push('스트레스가 한계에 가까워요 — 100이 되면 슬럼프');
  else if (f.stressEnd >= 60) warns.push('스트레스가 60을 넘으면 성장 효율이 떨어져요');
  const row = (label: string, now: number, end: number, cap: number, bad: boolean, fmt = (v: number) => String(Math.round(v))) => (
    <div className={`fc-row${bad ? ' bad' : ''}`}>
      <span>{label}</span>
      <div className="fc-bar"><i className="now" style={{ width: `${Math.min(100, (now / cap) * 100)}%` }} /><i className="end" style={{ width: `${Math.min(100, (end / cap) * 100)}%` }} /></div>
      <b>{fmt(now)} → {fmt(end)}</b>
    </div>
  );
  return (
    <div className="fc">
      <div className="fc-h"><b>한 달 예상</b><small>주말 하루는 집에서 쉰다고 보고 계산</small></div>
      {row('체력', st.hp, f.hpEnd, max, f.hpEnd < max * 0.3 || f.collapse > 0)}
      {row('스트레스', st.stress, f.stressEnd, 100, f.stressEnd >= 70)}
      {row('용돈', st.money, f.moneyEnd, Math.max(st.money, f.moneyEnd, 1), f.broke > 0, v => won(v))}
      {warns.length > 0 && <ul className="fc-warn">{warns.map(w => <li key={w}>{w}</li>)}</ul>}
      {(f.immerse > 0 || f.rhythm > 0) && <p className="fc-flow">{f.immerse > 0 && <span>몰입 {f.immerse}일 · 같은 일정을 3일째 이어 하면 대성공↑ 성장↑</span>}{f.rhythm > 0 && <span>리듬 {f.rhythm}일 · 할 일 + 쉬는 일을 섞은 날</span>}</p>}
      <div className="fc-gain"><span>예상 성장 (수업 포함)</span>{f.gains.length ? <Chips chips={f.gains} /> : <small className="muted">거의 없음</small>}</div>
    </div>
  );
}

/** 이 칸을 한 달(4번) 했을 때 — 성장에는 전체 배율을 곱한다 */
function perMonth(d: Delta): Delta {
  const out: Delta = {};
  for (const [k, v] of Object.entries(d) as [keyof Delta, number][]) out[k] = v * 4 * ((isBase(k) || isSkill(k)) && v > 0 ? BALANCE.growth.scale : 1);
  return out;
}

function Hero({ st }: { st: GameState }) {
  const T = TURNS[st.turn];
  return (
    <section className="hero-card">
      <div className="hero-kicker">{T.title}</div>
      <h2>{T.label}</h2>
      <p>{hint(st)}</p>
      <div className="hero-foot"><span>남은 달 {TURNS.length - st.turn}</span><span>꿈 · {st.goal ? CAREERS[st.goal].goal : st.goalHint ? `아직 (후보: ${CAREERS[st.goalHint].short})` : '아직 찾는 중'}</span></div>
    </section>
  );
}

function CellSheet() {
  const { state: st } = useGame();
  const cell = useUI(s => s.sheetSlot);
  if (!st || cell === null) return null;
  const day = Math.floor(cell / 2), slot = (cell % 2) as 0 | 1;
  const close = () => useUI.setState({ sheetSlot: null });
  const choose = (o: TimetableOption) => { st.timetable[cell] = o.id; close(); refresh(); };
  const fillWeek = (o: TimetableOption) => {
    for (let d = 0; d < 5; d++) if (o.days.includes(d) && !clubAt(st, d, slot)) st.timetable[d * 2 + slot] = o.id;
    close(); refresh();
  };
  // 잠긴 일정은 열리는 조건이 가까운 순으로 맨 아래에
  const list = [...optionsFor(slot)].sort((a, b) => Number(!reqMet(st, a.req)) - Number(!reqMet(st, b.req)));
  return (
    <div className="layer sheet" onClick={e => e.target === e.currentTarget && close()}>
      <div className="sheet-pane">
        <div className="sheet-h"><b>{DAY_LABEL[day]}요일 {SLOT_LABEL[slot]}</b><span>{SLOT_TIME[slot]}</span><button onClick={close} aria-label="닫기"><Icon name="close" /></button></div>
        <div className="sheet-ls">
          {list.map(o => {
            const unlocked = reqMet(st, o.req), open = o.days.includes(day) && unlocked;
            return (
              <div key={o.id} className={`opt${st.timetable[cell] === o.id ? ' sel' : ''}${open ? '' : ' poor'}${unlocked ? '' : ' locked'}`}>
                <button className="opt-main" disabled={!open} onClick={() => choose(o)}>
                  <Mono src={scheduleImage(o.id)} text={unlocked ? o.place[0] : '🔒'} />
                  <div className="opt-tx">
                    <div><b>{o.name}</b> <span className="opt-place">{o.place}</span>{o.heavy && <span className="opt-heavy">무거움</span>}</div>
                    <p>{o.desc}{unlocked && !o.days.includes(day) ? ` (${o.days.map(d => DAY_LABEL[d]).join('·')}만)` : ''}</p>
                    {!unlocked && o.req && <div className="opt-lock">{reqLabel(o.req)}이(가) 되면 열려요</div>}
                    <Chips chips={deltaChips(perMonth(o.delta))} />
                    {o.who && st.met[o.who] && <div className="opt-meet">{josa(CHARACTERS[o.who].name, '을/를')} 마주칠지도</div>}
                  </div>
                </button>
                {open && o.days.length > 1 && <button className="btn small opt-all" onClick={() => fillWeek(o)}>열리는 요일 모두</button>}
              </div>
            );
          })}
        </div>
        <p className="muted sheet-foot">숫자는 이 칸을 한 달(4번) 했을 때. 체력이 바닥나면 그날 일정을 날리고 쓰러져 자요 · 밤마다 체력 +{BALANCE.weekday.nightRegen}</p>
      </div>
    </div>
  );
}
