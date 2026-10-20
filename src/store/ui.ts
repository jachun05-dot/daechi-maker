/* =========================================================
   화면 상태 + 엔진이 호출하는 비동기 UI 함수들
   엔진은 `await ui.playScene(...)` 처럼 화면이 끝나기를 기다리며 진행한다.
   ========================================================= */
import { create } from 'zustand';
import type { StoryNode, Theme } from '@/engine/types';
import { ScenePlayer, type PlayOptions, type View } from '@/engine/story/player';
import { getScene } from '@/engine/story/library';
import { applyEffect, game, refresh, unlockAlbum } from '@/engine/state';
import type { WeekendResult, WeekendSpec } from '@/engine/weekend';

export type Tab = 'schedule' | 'stats' | 'phone' | 'codex' | 'system';
export interface Chip { label: string; tone: 'up' | 'down' | 'money' | 'heart' | 'plain' }
/* ---------- 평일 실시간 진행 (월~금이 하루씩) ---------- */
export type SlotState = 'wait' | 'great' | 'ok' | 'fail' | 'broke' | 'collapse' | 'empty' | 'skip';
export interface LiveSlot { id: string | null; name: string; cat: string; state: SlotState; line?: string; gains?: string[]; immerse?: boolean; club?: boolean }
export interface LiveDay {
  label: string; school: 'wait' | 'ok' | 'doze' | 'sleep'; slots: LiveSlot[]; tags: string[];
  event?: { icon: string; title: string; text: string; ok?: boolean };
}
export interface ChoiceView { icon: string; title: string; text: string; day: number; options: { label: string; hint: string }[] }
export interface LiveWeek { title: string; tag: string; days: LiveDay[]; cur: { day: number; slot: number } | null; choice: ChoiceView | null }

/** 주간 카드의 하루 */
export interface WeekDayView {
  label: string; school: 'ok' | 'doze' | 'sleep'; collapse: boolean; strain: boolean; met: string | null;
  slots: { name: string; state: 'ok' | 'great' | 'fail' | 'skip' | 'club' | 'broke' | 'collapse' | 'empty' }[];
}
/** 월말 성적표 */
export interface ReportView {
  title: string; verdict: string; verdictMark: string;
  bars: { label: string; from: number; to: number; grade?: string }[];
  res: { label: string; value: string; tone?: 'up' | 'down' | 'money' }[];
  highlights: string[];
  event: { title: string; result: string; chips: Chip[] } | null;
}
/** 진행 화면 한 줄. kind: week 주간 카드 · day 요일 구분선 · grade 이정표 · report 월말 성적표 */
export interface RunLog {
  id: number; title: string; tag?: string; body?: string; chips?: Chip[]; tone?: 'warn' | 'sum' | 'char'; mark?: string; color?: string; image?: string;
  kind?: 'week' | 'day' | 'grade' | 'report';
  week?: { days: WeekDayView[]; notes: string[] };
  report?: ReportView;
}
export interface ModalButton { label: string; value: unknown; primary?: boolean }
export interface ModalOption { label: string; desc?: string; value: unknown; chips?: Chip[]; disabled?: boolean }
/** area: 긴 글 칸 (백업 코드 등). readOnly 면 보여 주기만, 아니면 버튼을 누를 때 입력한 글이 value 로 돌아온다 */
export interface ModalSpec { title?: string; text?: string; letter?: string; input?: string; area?: { value?: string; placeholder?: string; readOnly?: boolean }; buttons: ModalButton[]; endings?: { title: string; kind: string }[]; options?: ModalOption[] }

