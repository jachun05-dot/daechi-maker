/* =========================================================
   장면 재생기 — 스토리 노드를 한 줄씩 진행하며 화면 상태(View)를 만든다.
   React와 무관하므로 테스트에서도 그대로 돌릴 수 있다.
   ========================================================= */
import type { Effect, FxType, StoryNode, Theme } from '../types';
import { CHARACTERS, isCharId } from '@/content/characters';
import { evalCond, fill, type StoryCtx } from './context';
import { getScene } from './library';

export interface View {
  theme: Theme;
  bg: string;
  fx: FxType;
  stand: { id: string; expr: string } | null;
  cg: string | null;
  mode: 'say' | 'card' | 'choice' | 'done';
  speaker: string | null;
  speakerColor: string | null;
  text: string;
  card: { kicker: string; title: string; sub: string } | null;
  /** 장면 안에서 장소가 바뀜 — [move 배경 | 자막] */
  move: { text: string; key: number } | null;
  choices: { text: string; special: boolean }[];
  shake: number;      // 값이 바뀔 때마다 흔들림
  flash: { color: string; key: number } | null;
  /** 메신저 사진 — [photo id 설명] */
  photo: { id: string; caption: string } | null;
}

export interface PlayOptions {
  theme?: Theme;
  bg?: string;
  fx?: FxType;
  vars?: Record<string, string | number>;
  replay?: boolean;                 // true면 효과를 적용하지 않음(도감 다시보기)
  /** 재생기가 모르는 명령을 넘겨받는다 (메신저의 [promise] 등). replay 중에도 불린다 */
  onCmd?: (name: string, args: string[], replay: boolean) => void;
  /** 장면 앞 "언제 · 어디서" 자막. false 면 안 띄운다. 비워 두면 장면 머리말(when= where=)과 이야기 시계(engine/clock.ts)로 만든다 */
  intro?: { when?: string; where?: string } | false;
}

export class ScenePlayer {
  view: View;
  result: string | undefined;       // 마지막으로 고른 선택지의 value(또는 텍스트)
  log: { speaker: string | null; text: string }[] = [];
  private queue: StoryNode[];
  private pendingChoices: (StoryNode & { t: 'choice' })['options'] = [];

  constructor(nodes: StoryNode[], private ctx: StoryCtx, private opts: PlayOptions, private applyEffect: (e: Effect) => void) {
    this.queue = [...nodes];
    const theme = opts.theme ?? 'day';
    this.view = {
      theme, bg: opts.bg ?? (theme === 'night' ? 'dream' : 'room'), fx: opts.fx ?? 'none', stand: null, cg: null,
      mode: 'say', speaker: null, speakerColor: null, text: '', card: null, move: null, choices: [], shake: 0, flash: null, photo: null,
    };
  }

  /** 다음 멈춤 지점(대사·카드·선택지·끝)까지 진행 */
  next(): View {
    this.view = { ...this.view, card: null, choices: [], photo: null };
    while (this.queue.length) {
      const n = this.queue.shift()!;
      if (this.run(n)) return this.view;
    }
    this.view = { ...this.view, mode: 'done' };
    return this.view;
  }

  /** 다시보기 상태를 바꾼다 (메신저: 저장된 대화를 빨리 감은 뒤 이어서 진행) */
  setReplay(replay: boolean) { this.opts.replay = replay; }
  get replaying() { return !!this.opts.replay; }

  choose(index: number): View {
    const opt = this.pendingChoices[index];
    if (!opt) return this.view;
    if (!this.opts.replay) this.applyEffect(opt.eff);
    this.result = opt.value ?? opt.text;
    this.log.push({ speaker: '▶ 선택', text: fill(opt.text, this.ctx) });
    this.queue.unshift(...opt.body);
    this.pendingChoices = [];
    return this.next();
  }

  /** true를 반환하면 화면에서 멈춘다 */
  private run(n: StoryNode): boolean {
    switch (n.t) {
      case 'say': return this.say(n.who, n.expr, n.text);
      case 'effect': if (!this.opts.replay) this.applyEffect(n.eff); return false;
      case 'call': this.queue.unshift(...getScene(n.id).nodes); return false;
      case 'if': {
        const b = n.branches.find(br => br.cond === null || evalCond(br.cond, this.ctx));
        if (b) this.queue.unshift(...b.body);
        return false;
      }
      case 'choice': {
        this.pendingChoices = n.options.filter(o => !o.cond || evalCond(o.cond, this.ctx));
        if (!this.pendingChoices.length) return false;
        this.view = { ...this.view, mode: 'choice', choices: this.pendingChoices.map(o => ({ text: fill(o.text, this.ctx), special: !!o.special })) };
        return true;
      }
      case 'cmd': return this.cmd(n.name, n.args);
    }
  }

  private cmd(name: string, a: string[]): boolean {
    const v = this.view;
    switch (name) {
      case 'bg': this.view = { ...v, bg: a[0] }; return false;
      case 'move': this.view = { ...v, bg: a[0] || v.bg, move: { text: fill(a[1] ?? '', this.ctx), key: (v.move?.key ?? 0) + 1 } }; return false;
      case 'fx': this.view = { ...v, fx: (a[0] ?? 'none') as FxType }; return false;
      case 'stand': this.view = { ...v, stand: !a[0] || a[0] === 'off' ? null : { id: a[0], expr: a[1] ?? 'default' } }; return false;
      case 'cg': this.view = { ...v, cg: !a[0] || a[0] === 'off' ? null : a[0] }; return false;
      case 'shake': this.view = { ...v, shake: v.shake + 1 }; return false;
      case 'flash': this.view = { ...v, flash: { color: a[0] ?? '#fff', key: (v.flash?.key ?? 0) + 1 } }; return false;
      case 'card': {
        const [kicker = '', title = '', sub = ''] = a.map(s => fill(s, this.ctx));
        this.view = { ...v, mode: 'card', card: { kicker, title, sub } };
        return true;
      }
      case 'photo': {
        const [id = '', ...cap] = a;
        this.view = { ...v, mode: 'say', photo: { id, caption: fill(cap.join(' '), this.ctx) } };
        return true;
      }
    }
    if (this.opts.onCmd) { this.opts.onCmd(name, a, !!this.opts.replay); return false; }
    console.warn(`알 수 없는 명령 [${name}]`);
    return false;
  }

  private say(who: string | undefined, expr: string | undefined, raw: string): boolean {
    const text = fill(raw, this.ctx);
    let speaker: string | null = null, color: string | null = null, stand = this.view.stand;
    if (who) {
      if (isCharId(who)) {
        const c = CHARACTERS[who];
        speaker = this.view.theme === 'night' ? c.past : c.name;
        color = c.color;
        stand = { id: who, expr: expr ?? (stand?.id === who ? stand.expr : 'default') };
      } else if (who === 'me') {
        speaker = this.ctx.name;
      } else {
        speaker = who;
        if (who !== '???') stand = null;
      }
    }
    this.view = { ...this.view, mode: 'say', speaker, speakerColor: color, text, stand };
    this.log.push({ speaker, text });
    return true;
  }
}
