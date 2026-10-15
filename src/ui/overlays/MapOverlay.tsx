/* 주말 계획판 — 서울 지도 위 핀을 눌러 토·일 × (낮·저녁) 4칸을 채우고 출발
   - 누가 있는지는 보이지 않는다. 메인 이벤트가 있는 곳엔 "!", 장소를 누르면 흔적 한 줄
   - 약속 연락: 수락하면 그 칸이 약속으로 고정 (같은 시간 두 약속은 하나만)
   - 핀 위치: content/places.ts 의 pos [가로 %, 세로 %]
   - 지도 이미지: src/assets/images/ui/map.png (4:5 비율 권장). 없으면 아래 SeoulMap 그림이 나온다 */
import { useEffect, useMemo, useState } from 'react';
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { placeById, type Place } from '@/content/places';
import { CHARACTERS } from '@/content/characters';
import { WEATHER_ICON, WEATHER_LABEL } from '@/content/weekend';
import { uiImage, avatarImage } from '@/engine/assets';
import { deltaChips, won } from '@/engine/chips';
import { hpMax } from '@/engine/state';
import type { GameState } from '@/engine/types';
import { actionsOf, recommendPlan, regularLevel, scaledDelta, slotLabel, travelCost, DAY_NAMES, SLOT_NAMES, type Plan, type WeekendSpec } from '@/engine/weekend';
import { Chips } from '../common/Chips';
import { Mono } from '../common/Mono';

const SEASON_MARK: Record<number, string> = { 4: '🌸', 10: '🎆', 12: '⛸' };

export function MapOverlay() {
  const map = useUI(s => s.map);
  const { state: st } = useGame();
  if (!map || !st) return null;
  return <Planner key={map.title} spec={map} st={st} />;
}

