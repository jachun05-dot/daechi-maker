/* =========================================================
   .story 파일 파서 — 문법 설명은 docs/STORY_GUIDE.md
   ========================================================= */
import type { ChoiceOption, Effect, Scene, StoryNode } from '../types';
import { CHAR_ORDER } from '@/content/characters';

export class StoryError extends Error {
  constructor(public file: string, public line: number, msg: string) { super(`${file}:${line} — ${msg}`); }
}

const STAT_KEYS = ['int', 'sense', 'cha', 'fit', 'spirit'];
const SKILL_KEYS = ['science', 'medicine', 'vocal', 'dance', 'acting', 'voice', 'language', 'debate'];
const RES_KEYS = ['hp', 'stress', 'money'];

interface Line { level: number; text: string; line: number }

const unescape = (s: string) => s.replace(/\\n/g, '\n');

/** "a=1 title="두 단어"" → { a:'1', title:'두 단어' } */
function parseAttrs(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  const re = /(\w+)=("([^"]*)"|\S+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s))) out[m[1]] = m[3] ?? m[2];
  return out;
}

/** "ian+5 spirit+2 stress-3 flag:x" → Effect. 알 수 없는 토큰은 에러 */
export function parseEffect(tokens: string[], file: string, line: number): Effect {
  const eff: Effect = {};
  for (const tok of tokens) {
    if (tok.startsWith('flag:')) { (eff.flags ??= []).push(tok.slice(5)); continue; }
    const m = /^([a-z_]+)([+-])(\d+)$/.exec(tok);
    if (!m) throw new StoryError(file, line, `알 수 없는 효과 "${tok}" (예: ian+3, spirit+2, vocal+1, stress-5, flag:이름)`);
    const [, key, sign, num] = m;
    const v = (sign === '-' ? -1 : 1) * Number(num);
    if (STAT_KEYS.includes(key)) (eff.stat ??= {})[key as 'int'] = v;
    else if (SKILL_KEYS.includes(key)) (eff.skill ??= {})[key as 'vocal'] = v;
    else if (RES_KEYS.includes(key)) (eff.res ??= {})[key as 'hp'] = v;
    else if ((CHAR_ORDER as string[]).includes(key)) (eff.aff ??= {})[key as 'ian'] = v;
    else throw new StoryError(file, line, `"${key}"은(는) 스탯/특기/리소스/인물 id가 아닙니다`);
  }
  return eff;
}

function parseOption(text: string, file: string, line: number): Omit<ChoiceOption, 'body'> {
  const m = /^\*\s+(.*?)\s*(?:\{([^}]*)\})?\s*$/.exec(text)!;
  const opt: Omit<ChoiceOption, 'body'> = { text: unescape(m[1]), eff: {} };
  const effTokens: string[] = [];
  for (const tok of (m[2] ?? '').split(/\s+/).filter(Boolean)) {
    if (tok === 'special') opt.special = true;
    else if (tok.startsWith('value:')) opt.value = tok.slice(6);
    else if (tok.startsWith('if:')) opt.cond = tok.slice(3);
    else effTokens.push(tok);
  }
  opt.eff = parseEffect(effTokens, file, line);
  return opt;
}

const isBranch = (t: string, kw: 'if' | 'elif' | 'else') => new RegExp(`^\\[${kw}(\\s|\\])`).test(t);

