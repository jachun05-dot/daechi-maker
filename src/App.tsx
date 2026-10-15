import { useUI } from '@/store/ui';
import { useGame } from '@/store/game';
import { TURNS, SEASON_FX } from '@/content/calendar';
import { STORY_ERRORS } from '@/engine/story/library';
import { StatusBar, Dock } from './ui/Shell';
import { ScheduleTab } from './ui/tabs/ScheduleTab';
import { StatsTab } from './ui/tabs/StatsTab';
import { PhoneTab } from './ui/tabs/PhoneTab';
import { CodexTab } from './ui/tabs/CodexTab';
import { SystemTab } from './ui/tabs/SystemTab';
import { VNPlayer } from './ui/overlays/VNPlayer';
import { RunOverlay, Modal, Ink, Credits, Toast } from './ui/overlays/Overlays';
import { Title } from './ui/overlays/Title';
import { MapOverlay } from './ui/overlays/MapOverlay';
import { FxLayer } from './ui/common/FxLayer';
import { ChatNotice, ChatOverlay } from './ui/phone/Chat';

const TABS = { schedule: ScheduleTab, stats: StatsTab, phone: PhoneTab, codex: CodexTab, system: SystemTab };

export function App() {
  const { theme, tab, vn, titleOpen, run, map } = useUI();
  const { state: st } = useGame();
  const Tab = TABS[tab];
  const season = st ? SEASON_FX[TURNS[Math.min(st.turn, TURNS.length - 1)].season] : 'none';

  if (STORY_ERRORS.length) return (
    <div className="app story-errors" data-theme="day">
      <h2>스토리 파일에 오류가 있어요</h2>
      <p>아래 위치를 고친 뒤 저장하면 자동으로 다시 불러옵니다.</p>
      <ul>{STORY_ERRORS.map(e => <li key={e}>{e}</li>)}</ul>
    </div>
  );

  return (
    <div className="app" data-theme={theme}>
      <StatusBar />
      <main className="view" key={`${tab}-${st?.turn ?? 0}`}><Tab /></main>
      <Dock />
      {!vn && !titleOpen && !run && !map && <FxLayer type={season} density={0.45} />}
      <RunOverlay />
      <MapOverlay />
      <VNPlayer />
      <Title />
      <Credits />
      <Modal />
      <ChatOverlay />
      <ChatNotice />
      <Ink />
      <Toast />
    </div>
  );
}
