/* 전생 도감 — 회차를 넘어 보존되는 기억 · 엔딩 · 인물 */
import { useState } from 'react';
import { useGame } from '@/store/game';
import { useUI, ui } from '@/store/ui';
import { SCENES } from '@/engine/story/library';
import { PHOTOS } from '@/engine/phone';
import { photoImage } from '@/engine/assets';
import type { CharId } from '@/engine/types';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { ENDINGS } from '@/content/endings';
import { DREAMS, type Dream } from '@/engine/story/library';
import { dreamSequence } from '@/engine/month';
import { avatarImage, cgImage } from '@/engine/assets';
import { Mono } from '../common/Mono';
import { Icon } from '../common/Icon';

export function CodexTab() {
  const { state: st, meta } = useGame();
  const seg = useUI(s => s.codexSeg);
  const setSeg = (codexSeg: typeof seg) => useUI.setState({ codexSeg });

  const groups: [string, string][] = [['self', '나 (주인공)'], ...CHAR_ORDER.map(k => [k, `${CHARACTERS[k].name} · ${CHARACTERS[k].past}`] as [string, string])];
  const memCard = (d: Dream) => {
    if (meta.memories[d.id]) return (
      <button key={d.id} className="mem" onClick={() => dreamSequence(d, true)}>
        {cgImage(d.id) && <img src={cgImage(d.id)} alt="" />}
        <span className="mem-ep">{d.hidden ? '히든 · ' : ''}제{d.ep}장</span><b>{d.title}</b>
      </button>
    );
    const cond = d.auto ? '이야기 진행' : d.hidden ? '숨겨진 기억' : `호감 ${d.aff} · 감응 ${d.spirit}`;
    return <div key={d.id} className="mem locked"><Icon name="lock" size={16} /><span className="mem-ep">제{d.ep}장</span><b>???</b><span className="mem-ep">{cond}</span></div>;
  };

  return (
    <div className="stack">
      <div className="seg">
        <button className={seg === 'memories' ? 'on' : ''} onClick={() => setSeg('memories')}>기억 조각</button>
        <button className={seg === 'album' ? 'on' : ''} onClick={() => setSeg('album')}>앨범</button>
        <button className={seg === 'endings' ? 'on' : ''} onClick={() => setSeg('endings')}>엔딩</button>
        <button className={seg === 'people' ? 'on' : ''} onClick={() => setSeg('people')}>인물</button>
      </div>

      {seg === 'memories' && <>
        <p className="muted">해금한 기억 {DREAMS.filter(d => meta.memories[d.id]).length}/{DREAMS.length} · 해금된 기억은 눌러서 다시 꿈꿀 수 있어요. 이미지: <code>cg/장면id</code></p>
        {groups.map(([k, label]) => (
          <section key={k} className="card">
            <div className="card-h"><h3>{label}</h3></div>
            <div className="mem-grid">{DREAMS.filter(d => d.ch === k).map(memCard)}</div>
          </section>
        ))}
      </>}

      {seg === 'album' && <Album />}

      {seg === 'endings' && (
        <section className="card">
          <div className="card-h"><h3>엔딩 컬렉션</h3><small>{ENDINGS.filter(e => meta.endings[e.id]).length}/{ENDINGS.length}</small></div>
          {ENDINGS.map(e => (
            <div key={e.id} className={`ending-row${meta.endings[e.id] ? '' : ' locked'}`}>
              <b>{meta.endings[e.id] ? e.title : '??????'}</b><span>{e.kind}</span>
            </div>
          ))}
          <p className="muted">플레이 {meta.plays}회 · 완주 {meta.clears}회</p>
        </section>
      )}

      {seg === 'people' && CHAR_ORDER.map(k => {
        const c = CHARACTERS[k];
        const known = !!st?.met[k] || !!meta.memories[`${k}1`] || Object.keys(meta.endings).some(e => e.endsWith(`_${k}`));
        const pastKnown = !!meta.memories[`${k}1`];
        return (
          <section key={k} className="card person-card">
            <div className="person">
              <Mono src={known ? avatarImage(k) : undefined} text={known ? c.hanja[0] : '?'} color={known ? c.color : undefined} round size={48} />
              <div className="person-tx"><b>{known ? `${c.name} ${c.hanja}` : '???'}</b><span>{known ? c.role : '아직 만나지 못했다'}</span></div>
            </div>
            {known && <p className="muted">{c.desc}</p>}
            <p className="muted">{pastKnown ? <><b>전생 · {c.past}({c.pastHanja})</b> — {c.pastRole}<br />{c.pastDesc}</> : '전생 · 기억이 아직 깨어나지 않았다.'}</p>
            {known && <p className="muted">자주 보이는 곳 · {st?.sightings[k]?.length ? st.sightings[k]!.join(', ') : '아직 모른다'}</p>}
          </section>
        );
      })}
    </div>
  );
}

