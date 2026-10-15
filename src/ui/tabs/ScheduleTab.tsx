/* 스케줄 탭 — 이번 주 5슬롯 편성 */
import { useGame } from '@/store/game';
import { useUI, ui } from '@/store/ui';
import { SLOTS } from '@/content/schedule';
import { TURNS } from '@/content/calendar';
import { ROUTES } from '@/content/routes';
import { CHARACTERS } from '@/content/characters';
import { BALANCE } from '@/config/balance';
import { careerFit, getOption, planTotals, recommendPlan, STAT_LABEL, type ScheduleOption } from '@/engine/schedule';
import { deltaChips, shortMoney } from '@/engine/chips';
import { hpMax, refresh } from '@/engine/state';
import { scheduleImage } from '@/engine/assets';
import { runWeek } from '@/engine/week';
import { josa } from '@/engine/story/context';
import type { GameState, StatKey } from '@/engine/types';
import { Chips } from '../common/Chips';
import { Mono } from '../common/Mono';
import { Icon } from '../common/Icon';
import { NeedGame } from '../common/NeedGame';

const TIPS = [
  '장소마다 마주칠 수 있는 사람이 달라요. 같은 장소를 꾸준히 찾아가 보세요.',
  '전생 감응력이 높을수록, 밤마다 더 깊은 전생의 기억이 해금됩니다.',
  '스트레스가 60을 넘으면 성장 효율이 떨어져요. 휴식도 전략입니다.',
  '알바로 용돈을 벌어야 VVIP 과외와 청담동 라운지를 다닐 수 있어요.',
  '근력이 오르면 최대 체력도 늘어나요.',
  '엔딩은 ‘나의 꿈’이 1순위. 연애보다 커리어가 먼저 판정됩니다.',
  '스마트폰 답장으로도 호감도를 올릴 수 있어요.',
];

function hint(st: GameState) {
  const T = TURNS[st.turn];
  if (st.turn === 0) return '각 시간대를 눌러 일정을 고르세요. 장소에 따라 누군가를 만날지도 몰라요.';
  if (st.hp < hpMax(st) * 0.3) return '체력이 위험해요. 휴식을 편성하세요. 0이 되면 강제 병결입니다.';
  if (st.stress >= 75) return '스트레스가 한계에 가까워요. 100이 되면 슬럼프가 옵니다.';
  if (T.event === 'exam' || T.event === 'exam_winter' || T.event === 'suneung') return `이번 달 말 ${T.title}. 학업을 챙겨 두세요.`;
  if (T.event === 'festival') return '이번 달 말 이화제. 예술·감수성·화술 중 가장 높은 재능으로 무대에 섭니다.';
  if (T.event === 'sports') return '이번 달 말 체육대회. 근력이 높으면 활약할 수 있어요.';
  if (T.vacation) return '방학에는 체력이 더 많이 회복돼요.';
  if (T.event === 'graduation') return '이화고에서의 마지막 달. 후회 없이 보내세요.';
  return TIPS[st.turn % TIPS.length];
}