interface UIState {
  theme: Theme;
  tab: Tab;
  titleOpen: boolean;
  busy: boolean;
  sheetSlot: number | null;
  phoneRoom: string | null;
  codexSeg: 'memories' | 'album' | 'endings' | 'people';
  vn: { player: ScenePlayer; view: View } | null;
  /** 진행 화면 — hidden: 장면을 보는 동안 잠깐 숨김 (기록은 그대로) */
  run: { title: string; sub: string; logs: RunLog[]; button: string | null; hidden?: boolean } | null;
  modal: ModalSpec | null;
  map: WeekendSpec | null;
  ink: { text: string; mode: Theme; on: boolean } | null;
  credits: boolean;
  toast: { text: string; key: number } | null;
  /** 메신저 — 상대가 입력 중인 방 */
  typing: string | null;
  /** 메신저 — 진행 중에 도착한 대화 알림 */
  notice: { room: string; name: string; time: string; text: string } | null;
  /** 메신저 — 진행 화면 위에 띄운 대화방 */
  chatRoom: string | null;
  /** 평일 실시간 진행 */
  week: LiveWeek | null;
  /** 진행 화면을 눌러 빨리 감는 중 */
  fast: boolean;
}

export const useUI = create<UIState>(() => ({
  theme: 'day', tab: 'schedule', titleOpen: true, busy: false, sheetSlot: null, phoneRoom: null, codexSeg: 'memories',
  vn: null, run: null, modal: null, map: null, ink: null, credits: false, toast: null, typing: null, notice: null, chatRoom: null, week: null, fast: false,
}));

const set = useUI.setState;
const get = useUI.getState;
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

let vnResolve: ((v: string | undefined) => void) | null = null;
let modalResolve: ((v: unknown) => void) | null = null;
let runResolve: (() => void) | null = null;
let creditsResolve: (() => void) | null = null;
let mapResolve: ((r: WeekendResult) => void) | null = null;
let noticeResolve: ((open: boolean) => void) | null = null;
let chatResolve: (() => void) | null = null;
let choiceResolve: ((i: number) => void) | null = null;
let logId = 0, toastTimer: ReturnType<typeof setTimeout> | undefined;

