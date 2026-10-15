/* =========================================================
   화면 상태 + 엔진이 호출하는 비동기 UI 함수들
   엔진은 `await ui.playScene(...)` 처럼 화면이 끝나기를 기다리며 진행한다.
   ========================================================= */
import { create } from 'zustand';
import type { StoryNode, Theme } from '@/engine/types';
import { ScenePlayer, type PlayOptions, type View } from '@/engine/story/player';
import { getScene } from '@/engine/story/library';
import { applyEffect, game, refresh } from '@/engine/state';
import type { WeekendResult, WeekendSpec } from '@/engine/weekend';

export type Tab = 'schedule' | 'stats' | 'phone' | 'codex' | 'system';
export interface Chip { label: string; tone: 'up' | 'down' | 'money' | 'heart' | 'plain' }
export interface RunLog { id: number; title: string; tag?: string; body?: string; chips?: Chip[]; tone?: 'warn' | 'sum' | 'char'; mark?: string; color?: string; image?: string }
export interface ModalButton { label: string; value: unknown; primary?: boolean }
export interface ModalOption { label: string; desc?: string; value: unknown; chips?: Chip[]; disabled?: boolean }
export interface ModalSpec { title?: string; text?: string; letter?: string; input?: string; buttons: ModalButton[]; endings?: { title: string; kind: string }[]; options?: ModalOption[] }

interface UIState {
  theme: Theme;
  tab: Tab;
  titleOpen: boolean;
  busy: boolean;
  sheetSlot: number | null;
  phoneRoom: string | null;
  codexSeg: 'memories' | 'endings' | 'people';
  vn: { player: ScenePlayer; view: View } | null;
  run: { title: string; sub: string; logs: RunLog[]; button: string | null } | null;
  modal: ModalSpec | null;
  map: WeekendSpec | null;
  ink: { text: string; mode: Theme; on: boolean } | null;
  credits: boolean;
  toast: { text: string; key: number } | null;
}

export const useUI = create<UIState>(() => ({
  theme: 'day', tab: 'schedule', titleOpen: true, busy: false, sheetSlot: null, phoneRoom: null, codexSeg: 'memories',
  vn: null, run: null, modal: null, map: null, ink: null, credits: false, toast: null,
}));

const set = useUI.setState;
const get = useUI.getState;
export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

let vnResolve: ((v: string | undefined) => void) | null = null;
let modalResolve: ((v: unknown) => void) | null = null;
let runResolve: (() => void) | null = null;
let creditsResolve: (() => void) | null = null;
let mapResolve: ((r: WeekendResult) => void) | null = null;
let logId = 0, toastTimer: ReturnType<typeof setTimeout> | undefined;

export const ui = {
  setTheme: (theme: Theme) => set({ theme }),
  setTab: (tab: Tab) => set({ tab }),
  setBusy: (busy: boolean) => set({ busy }),

  /* ---------- 비주얼 노벨 ---------- */
  playScene(scene: string | StoryNode[], opts: PlayOptions = {}): Promise<string | undefined> {
    const nodes = typeof scene === 'string' ? getScene(scene).nodes : scene;
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

  /* ---------- 주말 계획판 ---------- */
  planWeekend(spec: WeekendSpec): Promise<WeekendResult> {
    set({ map: spec });
    return new Promise(res => { mapResolve = res; });
  },
  planDone(r: WeekendResult) { set({ map: null }); const f = mapResolve; mapResolve = null; f?.(r); },

  /* ---------- 크레딧 ---------- */
  credits(): Promise<void> { set({ credits: true }); return new Promise(res => { creditsResolve = res; }); },
  creditsDone() { set({ credits: false }); const r = creditsResolve; creditsResolve = null; r?.(); },

  toast(text: string) {
    clearTimeout(toastTimer);
    set({ toast: { text, key: Date.now() } });
    toastTimer = setTimeout(() => set({ toast: null }), 2400);
  },
};