function Planner({ spec, st }: { spec: WeekendSpec; st: GameState }) {
  const { settings } = useGame();
  const [plan, setPlan] = useState<Plan>(() => [null, null, null, null]);
  const [accepted, setAccepted] = useState<string[]>([]);
  const [declined, setDeclined] = useState<string[]>([]);
  const [active, setActive] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const img = uiImage('map');

  const promiseAt = (i: number) => spec.invites.find(v => v.slot === i && accepted.includes(v.id));
  const nextEmpty = (p: Plan, from = 0) => { for (let k = 0; k < 4; k++) { const i = (from + k) % 4; if (!p[i] && !promiseAt(i)) return i; } return -1; };
  useEffect(() => { setActive(a => (plan[a] ? Math.max(0, nextEmpty(plan, a)) : a)); }, [plan]); // eslint-disable-line react-hooks/exhaustive-deps

  /** 칸 i 를 비운다 (하루 종일 일정이면 짝 칸도) */
  const clearAt = (p: Plan, i: number) => {
    const cur = p[i];
    if (!cur) return;
    if (cur.cont) p[i - 1] = null;
    else if (placeById(cur.place)!.actions[cur.action]?.long) p[i + 1] = null;
    p[i] = null;
  };
  const put = (i: number, place: string, action: number, invite?: string) => {
    const p = [...plan];
    clearAt(p, i);
    p[i] = { place, action, invite };
    if (placeById(place)!.actions[action].long) { clearAt(p, i + 1); p[i + 1] = { place, action, cont: true }; }
    setPlan(p);
    return p;
  };

  const accept = (id: string) => {
    const v = spec.invites.find(x => x.id === id)!;
    const pl = placeById(v.place)!;
    const act = actionsOf(st, pl, spec.month).find(x => !x.locked && !x.a.long) ?? actionsOf(st, pl, spec.month)[0];
    put(v.slot, v.place, act.i, id);
    setAccepted(a => [...a.filter(x => x !== v.clash), id]);
    setDeclined(d => d.filter(x => x !== id));
  };
  const unaccept = (id: string) => {
    const v = spec.invites.find(x => x.id === id)!;
    const p = [...plan]; clearAt(p, v.slot); setPlan(p);
    setAccepted(a => a.filter(x => x !== id));
  };

  const tapSlot = (i: number) => {
    if (promiseAt(i)) { ui.toast('약속한 시간이야. 위의 연락에서 취소할 수 있어.'); return; }
    if (plan[i]) { const p = [...plan]; clearAt(p, i); setPlan(p); setActive(plan[i]!.cont ? i - 1 : i); return; }
    setActive(i);
  };

  const cost = useMemo(() => travelCost(plan), [plan]);
  const planned = new Set(plan.filter(Boolean).map(p => p!.place));
  const promisePlaces = new Set(spec.invites.filter(v => accepted.includes(v.id)).map(v => v.place));
  const place = sel ? placeById(sel) : undefined;
  const pending = spec.invites;

  return (
    <div className="layer mapv">
      <div className="map-h">
        <div><h2>{spec.title}</h2><span>{spec.sub}</span></div>
        <div className="map-stat">
          <span>체력 <b>{Math.round(st.hp)}</b>/{hpMax(st)}</span>
          <span>스트레스 <b>{Math.round(st.stress)}</b></span>
          <span className="money">{won(st.money)}</span>
        </div>
      </div>

      {pending.length > 0 && (
        <div className="wk-inv">
          {pending.map(v => {
            const C = CHARACTERS[v.c], on = accepted.includes(v.id), off = declined.includes(v.id);
            const blocked = !on && !!v.clash && accepted.includes(v.clash);
            return (
              <div key={v.id} className={`inv${on ? ' on' : ''}${off || blocked ? ' off' : ''}`}>
                <Mono src={avatarImage(v.c)} text={C.hanja[0]} color={C.color} round />
                <div className="inv-tx">
                  <b>{C.name}<small> · {slotLabel(v.slot)} · {placeById(v.place)!.name}</small></b>
                  <p>{v.text}</p>
                  {v.clash && <em>같은 시간에 다른 약속 제안이 있다</em>}
                </div>
                <div className="inv-b">
                  {on ? <button className="dec" onClick={() => unaccept(v.id)}>취소</button>
                    : <>
                      <button className="dec" disabled={off} onClick={() => setDeclined(d => [...d, v.id])}>{off ? '거절함' : '거절'}</button>
                      <button className="acc" onClick={() => accept(v.id)}>{blocked ? '이쪽으로' : '수락'}</button>
                    </>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="map-stage">
        <div className="map-board" onClick={() => setSel(null)}>
          {img ? <img className="map-img" src={img} alt="서울 지도" draggable={false} /> : <SeoulMap />}
          {!img && settings.showSlots && <span className="map-slot">ui/map.png</span>}
          {spec.visible.map(id => {
            const p = placeById(id)!;
            const ev = spec.markers.includes(id), fresh = !spec.visited.includes(id), pr = promisePlaces.has(id);
            const lv = regularLevel(st, id);
            const season = p.open?.months ? SEASON_MARK[spec.month] ?? '' : '';
            const glyph = pr ? '⏰' : ev ? '!' : id === 'home' ? '⌂' : season;
            return (
              <button key={id} data-place={id}
                className={`pin${ev ? ' has-ev' : ''}${pr ? ' promise' : ''}${sel === id ? ' on' : ''}${id === 'home' ? ' home' : ''}${planned.has(id) ? ' planned' : ''}${glyph ? ' glyph' : ''}`}
                style={{ left: `${p.pos[0]}%`, top: `${p.pos[1]}%` }}
                onClick={e => { e.stopPropagation(); setSel(id); }}>
                <span className="pin-dot">{glyph && <i>{glyph}</i>}</span>
                {fresh && !ev && !pr && <span className="pin-new">?</span>}
                {lv > 1 && <span className="pin-lv">★{lv}</span>}
                <span className="pin-name">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="wk-plan">
        {[0, 1].map(day => (
          <div key={day} className="wk-day">
            <span className="wk-dl"><b>{DAY_NAMES[day][0]}</b><small title={WEATHER_LABEL[spec.weather[day]]}>{WEATHER_ICON[spec.weather[day]]}</small></span>
            {[0, 1].map(s => {
              const i = day * 2 + s, pk = plan[i], pr = promiseAt(i);
              const pl = pk && placeById(pk.place)!;
              return (
                <button key={s} className={`wk-slot${active === i && !pk && !pr ? ' act' : ''}${pk ? ' full' : ''}${pr ? ' pr' : ''}${pk?.cont ? ' cont' : ''}`} onClick={() => tapSlot(i)}>
                  <small>{SLOT_NAMES[s]}</small>
                  {pk ? <b>{pr ? `⏰ ${CHARACTERS[pr.c].name}` : pk.cont ? '〃 하루 종일' : pl!.name}</b> : <b className="empty">{active === i ? '장소를 누르세요' : '비어 있음'}</b>}
                  {pk && !pk.cont && <em>{pr ? pl!.name : pl!.actions[pk.action].label}</em>}
                </button>
              );
            })}
          </div>
        ))}
        <div className="wk-foot">
          <span>{cost.moves ? `이동 ${cost.moves}번 · 교통비 ${won(cost.money)} · 체력 ${cost.hp}` : '이동 없음'}{plan.some(p => !p) ? ' · 빈 칸은 집에서 쉰다' : ''}</span>
          <div className="wk-btns">
            <button className="btn" onClick={() => setPlan(recommendPlan(st, spec, plan))}>추천으로 채우기</button>
            <button className="btn primary" onClick={() => ui.planDone({ plan, accepted })}>출발</button>
          </div>
        </div>
      </div>

      {place && <PlaceSheet st={st} spec={spec} place={place} active={active} plan={plan} promiseAt={promiseAt}
        onClose={() => setSel(null)} onPut={(ai) => { put(active, place.id, ai); setSel(null); }} />}
    </div>
  );
}

function PlaceSheet({ st, spec, place, active, plan, promiseAt, onClose, onPut }: {
  st: GameState; spec: WeekendSpec; place: Place; active: number; plan: Plan;
  promiseAt: (i: number) => unknown; onClose: () => void; onPut: (action: number) => void;
}) {
  const lv = regularLevel(st, place.id);
  const visits = st.placeVisits[place.id] ?? 0;
  const traces = spec.traces[place.id] ?? [];
  const w = spec.weather[active >> 1];
  const bad = place.outdoor && (w === 'rain' || w === 'snow');
  const full = active < 0 || !!plan[active] || !!promiseAt(active);
  return (
    <div className="map-sheet" key={place.id}>
      <div className="map-sheet-h">
        <div><small>{place.district}{place.hint ? ` · ${place.hint}` : ''}</small><b>{place.name}</b>
          <span className="lv">{'★'.repeat(lv)}{'☆'.repeat(3 - lv)} 단골 Lv.{lv} · {visits}번 와 봄</span></div>
        <button className="x" onClick={onClose} aria-label="닫기">✕</button>
      </div>
      {spec.markers.includes(place.id) && <p className="map-sheet-ev">이번 주말, 이곳에서 무슨 일이 생길 것 같다.</p>}
      {traces.length > 0 && <div className="map-trace">{traces.map((t, i) => <p key={i}>👣 {t}</p>)}</div>}
      {bad && <p className="map-sheet-warn">{WEATHER_ICON[w]} {DAY_NAMES[active >> 1]}엔 {WEATHER_LABEL[w]} 소식. 야외라 효율이 떨어진다.</p>}
      <div className="map-acts">
        {actionsOf(st, place, spec.month).map(({ a, i, locked }) => {
          const longBad = a.long && ((active & 1) === 1 || !!promiseAt(active + 1));
          const why = locked ?? (full ? '먼저 아래에서 빈 칸을 고르세요' : longBad ? '하루 종일 일정은 낮 칸에서, 저녁이 비어 있을 때만' : null);
          return (
            <button key={i} className="map-go" disabled={!!why} onClick={() => onPut(i)}>
              <span className="map-go-l">
                <b>{a.label}{a.long && <small className="tag">하루 종일</small>}</b>
                {locked ? <small className="muted">{locked}</small> : <Chips chips={deltaChips(scaledDelta(a))} />}
                {!locked && why && <small className="muted">{why}</small>}
              </span>
              <span className="map-go-r">{full ? '—' : slotLabel(active).replace(' ', '\n')}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* 이미지가 없을 때의 기본 그림 지도 (viewBox 100×125 = 4:5) */
function SeoulMap() {
  return (
    <svg className="map-svg" viewBox="0 0 100 125" preserveAspectRatio="none" aria-hidden>
      <rect width="100" height="125" className="m-land" />
      {/* 산 */}
      <path className="m-green" d="M28 0 Q38 9 50 5 Q60 0 70 6 Q78 10 88 2 L88 0 Z" />
      <path className="m-green" d="M0 18 Q8 12 14 20 Q10 28 0 28 Z" />
      <ellipse className="m-green" cx="49" cy="55" rx="7" ry="4.5" />
      <path className="m-green" d="M66 112 Q76 104 90 110 Q96 116 100 114 L100 125 L62 125 Z" />
      {/* 큰길 */}
      <path className="m-road" d="M0 36 L100 34" />
      <path className="m-road" d="M44 0 L44 70" />
      <path className="m-road" d="M70 74 L72 125" />
      <path className="m-road" d="M52 96 L100 92" />
      <path className="m-road thin" d="M30 26 L88 24" />
      <path className="m-road thin" d="M8 52 Q30 50 46 58" />
      {/* 한강 */}
      <path className="m-river-edge" d="M-2 69 Q14 70 28 79 Q42 86 57 80 Q70 74 84 71 Q94 68 102 61" />
      <path className="m-river" d="M-2 69 Q14 70 28 79 Q42 86 57 80 Q70 74 84 71 Q94 68 102 61" />
      {/* 다리 */}
      {[[20, 71, 23, 80], [36, 78, 37, 88], [50, 79, 51, 88], [64, 73, 66, 82], [80, 68, 82, 77]].map(([x1, y1, x2, y2], i) => (
        <line key={i} className="m-bridge" x1={x1} y1={y1} x2={x2} y2={y2} />
      ))}
      {/* 남산타워 */}
      <line className="m-tower" x1="49" y1="51" x2="49" y2="55" />
      <circle className="m-tower-top" cx="49" cy="50.6" r=".9" />
      {/* 구역 이름 */}
      <text className="m-label" x="10" y="36">마포</text>
      <text className="m-label" x="56" y="10">종로</text>
      <text className="m-label" x="20" y="64">용산</text>
      <text className="m-label" x="40" y="103">강남</text>
      <text className="m-river-label" x="8" y="76">한강</text>
      {/* 방위 */}
      <g className="m-compass" transform="translate(92 9)">
        <circle r="4.2" />
        <path d="M0 -3.2 L1.3 0 L0 -0.6 L-1.3 0 Z" />
        <text y="-5.6">N</text>
      </g>
    </svg>
  );
}