/* ---------- 앨범 — 인물마다 함께한 장면(다시보기)과 받은 사진. 회차를 넘어 남는다 ---------- */
const sceneTitle = (id: string) => {
  const s = SCENES[id];
  if (s?.attrs.title) return s.attrs.title;
  const [kind, , n] = id.split('.');
  return kind === 'main' ? `이야기 ${n}` : id;
};
function albumScenes(c: CharId) {
  const ids = Object.keys(SCENES);
  const main = ids.filter(id => id.startsWith(`main.${c}.`)).sort((a, b) => Number(a.split('.')[2]) - Number(b.split('.')[2]));
  const vac = ids.filter(id => id.startsWith(`vac.${c}.`));
  const weather = ids.filter(id => id.startsWith(`weather.${c}.`));
  return [...main.map(id => ({ id, kind: '이야기' })), ...vac.map(id => ({ id, kind: '방학' })), ...weather.map(id => ({ id, kind: '날씨' }))];
}

function Album() {
  const { meta, state: st } = useGame();
  const busy = useUI(s => s.busy);
  const [photo, setPhoto] = useState<string | null>(null);
  const replay = async (id: string) => {
    if (busy) return;
    ui.setBusy(true);
    await ui.playScene(id, { theme: 'day', replay: true });
    ui.setTheme('day');
    ui.setBusy(false);
  };
  const shown = PHOTOS.find(p => p.id === photo);
  const total = Object.keys(meta.album).length;
  return (
    <>
      <p className="muted">함께한 장면은 눌러서 다시 볼 수 있고, 톡으로 받은 사진이 모여요. 다음 생에도 남습니다. ({total}개) · 사진 이미지: <code>photo/사진id</code></p>
      {CHAR_ORDER.map(c => {
        const scenes = albumScenes(c), photos = PHOTOS.filter(p => p.room === c);
        const got = scenes.filter(x => meta.album[`scene:${x.id}`]).length + photos.filter(p => meta.album[`photo:${p.id}`]).length;
        const known = got > 0 || !!st?.met[c];
        if (!known) return null;
        const C = CHARACTERS[c];
        return (
          <section key={c} className="card album">
            <div className="card-h"><h3><Mono src={avatarImage(c)} text={C.hanja[0]} color={C.color} round size={24} /> {C.name}</h3><small>{got}/{scenes.length + photos.length}</small></div>
            {photos.length > 0 && (
              <div className="album-photos">
                {photos.map(p => meta.album[`photo:${p.id}`]
                  ? <button key={p.id} className="aph" onClick={() => setPhoto(p.id)}>{photoImage(p.id) ? <img src={photoImage(p.id)} alt="" /> : <span>📷</span>}<small>{p.caption}</small></button>
                  : <div key={p.id} className="aph locked"><Icon name="lock" size={14} /></div>)}
              </div>
            )}
            <div className="album-scenes">
              {scenes.map(x => meta.album[`scene:${x.id}`]
                ? <button key={x.id} className="asc" onClick={() => replay(x.id)}><span>{x.kind}</span><b>{sceneTitle(x.id)}</b><i>▶</i></button>
                : <div key={x.id} className="asc locked"><span>{x.kind}</span><b>???</b></div>)}
            </div>
          </section>
        );
      })}
      {shown && (
        <div className="layer lightbox" onClick={() => setPhoto(null)}>
          <figure>
            {photoImage(shown.id) ? <img src={photoImage(shown.id)} alt="" /> : <div className="ph">📷</div>}
            <figcaption><b>{CHARACTERS[shown.room as CharId]?.name}</b> · {shown.caption}</figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
