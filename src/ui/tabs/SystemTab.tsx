/* 시스템 탭 — 저장/불러오기 · 설정 */
import { useGame } from '@/store/game';
import { ui } from '@/store/ui';
import { TURNS } from '@/content/calendar';
import { game, refresh, saves } from '@/engine/state';
import { loadGame, newGame, toTitle } from '@/engine/newgame';
import type { GameState, Settings } from '@/engine/types';

const info = (d: GameState | null) => d
  ? `${d.name} · ${TURNS[Math.min(d.turn, TURNS.length - 1)].label} · ${new Date(d.savedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
  : '비어 있음';

export function SystemTab() {
  const { state: st, settings } = useGame();
  const setSetting = <K extends keyof Settings>(k: K, v: Settings[K]) => { game.settings[k] = v; saves.saveSettings(); refresh(); };
  const load = async (d: GameState | null) => { if (d && await ui.confirm('불러오기', '지금 진행 상황 대신 이 기록을 불러올까요?', '불러오기')) loadGame(d); };

  return (
    <div className="stack">
      {st && (
        <section className="card">
          <div className="card-h"><h3>저장 · 불러오기</h3><small>매 턴 자동 저장</small></div>
          <div className="sys-row"><div><b>자동 저장</b><span>{info(saves.readAuto())}</span></div><button className="btn small" onClick={() => load(saves.readAuto())}>불러오기</button></div>
          {[1, 2, 3].map(i => {
            const d = saves.readSlot(i);
            return (
              <div key={i} className="sys-row">
                <div><b>슬롯 {i}</b><span>{info(d)}</span></div>
                <button className="btn small primary" onClick={() => { ui.toast(saves.writeSlot(i) ? `슬롯 ${i}에 저장했어요` : '저장 공간이 부족해 저장하지 못했어요'); refresh(); }}>저장</button>
                <button className="btn small" disabled={!d} onClick={() => load(d)}>불러오기</button>
              </div>
            );
          })}
        </section>
      )}

      <section className="card">
        <div className="card-h"><h3>설정</h3></div>
        <div className="sys-row"><div><b>텍스트 속도</b></div>
          <div className="seg">{(['느림', '보통', '빠름'] as const).map((t, i) => <button key={t} className={settings.textSpeed === i ? 'on' : ''} onClick={() => setSetting('textSpeed', i as Settings['textSpeed'])}>{t}</button>)}</div>
        </div>
        <div className="sys-row"><div><b>파티클 연출</b></div>
          <div className="seg"><button className={settings.fx ? 'on' : ''} onClick={() => setSetting('fx', true)}>켜기</button><button className={!settings.fx ? 'on' : ''} onClick={() => setSetting('fx', false)}>끄기</button></div>
        </div>
        <div className="sys-row"><div><b>이미지 자리 표시</b><span>비어 있는 이미지 칸에 파일 이름을 보여줍니다</span></div>
          <div className="seg"><button className={settings.showSlots ? 'on' : ''} onClick={() => setSetting('showSlots', true)}>켜기</button><button className={!settings.showSlots ? 'on' : ''} onClick={() => setSetting('showSlots', false)}>끄기</button></div>
        </div>
      </section>

      <section className="card">
        <div className="card-h"><h3>게임</h3></div>
        <div className="sys-row"><div><b>타이틀로 돌아가기</b><span>진행 상황은 자동 저장되어 있어요</span></div><button className="btn small" onClick={toTitle}>이동</button></div>
        <div className="sys-row"><div><b>새로운 생 시작</b><span>전생 도감과 엔딩은 유지됩니다</span></div>
          <button className="btn small" onClick={async () => { if (await ui.confirm('새로운 생', '지금의 생을 끝내고 처음부터 시작할까요?', '시작')) newGame(); }}>시작</button></div>
        <div className="sys-row"><div><b className="danger">모든 기록 삭제</b><span>세이브 · 도감 · 엔딩 전부</span></div>
          <button className="btn small" onClick={async () => { if (await ui.confirm('모든 기록 삭제', '세이브, 전생 도감, 엔딩 컬렉션이 모두 삭제됩니다. 되돌릴 수 없어요.', '삭제')) { saves.wipeAll(); refresh(); toTitle(); ui.toast('모든 기록을 삭제했어요'); } }}>삭제</button></div>
      </section>
    </div>
  );
}
