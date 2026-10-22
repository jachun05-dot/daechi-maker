/* 내 정보 탭 — 기초 능력 · 특기와 진로 · 인연 */
import { useGame } from '@/store/game';
import { ui } from '@/store/ui';
import { TURNS, SEASON_LABEL } from '@/content/calendar';
import { BASE_DESC, BASE_KEYS, BASE_LABEL, CAREERS, CAREER_ORDER, SKILL_LABEL } from '@/content/careers';
import { CHARACTERS, CHAR_ORDER } from '@/content/characters';
import { BALANCE } from '@/config/balance';
import { careerFit, growthMult } from '@/engine/timetable';
import { hpMax, refresh, clamp } from '@/engine/state';
import { avatarImage } from '@/engine/assets';
import { DREAMS, mainEventsOf } from '@/engine/story/library';
import { num } from '@/engine/chips';
import { josa } from '@/engine/story/context';
import type { CareerId } from '@/engine/types';
import { Mono } from '../common/Mono';
import { BondBadge, KeyRow } from '../common/Bond';
import { NeedGame } from '../common/NeedGame';

const grade = (v: number) => (BALANCE.grades.find(([max]) => v < max)?.[1] ?? 'S');

export function StatsTab() {
  const { state: st } = useGame();
  if (!st) return <NeedGame />;
  const T = TURNS[st.turn];

  const changeGoal = async (c: CareerId) => {
    if (!(await ui.confirm('꿈 바꾸기', `꿈을 ${josa(CAREERS[c].goal, '으로/로')} 바꿀까요?\n대가로 스트레스가 ${BALANCE.goalChangeStress} 오릅니다.`, '바꾼다'))) return;
    st.goal = c;
    st.stress = clamp(st.stress + BALANCE.goalChangeStress, 0, 100);
    refresh();
  };

  return (
    <div className="stack">
      <section className="card profile">
        <Mono text={st.name[0]} round size={56} />
        <div>
          <h2>{st.name}</h2>
          <p className="muted">이화고등학교 {T.year}학년 · {SEASON_LABEL[T.season]}<br />
            꿈 · <b>{st.goal ? CAREERS[st.goal].goal : '아직 찾는 중'}</b><br />
            전생 · {st.pastRole ? CAREERS[st.pastRole].past : '아직 드러나지 않았다'}</p>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><h3>기초 능력</h3><small>성장 효율 ×{growthMult(st).toFixed(1)}</small></div>
        {BASE_KEYS.map(k => (
          <div key={k} className="stat-row" title={BASE_DESC[k]}>
            <span>{BASE_LABEL[k]}</span>
            <div className="bar"><i style={{ width: `${Math.min(100, (st.stat[k] / BALANCE.statBarMax) * 100)}%` }} /></div>
            <b>{num(st.stat[k])}<em>{grade(st.stat[k])}</em></b>
          </div>
        ))}
        <p className="muted">최대 체력 {hpMax(st)} · 근력 {BALANCE.hpMax.fitPerHp}당 +1</p>
      </section>

      <section className="card">
        <div className="card-h"><h3>진로 · 특기</h3><small>엔딩 1순위 판정</small></div>
        {CAREER_ORDER.map(c => {
          const f = careerFit(st, c), req = BALANCE.careers[c];
          return (
            <div key={c} className="career">
              <div className="career-h">
                <b className={st.goal === c ? 'goal' : ''}>{CAREERS[c].short}{st.goal === c ? ' · 나의 꿈' : st.goalHint === c && !st.goal ? ' · 후보' : ''}</b>
                <div className="bar"><i style={{ width: `${Math.min(100, f * 100)}%` }} /></div>
                <span>{Math.floor(Math.min(1, f) * 100)}%</span>
              </div>
              <p className="muted">
                {CAREERS[c].skills.map(s => `${SKILL_LABEL[s]} ${num(st.skill[s])}`).join(' · ')}
                {' — 관문 '}{Object.entries(req).map(([k, v]) => `${(BASE_LABEL as Record<string, string>)[k] ?? (SKILL_LABEL as Record<string, string>)[k]} ${v}`).join(' · ')}
              </p>
              {st.goal && st.goal !== c && <button className="btn small" onClick={() => changeGoal(c)}>이 꿈으로 바꾸기</button>}
            </div>
          );
        })}
        <p className="muted">꿈은 2학년 11월 진로 상담에서 정해요. 엔딩에서는 정한 꿈의 마지막 관문을 넘었는지 먼저 봅니다.</p>
      </section>

      <section className="card">
        <div className="card-h"><h3>인연</h3><small>관계 · 속마음 · 전생 기억</small></div>
        {CHAR_ORDER.map(k => {
          const c = CHARACTERS[k];
          if (!st.met[k]) return (
            <div key={k} className="person dim"><Mono text="?" round /><div className="person-tx"><b>???</b><span>아직 만나지 못했다</span></div></div>
          );
          const total = DREAMS.filter(d => d.ch === k && !d.hidden).length;
          const seen = DREAMS.filter(d => d.ch === k && st.memories[d.id]).length;
          return (
            <div key={k} className="person">
              <Mono src={avatarImage(k)} text={c.hanja[0]} color={c.color} round />
              <div className="person-tx">
                <b>{c.name}</b><span>{c.role}{c.romanceable ? '' : ' · 공략 불가'}</span>
                <span>이야기 {st.mainStep[k]}/{mainEventsOf(k).length} · 전생 기억 {Math.min(seen, total)}/{total} <KeyRow st={st} c={k} /></span>
              </div>
              <BondBadge st={st} c={k} />
            </div>
          );
        })}
      </section>
    </div>
  );
}
