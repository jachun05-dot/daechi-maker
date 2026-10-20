import { toTitle } from '@/engine/newgame';

export function NeedGame() {
  return (
    <div className="card empty-card">
      <p className="muted">새로운 생을 시작하면 이용할 수 있어요.</p>
      <button className="btn primary" onClick={toTitle}>타이틀로</button>
    </div>
  );
}
