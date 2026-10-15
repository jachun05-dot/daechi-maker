/* 내 정보 탭 — 스탯 · 진로 적합도 · 인연 */
import { useGame } from '@/store/game';
import { TURNS, SEASON_LABEL } from '@/content/calendar';
import { ROUTES, ROUTE_ORDER } from '@/content/routes';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { BALANCE } from '@/config/balance';
import { careerFit, growthMult, STAT_KEYS, STAT_LABEL } from '@/engine/schedule';
import { hpMax } from '@/engine/state';
import { avatarImage } from '@/engine/assets';
import { DREAMS } from '@/engine/story/library';
import { Mono } from '../common/Mono';
import { NeedGame } from '../common/NeedGame';

const grade = (v: number) => (BALANCE.grades.find(([max]) => v < max)?.[1] ?? 'S');

export function StatsTab() {
  const { state: st } = useGame();
  if (!st) return <NeedGame />;
  const T = TURNS[st.turn], G = ROUTES[st.goal], R = ROUTES[st.route];
  return (
    <div className="stack">
      <section className="card profile">
        <Mono text={st.name[0]} round size={56} />
        <div>
          <h2>{st.name}</h2>
          <p className="muted">이화고등학교 {T.year}학년 · {SEASON_LABEL[T.season]}<br />현생의 꿈 · <b>{G.goal}</b><br />전생 · {R.past}</p>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><h3>성장 스탯</h3><small>성장 효율 ×{growthMult(st).toFixed(1)}</small></div>
        {STAT_KEYS.map(k => (
          <div key={k} className="stat-row">
            <span>{STAT_LABEL[k]}</span>
            <div className="bar"><i style={{ width: `${Math.min(100, (st.stat[k] / BALANCE.statBarMax) * 100)}%` }} /></div>
            <b>{st.stat[k]}<em>{grade(st.stat[k])}</em></b>
          </div>
        ))}
        <p className="muted">최대 체력 {hpMax(st)} · 근력 {BALANCE.hpMax.fitPerHp}당 +1</p>
      </section>

      <section className="card">
        <div className="card-h"><h3>진로 적합도</h3><small>엔딩 1순위 판정</small></div>
        {ROUTE_ORDER.map(k => {
          const f = careerFit(st, k);
          return (
            <div key={k} className="stat-row">
              <span className={k === st.goal ? 'goal' : ''}>{ROUTES[k].goalShort}</span>
              <div className="bar"><i style={{ width: `${Math.min(100, f * 100)}%` }} /></div>
              <b>{Math.floor(Math.min(1, f) * 100)}%</b>
            </div>
          );
        })}
        <p className="muted">100%에 닿은 꿈이 엔딩에서 이루어집니다. 다른 꿈이 더 맞으면 11월 진로 상담에서 바꿀 수 있어요.</p>
      </section>

      <section className="card">
        <div className="card-h"><h3>인연</h3><small>호감도 · 전생 기억</small></div>
        {CHAR_ORDER.map(k => {
          const c = CHARACTERS[k];
          if (!st.met[k]) return (
            <div key={k} className="person dim"><Mono text="?" round /><div className="person-tx"><b>???</b><span>{c.where}</span></div></div>
          );
          const total = DREAMS.filter(d => d.ch === k && !d.hidden).length;
          const seen = DREAMS.filter(d => d.ch === k && st.memories[d.id]).length;
          return (
            <div key={k} className="person">
              <Mono src={avatarImage(k)} text={c.hanja[0]} color={c.color} round />
              <div className="person-tx"><b>{c.name}</b><span>{c.role}{c.romanceable ? '' : ' · 공략 불가'}</span><span>전생 기억 {Math.min(seen, total)}/{total}</span></div>
              <div className="aff"><div className="bar heart"><i style={{ width: `${st.aff[k]}%`, background: c.color }} /></div><b>{st.aff[k]}</b></div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
