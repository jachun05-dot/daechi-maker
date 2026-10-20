/* =========================================================
   앱(안드로이드/iOS)에서만 쓰는 연결부. 웹에서는 아무것도 하지 않는다.
   - 뒤로 가기: 열린 화면을 하나씩 닫고, 첫 화면에서는 두 번 눌러야 종료
   ========================================================= */
import { Capacitor } from '@capacitor/core';
import { saves } from '@/engine/state';
import { ui, useUI } from '@/store/ui';

export async function initNative() {
  if (!Capacitor.isNativePlatform()) return;
  const { App } = await import('@capacitor/app');
  let armed = 0;
  App.addListener('backButton', () => {
    const s = useUI.getState();
    if (s.chatRoom) return ui.closeChat();
    if (s.phoneRoom) return useUI.setState({ phoneRoom: null });
    if (s.sheetSlot !== null) return useUI.setState({ sheetSlot: null });
    // 장면·선택지·진행 화면은 엔진이 답을 기다리는 중이라 뒤로 가기로 닫지 않는다
    if (s.vn || s.modal || s.map || s.run || s.ink || s.credits || s.notice) return;
    if (!s.titleOpen && s.tab !== 'schedule') return ui.setTab('schedule');
    if (Date.now() - armed < 2000) { saves.autosave(); void App.exitApp(); return; }
    armed = Date.now();
    ui.toast('한 번 더 누르면 종료돼요');
  });
  App.addListener('pause', () => saves.autosave());
}