function parseBlock(L: Line[], pos: { i: number }, level: number, file: string): StoryNode[] {
  const nodes: StoryNode[] = [];
  while (pos.i < L.length) {
    const l = L[pos.i];
    if (l.level < level) break;
    if (l.level > level) throw new StoryError(file, l.line, '들여쓰기가 맞지 않습니다 (선택지·조건 아래에서만 2칸 들여쓰기)');
    const t = l.text;

    if (t.startsWith('* ')) {
      const options: ChoiceOption[] = [];
      while (pos.i < L.length && L[pos.i].level === level && L[pos.i].text.startsWith('* ')) {
        const ol = L[pos.i++];
        options.push({ ...parseOption(ol.text, file, ol.line), body: parseBlock(L, pos, level + 1, file) });
      }
      nodes.push({ t: 'choice', options, line: l.line });
      continue;
    }

    if (isBranch(t, 'if')) {
      const branches: { cond: string | null; body: StoryNode[] }[] = [];
      const condOf = (s: string, kw: string) => s.slice(kw.length + 1, -1).trim();
      pos.i++;
      branches.push({ cond: condOf(t, 'if'), body: parseBlock(L, pos, level + 1, file) });
      while (pos.i < L.length && L[pos.i].level === level && (isBranch(L[pos.i].text, 'elif') || isBranch(L[pos.i].text, 'else'))) {
        const bl = L[pos.i++];
        const isElse = isBranch(bl.text, 'else');
        branches.push({ cond: isElse ? null : condOf(bl.text, 'elif'), body: parseBlock(L, pos, level + 1, file) });
        if (isElse) break;
      }
      nodes.push({ t: 'if', branches, line: l.line });
      continue;
    }
    if (isBranch(t, 'elif') || isBranch(t, 'else')) throw new StoryError(file, l.line, '[elif]/[else] 앞에 [if]가 없습니다');

    pos.i++;
    if (t.startsWith('[') && t.endsWith(']')) {
      const inner = t.slice(1, -1).trim();
      const sp = inner.search(/\s/);
      const name = sp < 0 ? inner : inner.slice(0, sp);
      const rest = sp < 0 ? '' : inner.slice(sp + 1).trim();
      if (name === 'effect') nodes.push({ t: 'effect', eff: parseEffect(rest.split(/\s+/).filter(Boolean), file, l.line), line: l.line });
      else if (name === 'call') nodes.push({ t: 'call', id: rest, line: l.line });
      else if (name === 'card') nodes.push({ t: 'cmd', name, args: rest.split('|').map(s => unescape(s.trim())), line: l.line });
      else nodes.push({ t: 'cmd', name, args: rest.split(/\s+/).filter(Boolean), line: l.line });
      continue;
    }
    if (t.startsWith('\\')) { nodes.push({ t: 'say', text: unescape(t.slice(1)), line: l.line }); continue; }

    const d = /^([^\s|*[\\][^|]{0,15}?)\s*\|\s?(.*)$/.exec(t);
    if (d) {
      const who = d[1].trim();
      const em = /^(\w+)\((\w+)\)$/.exec(who);
      nodes.push({ t: 'say', who: em ? em[1] : who, expr: em ? em[2] : undefined, text: unescape(d[2]), line: l.line });
    } else nodes.push({ t: 'say', text: unescape(t), line: l.line });
  }
  return nodes;
}

export function parseStory(text: string, file: string): Scene[] {
  const scenes: Scene[] = [];
  let cur: { id: string; attrs: Record<string, string>; lines: Line[] } | null = null;
  const flush = () => { if (cur) scenes.push({ id: cur.id, file, attrs: cur.attrs, nodes: parseBlock(cur.lines, { i: 0 }, 0, file) }); };
  text.split(/\r?\n/).forEach((raw, idx) => {
    const line = idx + 1;
    const head = /^===\s*(\S+)\s*(.*)$/.exec(raw);
    if (head) { flush(); cur = { id: head[1], attrs: parseAttrs(head[2]), lines: [] }; return; }
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
    if (!cur) throw new StoryError(file, line, '장면 머리말(=== 장면id)보다 먼저 내용이 나왔습니다');
    const ws = raw.match(/^[ \t]*/)![0].replace(/\t/g, '  ').length;
    if (ws % 2) throw new StoryError(file, line, '들여쓰기는 2칸 단위여야 합니다');
    (cur as { lines: Line[] }).lines.push({ level: ws / 2, text: trimmed, line });
  });
  flush();
  return scenes;
}
