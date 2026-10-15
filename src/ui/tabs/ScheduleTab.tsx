/* 스케줄 탭 — 한 달 평일 시간표 (월~금 × 방과후·야간) */
import { useGame } from '@/store/game';
import { useUI, ui } from '@/store/ui';
import { TURNS, DAY_LABEL } from '@/content/calendar';
import { CAREERS, SUBJECT_LABEL } from '@/content/careers';
import { CHARACTERS } from '@/content/characters';
import { BALANCE } from '@/config/balance';
import { clubAt, findClub, findOption, monthPreview, optionsFor, recommendTimetable, timetableReady, SLOT_LABEL, SLOT_TIME, type TimetableOption } from '@/engine/timetable';
import { deltaChips } from '@/engine/chips';
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
  if (T.event === 'exam' || T.event === 'suneung') return `이번 달 말 ${T.title}. 집중 과목이 학업 과목이면 시험에 보너스가 붙어요.`;
  if (T.event === 'festival') return '이번 달 말 이화제. 가장 자란 특기로 무대에 섭니다.';
  if (T.event === 'counsel') return T.year === 1 ? '이번 달 말 진로 상담. 지금까지 자란 재능으로 꿈의 후보가 언급됩니다.' : '이번 달 말 진로 상담. 이번엔 꿈을 정해야 해요.';
  return '무거운 일정을 쉬는 칸 없이 사흘 넘게 이으면 피로가 더 쌓여요.';
}

export function ScheduleTab() {
  const { state: st } = useGame();
  if (!st) return <NeedGame />;
  const T = TURNS[st.turn];
  const club = findClub(st.club);

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

  const preview = monthPreview(st), ready = timetableReady(st);
  return (
    <div className="stack">
      <Hero st={st} />

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
                  <button key={day} className={`tt-cell${o ? ' set' : ''}`} onClick={() => useUI.setState({ sheetSlot: day * 2 + slot })}>
                    {o ? <b>{o.name}</b> : <Icon name="plus" size={16} />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        <div className="plan-preview"><span className="muted">한 달 예상 (수업 제외)</span><Chips chips={deltaChips(preview)} /></div>
        {st.money + (preview.money ?? 0) < 0 && <p className="warn-line">용돈이 모자라면 비용이 드는 일정은 건너뛰게 돼요.</p>}
        <div className="row">
          <button className="btn small" disabled={!st.lastTimetable} onClick={() => { st.timetable = [...st.lastTimetable!]; refresh(); ui.toast('지난달 시간표를 불러왔어요'); }}><Icon name="undo" size={16} />지난달 시간표</button>
          <button className="btn small" onClick={() => { st.timetable = recommendTimetable(st); refresh(); }}><Icon name="sparkle" size={16} />재능 맞춤 추천</button>
          <button className="btn small" onClick={() => { st.timetable = Array(10).fill(null); refresh(); }}>비우기</button>
        </div>
        <button className="btn primary block run-btn" disabled={!ready} onClick={() => runMonth()}><Icon name="play" size={16} />이번 달 시작</button>
        {!ready && <p className="muted center">빈 칸을 모두 채우면 시작할 수 있어요.</p>}
      </section>
      <CellSheet />
    </div>
  );
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
  return (
    <div className="layer sheet" onClick={e => e.target === e.currentTarget && close()}>
      <div className="sheet-pane">
        <div className="sheet-h"><b>{DAY_LABEL[day]}요일 {SLOT_LABEL[slot]}</b><span>{SLOT_TIME[slot]}</span><button onClick={close} aria-label="닫기"><Icon name="close" /></button></div>
        <div className="sheet-ls">
          {optionsFor(slot).map(o => {
            const open = o.days.includes(day);
            return (
              <div key={o.id} className={`opt${st.timetable[cell] === o.id ? ' sel' : ''}${open ? '' : ' poor'}`}>
                <button className="opt-main" disabled={!open} onClick={() => choose(o)}>
                  <Mono src={scheduleImage(o.id)} text={o.place[0]} />
                  <div className="opt-tx">
                    <div><b>{o.name}</b> <span className="opt-place">{o.place}{o.heavy ? ' · 무거움' : ''}</span></div>
                    <p>{o.desc}{open ? '' : ` (${o.days.map(d => DAY_LABEL[d]).join('·')}만)`}</p>
                    <Chips chips={deltaChips(o.delta)} />
                    {o.who && st.met[o.who] && <div className="opt-meet">{josa(CHARACTERS[o.who].name, '을/를')} 마주칠지도</div>}
                  </div>
                </button>
                {open && o.days.length > 1 && <button className="btn small opt-all" onClick={() => fillWeek(o)}>열리는 요일 모두</button>}
              </div>
            );
          })}
        </div>
        <p className="muted sheet-foot">체력 바닥나면 다음 날 방과후·야간을 쓰러져 잠들어요. 하루 회복 +{BALANCE.weekday.nightRegen}.</p>
      </div>
    </div>
  );
}
