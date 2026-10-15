/* 대사 치환자({name} 등)와 조건식([if aff.ian>=30]) 처리 */
import type { GameState } from '../types';
import { ROUTES } from '@/content/routes';
import { CHAR_ORDER } from '@/content/characters';

export interface StoryCtx { state: GameState | null; name: string; route: GameState['route']; vars: Record<string, string | number> }

function hasBatchim(ch: string) {
  const c = ch.charCodeAt(0);
  if (c < 0xac00 || c > 0xd7a3) return /[0-9lmnr]$/i.test(ch) && !/[2459]$/.test(ch);
  return (c - 0xac00) % 28 !== 0;
}
const isRieul = (ch: string) => { const c = ch.charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 === 8; };

/** 단어 뒤에 붙일 조사 선택: josa('사야','과/와') → '사야와' */
export function josa(word: string, pair: string) {
  const [withB, withoutB] = pair.split('/');
  return word + (hasBatchim(word.slice(-1)) ? withB : withoutB);
}

const JOSA_RE = /([가-힣A-Za-z0-9])(을\(를\)|이\(가\)|은\(는\)|와\(과\)|과\(와\)|\(이\)|\(으\)로)/g;

export function fill(text: string, ctx: StoryCtx): string {
  const R = ROUTES[ctx.route];
  const G = ROUTES[ctx.state?.goal ?? ctx.route];
  const out = text.replace(/\{([\w.]+)\}/g, (m, key: string) => {
    switch (key) {
      case 'name': return ctx.name;
      case 'goal': return G.goal;
      case 'item': return R.item;
      case 'pastDream': return R.pastDream;
      case 'role': return R.role;
      case 'past': return R.past;
    }
    if (key.startsWith('var.')) return String(ctx.vars[key.slice(4)] ?? '');
    return m;
  });
  return out.replace(JOSA_RE, (_m, w: string, j: string) => {
    const b = hasBatchim(w);
    const map: Record<string, string> = {
      '을(를)': b ? '을' : '를', '이(가)': b ? '이' : '가', '은(는)': b ? '은' : '는',
      '와(과)': b ? '과' : '와', '과(와)': b ? '과' : '와', '(이)': b ? '이' : '', '(으)로': b && !isRieul(w) ? '으로' : '로',
    };
    return w + map[j];
  });
}

/* ---------- 조건식 ---------- */
const STAT = ['int', 'art', 'sense', 'cha', 'charm', 'spirit', 'fit'];

function resolve(key: string, ctx: StoryCtx): string | number | boolean | undefined {
  const S = ctx.state;
  const [head, sub] = key.split('.');
  if (head === 'var') return ctx.vars[sub];
  if (head === 'route') return ctx.route;
  if (head === 'goal') return S?.goal ?? ctx.route;
  if (!S) return undefined;
  if (STAT.includes(head)) return S.stat[head as 'int'];
  switch (head) {
    case 'hp': return S.hp;
    case 'stress': return S.stress;
    case 'money': return S.money;
    case 'turn': return S.turn;
    case 'aff': return S.aff[sub as 'ian'];
    case 'met': return !!S.met[sub as 'ian'];
    case 'flag': return !!S.flags[sub];
    case 'mem': return !!S.memories[sub];
  }
  return undefined;
}

/** 조건식이 문법상 올바른지 검사 (콘텐츠 검증용) — 문제가 없으면 null */
export function checkCond(expr: string): string | null {
  for (const part of expr.split(/\|\||&&/)) {
    const a = part.trim().replace(/^!/, '');
    const m = /^([\w.]+)\s*(>=|<=|!=|=|>|<)?\s*(.*)$/.exec(a);
    if (!m) return `조건 "${part}"을(를) 읽을 수 없습니다`;
    const [head, sub] = m[1].split('.');
    const ok = ['var', 'route', 'goal', 'hp', 'stress', 'money', 'turn', 'flag', 'mem', ...STAT].includes(head)
      || (['aff', 'met'].includes(head) && (CHAR_ORDER as string[]).includes(sub));
    if (!ok) return `조건 "${part}"의 "${m[1]}"은(는) 알 수 없는 값입니다`;
  }
  return null;
}

function atom(a: string, ctx: StoryCtx): boolean {
  a = a.trim();
  if (a.startsWith('!')) return !atom(a.slice(1), ctx);
  const m = /^([\w.]+)\s*(>=|<=|!=|=|>|<)\s*(.+)$/.exec(a);
  if (!m) { const v = resolve(a, ctx); return !!v && v !== '0'; }
  const lv = resolve(m[1], ctx), rv = m[3].trim();
  const ln = Number(lv), rn = Number(rv);
  const num = lv !== undefined && lv !== '' && !Number.isNaN(ln) && !Number.isNaN(rn);
  switch (m[2]) {
    case '=': return num ? ln === rn : String(lv) === rv;
    case '!=': return num ? ln !== rn : String(lv) !== rv;
    case '>=': return num && ln >= rn;
    case '<=': return num && ln <= rn;
    case '>': return num && ln > rn;
    case '<': return num && ln < rn;
  }
  return false;
}

/** "a && b || c" — && 가 || 보다 먼저 묶임. 괄호는 지원하지 않음 */
export const evalCond = (expr: string, ctx: StoryCtx) => expr.split('||').some(or => or.split('&&').every(and => atom(and, ctx)));
