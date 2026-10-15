/* 타이틀 화면 — 배경 이미지: src/assets/images/ui/title.jpg */
import { useUI, ui } from '@/store/ui';
import { useGame } from '@/store/game';
import { saves } from '@/engine/state';
import { loadGame, newGame } from '@/engine/newgame';
import { uiImage } from '@/engine/assets';
import { FxLayer } from '../common/FxLayer';

export function Title() {
  const open = useUI(s => s.titleOpen);
  const { settings } = useGame();
  if (!open) return null;
  const auto = saves.readAuto();
  const bg = uiImage('title');
  const start = async () => {
    if (auto && !(await ui.confirm('새로운 생', '진행 중인 생이 있어요. 처음부터 다시 시작할까요?\n(전생 도감과 엔딩은 유지됩니다)', '시작'))) return;
    newGame();
  };
  return (
    <div className="layer title" style={bg ? { backgroundImage: `url("${bg}")` } : undefined}>
      {!bg && settings.showSlots && <span className="title-hint">ui/title.jpg</span>}
      <FxLayer type="petal" />
      <div className="title-moon" />
      <div className="title-words">
        <div className="k">大峙洞 還生錄</div>
        <h1>이화<small>梨花</small>에 지는 달</h1>
        <h2>대치동 환생록</h2>
      </div>
      <div className="title-menu">
        <button onClick={start}>새로운 생</button>
        <button disabled={!auto} onClick={() => auto && loadGame(auto)}>이어서 살아가기</button>
        <button onClick={() => useUI.setState({ titleOpen: false, tab: 'codex' })}>전생의 기억 도감</button>
      </div>
      <div className="title-ver">壬辰 · v2.0</div>
    </div>
  );
}
