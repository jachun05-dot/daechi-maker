/* 연애 표시 — 숫자 대신 하트 5칸 · 관계 단계 · 열쇠 · 알아낸 취향 (docs/romance/README.md) */
import type { CharId, GameState } from '@/engine/types';
import { CHARACTERS } from '@/content/characters';
import { ROMANCE } from '@/content/romance';
import { availableKeys, hearts, stageName } from '@/engine/romance';

const KIND: Record<string, string> = { stat: '좋아하는 모습', place: '좋아하는 곳', dislike: '싫어하는 것', gift: '선물' };

export function Hearts({ n, color }: { n: number; color?: string }) {
  return <span className="hearts" style={color ? { color } : undefined}>{[0, 1, 2, 3, 4].map(i => <i key={i} className={i < n ? 'on' : ''}>{i < n ? '♥' : '♡'}</i>)}</span>;
}

/** 열쇠 — 연 것 🔑 · 닫힌 것 ✕ · 아직 🔒. 이야기에 열쇠가 없는 인물은 안 보인다 */
export function KeyRow({ st, c }: { st: GameState; c: CharId }) {
  const keys = availableKeys(c), b = st.bond[c];
  if (!keys.length) return null;
  return (
    <span className="keys">
      {keys.map(k => <i key={k.id} className={b.keys.includes(k.id) ? 'on' : b.locked.includes(k.id) ? 'off' : ''}>{b.keys.includes(k.id) ? '🔑' : b.locked.includes(k.id) ? '✕' : '🔒'}</i>)}
    </span>
  );
}

/** 인연 목록 한 칸 오른쪽 — 단계 + 하트 */
export function BondBadge({ st, c }: { st: GameState; c: CharId }) {
  const b = st.bond[c];
  return (
    <div className="bond-badge">
      <em className={`stage s${b.stage}`}>{st.lover === c ? '연인' : stageName(b.stage)}</em>
      <Hearts n={hearts(st, c)} color={CHARACTERS[c].color} />
    </div>
  );
}

/** 도감 인물 페이지 — 열쇠 이름 · 알아낸 취향 · 데이트 기록 */
export function BondDetail({ st, c }: { st: GameState; c: CharId }) {
  const b = st.bond[c];
  const keys = availableKeys(c);
  const likes = ROMANCE[c].tastes.filter(t => b.likes.includes(t.id));
  const total = ROMANCE[c].tastes.length;
  const d = b.dates, dates = d.great + d.ok + d.fail;
  return (
    <div className="bond-detail">
      <div className="bd-row"><span>관계</span><b>{st.lover === c ? '연인' : stageName(b.stage)}</b><Hearts n={hearts(st, c)} color={CHARACTERS[c].color} /></div>
      {keys.length > 0 && (
        <div className="bd-keys">
          <span>속마음</span>
          <ul>{keys.map(k => <li key={k.id} className={b.keys.includes(k.id) ? 'on' : b.locked.includes(k.id) ? 'off' : ''}>
            {b.keys.includes(k.id) ? `🔑 ${k.title}` : b.locked.includes(k.id) ? '✕ 이번 생엔 닫혔다' : '🔒 ???'}
          </li>)}</ul>
        </div>
      )}
      <div className="bd-likes">
        <span>취향 {likes.length}/{total}</span>
        {likes.length ? <ul>{likes.map(t => <li key={t.id}><small>{KIND[t.kind]}</small> {t.label}</li>)}</ul> : <p>아직 잘 모른다. 같이 시간을 보내면 알게 된다.</p>}
      </div>
      {dates > 0 && <p className="bd-dates">데이트 {dates}번 · 대성공 {d.great} · 실수 {d.fail}</p>}
    </div>
  );
}