export const ui = {
  setTheme: (theme: Theme) => set({ theme }),
  setTab: (tab: Tab) => set({ tab }),
  setBusy: (busy: boolean) => set({ busy }),

  /* ---------- 비주얼 노벨 ---------- */
  playScene(scene: string | StoryNode[], opts: PlayOptions = {}): Promise<string | undefined> {
    const nodes = typeof scene === 'string' ? getScene(scene).nodes : scene;
    // 앨범 — 인물 이야기(메인·방학·날씨) 장면은 본 순간 앨범에 남아 다시 볼 수 있다
    if (typeof scene === 'string' && !opts.replay && /^(main|vac|weather)\./.test(scene)) unlockAlbum(`scene:${scene}`);
    const st = game.state;
    const ctx = { state: st, name: st?.name ?? (game.meta.lastName || '나'), vars: opts.vars ?? {} };
    const player = new ScenePlayer(nodes, ctx, opts, e => { if (game.state) { applyEffect(e); refresh(); } });
    set({ theme: opts.theme ?? 'day' });
    return new Promise(res => {
      vnResolve = res;
      const view = player.next();
      if (view.mode === 'done') { vnResolve = null; res(player.result); return; }
      set({ vn: { player, view } });
    });
  },
  vnAdvance() {
    const vn = get().vn;
    if (!vn || vn.view.mode === 'choice') return;
    ui.vnShow(vn.player.next());
  },
  vnChoose(i: number) {
    const vn = get().vn;
    if (vn) ui.vnShow(vn.player.choose(i));
  },
  vnShow(view: View) {
    const vn = get().vn!;
    if (view.mode === 'done') {
      set({ vn: null });
      const r = vnResolve; vnResolve = null; r?.(vn.player.result);
    } else set({ vn: { player: vn.player, view } });
  },

  /* ---------- 모달 ---------- */
  modal<T = unknown>(spec: ModalSpec): Promise<T> {
    set({ modal: spec });
    return new Promise(res => { modalResolve = res as (v: unknown) => void; });
  },
  closeModal(value: unknown) { set({ modal: null }); const r = modalResolve; modalResolve = null; r?.(value); },
  confirm: (title: string, text: string, ok = '확인') =>
    ui.modal<boolean>({ title, text, buttons: [{ label: '취소', value: false }, { label: ok, value: true, primary: true }] }),

  /* ---------- 암전 전환 ---------- */
  async inkIn(text: string, mode: Theme) {
    set({ ink: { text, mode, on: false } });
    await sleep(30);
    set({ ink: { text, mode, on: true } });
    await sleep(1600);
  },
  async inkOut() {
    const ink = get().ink;
    if (ink) set({ ink: { ...ink, on: false } });
    await sleep(900);
    set({ ink: null });
  },

  /* ---------- 주간 진행 화면 ---------- */
  runOpen(title: string, sub: string) { set({ run: { title, sub, logs: [], button: null } }); },
  runLog(log: Omit<RunLog, 'id'>) {
    const run = get().run;
    if (run) set({ run: { ...run, logs: [...run.logs, { ...log, id: ++logId }] } });
  },
  runWait(label: string): Promise<void> {
    const run = get().run;
    if (run) set({ run: { ...run, button: label } });
    return new Promise(res => { runResolve = res; });
  },
  runPress() { const run = get().run; if (run) set({ run: { ...run, button: null } }); const r = runResolve; runResolve = null; r?.(); },
  runClose() { set({ run: null }); },
  /** 장면(VN)을 보는 동안 진행 화면을 숨겼다가 같은 기록 그대로 다시 보인다 */
  runHide() { const run = get().run; if (run) set({ run: { ...run, hidden: true } }); },
  runShow() { const run = get().run; if (run) set({ run: { ...run, hidden: false } }); },
  runHeader(title: string, sub: string) { const run = get().run; if (run) set({ run: { ...run, title, sub } }); },

  /* ---------- 평일 실시간 진행 ---------- */
  weekOpen(w: LiveWeek) { set({ week: w, fast: false }); },
  /** 진행 중인 주를 고친다 (fn 안에서 바꾸면 화면이 다시 그려진다) */
  weekPatch(fn: (w: LiveWeek) => void) { const w = get().week; if (!w) return; fn(w); set({ week: { ...w, days: [...w.days] } }); },
  weekClose() { set({ week: null }); },
  /** 연출 대기 — 텍스트 속도 설정을 따르고, 화면을 누르면(빨리 감기) 기다리지 않는다 */
  pace(ms: number) {
    if (get().fast) return Promise.resolve();
    return sleep(ms * [1.6, 1, 0.5][game.settings.textSpeed]);
  },
  setFast: (fast: boolean) => set({ fast }),
  /** 작은 선택 — 진행을 멈추고 고른 번호를 돌려준다 */
  weekChoice(view: ChoiceView): Promise<number> {
    ui.weekPatch(w => { w.choice = view; });
    set({ fast: false });
    return new Promise(res => { choiceResolve = res; });
  },
  weekChoose(i: number) { ui.weekPatch(w => { w.choice = null; }); const r = choiceResolve; choiceResolve = null; r?.(i); },

  /* ---------- 주말 계획판 ---------- */
  planWeekend(spec: WeekendSpec): Promise<WeekendResult> {
    set({ map: spec });
    return new Promise(res => { mapResolve = res; });
  },
  planDone(r: WeekendResult) { set({ map: null }); const f = mapResolve; mapResolve = null; f?.(r); },

  /* ---------- 메신저 ---------- */
  setTyping: (typing: string | null) => set({ typing }),
  notify(n: NonNullable<UIState['notice']>): Promise<boolean> {
    set({ notice: n });
    return new Promise(res => { noticeResolve = res; });
  },
  noticeDone(open: boolean) { set({ notice: null }); const r = noticeResolve; noticeResolve = null; r?.(open); },
  openChat(room: string): Promise<void> {
    set({ chatRoom: room });
    return new Promise(res => { chatResolve = res; });
  },
  closeChat() { set({ chatRoom: null }); const r = chatResolve; chatResolve = null; r?.(); },

  /* ---------- 크레딧 ---------- */
  credits(): Promise<void> { set({ credits: true }); return new Promise(res => { creditsResolve = res; }); },
  creditsDone() { set({ credits: false }); const r = creditsResolve; creditsResolve = null; r?.(); },

  toast(text: string) {
    clearTimeout(toastTimer);
    set({ toast: { text, key: Date.now() } });
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },
};