export function ScheduleTab() {
  const { state: st } = useGame();
  if (!st) return <NeedGame />;
  const T = TURNS[st.turn];
  const sum = planTotals(st), full = st.plan.every(Boolean);
  const fit = careerFit(st, st.goal), req = BALANCE.careers[st.goal];

  return (
    <div className="stack">
      <section className="hero-card">
        <div className="hero-kicker">{T.title}</div>
        <h2>{T.label}</h2>
        <p>{hint(st)}</p>
        <div className="hero-foot"><span>남은 달 {TURNS.length - st.turn}</span><span>꿈 · {ROUTES[st.goal].goal}</span></div>
      </section>

      <section className="card">
        <div className="card-h"><h3>이번 주 시간표</h3><small>시간대를 눌러 편성</small></div>
        <div className="slots">
          {SLOTS.map((slot, i) => {
            const o = getOption(i, st.plan[i]);
            return (
              <button key={slot.key} className={`slot${o ? ' set' : ''}`} onClick={() => useUI.setState({ sheetSlot: i })}>
                {o ? <Mono src={scheduleImage(o.id)} text={o.place[0]} /> : <div className="mono"><Icon name="plus" size={18} /></div>}
                <div className="slot-tx">
                  <div className="slot-time">{slot.label} · {slot.time}</div>
                  <div className="slot-name">{o ? o.name : '일정을 선택하세요'}</div>
                  {o && <Chips chips={deltaChips(o.delta)} />}
                </div>
                {o?.who && <span className="who" style={{ color: st.met[o.who] ? CHARACTERS[o.who].color : undefined }}>{st.met[o.who] ? CHARACTERS[o.who].name : '?'}</span>}
              </button>
            );
          })}
        </div>
        <div className="plan-sum">
          <span>체력 <b>{sum.hp >= 0 ? '+' : ''}{sum.hp}</b></span>
          <span>스트레스 <b>{sum.stress >= 0 ? '+' : ''}{sum.stress}</b></span>
          <span>용돈 <b className={st.money + sum.money < 0 ? 'neg' : ''}>{shortMoney(sum.money)}</b></span>
        </div>
        {st.money + sum.money < 0 && <p className="warn-line">용돈이 부족하면 해당 일정은 취소되고 집에서 쉬게 돼요.</p>}
        {st.hp + sum.hp <= 0 && <p className="warn-line">이대로면 체력이 바닥나 쓰러질 수 있어요.</p>}
        <div className="row">
          <button className="btn small" disabled={!st.lastPlan} onClick={() => { st.plan = [...st.lastPlan!]; refresh(); ui.toast('지난주 시간표를 불러왔어요'); }}><Icon name="undo" size={16} />이전 시간표 불러오기</button>
          <button className="btn small" onClick={() => { st.plan = recommendPlan(st); refresh(); }}><Icon name="sparkle" size={16} />꿈 맞춤 추천</button>
          <button className="btn small" onClick={() => { st.plan = [null, null, null, null, null]; refresh(); }}>비우기</button>
        </div>
        <button className="btn primary block run-btn" disabled={!full} onClick={() => runWeek()}><Icon name="play" size={16} />이번 주 시작</button>
      </section>

      <section className="card">
        <div className="card-h"><h3>나의 꿈</h3><small>{ROUTES[st.goal].goal}</small></div>
        <div className="fit-row"><div className="bar"><i style={{ width: `${Math.min(100, fit * 100)}%` }} /></div><b>{Math.floor(Math.min(1, fit) * 100)}%</b></div>
        <p className="muted">{Object.entries(req).map(([k, v]) => `${STAT_LABEL[k as StatKey]} ${st.stat[k as StatKey]}/${v}`).join(' · ')}</p>
      </section>
      <PlanSheet />
    </div>
  );
}

function PlanSheet() {
  const { state: st } = useGame();
  const slotIndex = useUI(s => s.sheetSlot);
  if (!st || slotIndex === null) return null;
  const slot = SLOTS[slotIndex];
  const close = () => useUI.setState({ sheetSlot: null });
  const choose = (o: ScheduleOption) => { st.plan[slotIndex] = o.id; close(); refresh(); };
  return (
    <div className="layer sheet" onClick={e => e.target === e.currentTarget && close()}>
      <div className="sheet-pane">
        <div className="sheet-h"><b>{slot.label}</b><span>{slot.time}</span><button onClick={close} aria-label="닫기"><Icon name="close" /></button></div>
        <div className="sheet-ls">
          {slot.options.map(o => {
            const poor = (o.delta.money ?? 0) < 0 && st.money + o.delta.money! < 0;
            return (
              <button key={o.id} className={`opt${st.plan[slotIndex] === o.id ? ' sel' : ''}${poor ? ' poor' : ''}`} onClick={() => choose(o)}>
                <Mono src={scheduleImage(o.id)} text={o.place[0]} />
                <div className="opt-tx">
                  <div><b>{o.name}</b> <span className="opt-place">{o.place}</span></div>
                  <p>{o.desc}</p>
                  <Chips chips={deltaChips(o.delta)} />
                  {o.who && <div className="opt-meet">{st.met[o.who] ? `${josa(CHARACTERS[o.who].name, '을/를')} 만날 수 있을지도` : '누군가와 마주칠지도…'}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
