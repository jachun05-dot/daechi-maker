/* 주말 서울 지도 — 누가 있는지는 보이지 않고, 메인 이벤트가 있는 곳에만 표시가 뜬다
   지도 이미지: src/assets/images/ui/map.png (없으면 구역별 목록) */
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { PLACES } from '@/content/places';
import { uiImage } from '@/engine/assets';
import { deltaChips } from '@/engine/chips';
import { Chips } from '../common/Chips';

export function MapOverlay() {
  const map = useUI(s => s.map);
  const { state: st, settings } = useGame();
  if (!map || !st) return null;
  const img = uiImage('map');
  const districts = [...new Set(PLACES.map(p => p.district))];
  return (
    <div className="layer mapv">
      <div className="map-h"><h2>{map.title}</h2><span>{map.sub}</span></div>
      <div className="map-ls">
        {img ? <img className="map-img" src={img} alt="서울 지도" /> : settings.showSlots && <div className="map-hint">ui/map.png</div>}
        <p className="map-legend"><span className="mk ev">!</span> 이벤트가 있다 · <span className="mk new">?</span> 아직 안 가 본 곳</p>
        {districts.map(d => (
          <section key={d} className="map-district">
            <h3>{d}</h3>
            <div className="map-grid">
              {PLACES.filter(p => p.district === d).map(p => {
                const ev = map.markers.includes(p.id), fresh = !map.visited.includes(p.id);
                const single = p.actions.length === 1;
                return (
                  <div key={p.id} className={`place${ev ? ' has-ev' : ''}`} role={single ? 'button' : undefined} onClick={single ? () => ui.mapPick({ place: p.id, action: 0 }) : undefined}>
                    <div className="place-h"><b>{p.name}</b>{ev && <span className="mk ev">!</span>}{fresh && <span className="mk new">?</span>}</div>
                    {p.actions.map((a, i) => single
                      ? <div key={i} className="place-act"><span>{a.label}</span><Chips chips={deltaChips(a.delta)} /></div>
                      : <button key={i} className="place-act btnlike" onClick={() => ui.mapPick({ place: p.id, action: i })}><span>{a.label}</span><Chips chips={deltaChips(a.delta)} /></button>)}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
