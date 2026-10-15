/* 주말 서울 지도 — 지도 위 핀을 눌러 목적지를 고른다
   - 누가 있는지는 보이지 않는다. 메인 이벤트가 있는 곳에 "!" 만 뜬다
   - 핀 위치: content/places.ts 의 pos [가로 %, 세로 %]
   - 지도 이미지: src/assets/images/ui/map.png (4:5 비율 권장). 없으면 아래 SeoulMap 그림이 나온다 */
import { useState } from 'react';
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { PLACES, placeById } from '@/content/places';
import { uiImage } from '@/engine/assets';
import { deltaChips, won } from '@/engine/chips';
import { hpMax } from '@/engine/state';
import { Chips } from '../common/Chips';

export function MapOverlay() {
  const map = useUI(s => s.map);
  const { state: st, settings } = useGame();
  const [sel, setSel] = useState<string | null>(null);
  if (!map || !st) return null;
  const img = uiImage('map');
  const place = sel ? placeById(sel) : undefined;
  const go = (id: string, action: number) => { setSel(null); ui.mapPick({ place: id, action }); };

  return (
    <div className="layer mapv">
      <div className="map-h">
        <div><h2>{map.title}</h2><span>{map.sub}</span></div>
        <div className="map-stat">
          <span>체력 <b>{Math.round(st.hp)}</b>/{hpMax(st)}</span>
          <span>스트레스 <b>{Math.round(st.stress)}</b></span>
          <span className="money">{won(st.money)}</span>
        </div>
      </div>

      <div className="map-stage">
        <div className="map-board" onClick={() => setSel(null)}>
          {img ? <img className="map-img" src={img} alt="서울 지도" draggable={false} /> : <SeoulMap />}
          {!img && settings.showSlots && <span className="map-slot">ui/map.png</span>}
          {PLACES.map(p => {
            const ev = map.markers.includes(p.id), fresh = !map.visited.includes(p.id);
            return (
              <button key={p.id} data-place={p.id}
                className={`pin${ev ? ' has-ev' : ''}${sel === p.id ? ' on' : ''}${p.id === 'home' ? ' home' : ''}`}
                style={{ left: `${p.pos[0]}%`, top: `${p.pos[1]}%` }}
                onClick={e => { e.stopPropagation(); setSel(p.id); }}>
                <span className="pin-dot">{(ev || p.id === 'home') && <i>{ev ? '!' : '⌂'}</i>}</span>
                {fresh && !ev && <span className="pin-new">?</span>}
                <span className="pin-name">{p.name}</span>
              </button>
            );
          })}
        </div>
        <p className="map-legend"><span className="mk ev">!</span> 무슨 일이 있을 것 같은 곳 · <span className="mk new">?</span> 아직 안 가 본 곳</p>
      </div>

      {place && (
        <div className="map-sheet" key={place.id}>
          <div className="map-sheet-h">
            <div><small>{place.district}</small><b>{place.name}</b></div>
            <button className="x" onClick={() => setSel(null)} aria-label="닫기">✕</button>
          </div>
          {map.markers.includes(place.id) && <p className="map-sheet-ev">오늘은 이곳에서 무슨 일이 생길 것 같다.</p>}
          <div className="map-acts">
            {place.actions.map((a, i) => (
              <button key={i} className="map-go" onClick={() => go(place.id, i)}>
                <span className="map-go-l"><b>{a.label}</b><Chips chips={deltaChips(a.delta)} /></span>
                <span className="map-go-r">가기</span>
              </button>
            ))}
          </div>
        </div>
      )}
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
      <text className="m-label" x="8" y="108">강남</text>
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
