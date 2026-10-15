/* 엔진이 game.state 를 바꾸고 refresh() 하면 이 카운터가 올라가 화면이 다시 그려진다 */
import { create } from 'zustand';
import { game, setChangeListener } from '@/engine/state';

const useVersion = create<{ v: number }>(() => ({ v: 0 }));
setChangeListener(() => useVersion.setState(s => ({ v: s.v + 1 })));

/** 컴포넌트에서 호출: 게임 상태가 바뀌면 리렌더 */
export function useGame() {
  useVersion(s => s.v);
  return game;
}
