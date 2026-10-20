/* 상태바 · 하단 독 */
import { useGame } from '@/store/game';
import { useUI, ui, type Tab } from '@/store/ui';
import { TURNS, SEASON_LABEL } from '@/content/calendar';
import { hpMax } from '@/engine/state';
import { won } from '@/engine/chips';
import { Icon } from './common/Icon';

export function StatusBar() {
  const { state: st } = useGame();
  if (!st) return (
    <header className="status"><div className="when"><b>전생 도감</b><span>회차를 넘어 남는 기록</span></div></header>
  );
  const T = TURNS[Math.min(st.turn, TURNS.length - 1)], max = hpMax(st);
  return (
    <header className="status">
      <div className="when"><b>{T.label}</b><span>{SEASON_LABEL[T.season]} · {T.title}</span></div>
      <div className="meter"><div className="lb"><span>체력</span><b>{Math.round(st.hp)}/{max}</b></div><div className="bar"><i style={{ width: `${(st.hp / max) * 100}%` }} /></div></div>
      <div className="meter"><div className="lb"><span>스트레스</span><b>{Math.round(st.stress)}</b></div><div className="bar stress"><i style={{ width: `${st.stress}%` }} /></div></div>
      <div className="cash"><b>{won(st.money)}</b><span>용돈</span></div>
    </header>
  );
}

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'schedule', label: '스케줄', icon: 'calendar' },
  { id: 'stats', label: '내 정보', icon: 'profile' },
  { id: 'phone', label: '스마트폰', icon: 'phone' },
  { id: 'codex', label: '전생 도감', icon: 'scroll' },
  { id: 'system', label: '시스템', icon: 'settings' },
];

export function Dock() {
  const { state: st } = useGame();
  const tab = useUI(s => s.tab);
  const unread = st ? Object.values(st.unread).reduce((a, b) => a + b, 0) : 0;
  const badges: Partial<Record<Tab, string>> = { phone: unread ? String(unread) : '', codex: st?.newMemory ? 'N' : '' };
  return (
    <nav className="dock">
      {TABS.map(t => (
        <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => {
          if (t.id === 'phone' && tab === 'phone') useUI.setState({ phoneRoom: null });
          if (t.id === 'codex' && st) st.newMemory = false;
          ui.setTab(t.id);
        }}>
          <Icon name={t.icon} />{t.label}
          {badges[t.id] ? <span className="badge">{badges[t.id]}</span> : null}
        </button>
      ))}
    </nav>
  );
}
