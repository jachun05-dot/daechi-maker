/* =========================================================
   npm run images — 넣어야 할 이미지 목록과 현재 있는 파일을 보여준다
   ========================================================= */
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { CHAR_ORDER, CHARACTERS } from '@/content/characters';
import { BACKGROUNDS } from '@/content/backgrounds';
import { SLOTS } from '@/content/schedule';
import { DREAMS, SCENES } from '@/engine/story/library';
import type { StoryNode } from '@/engine/types';

const ROOT = join(process.cwd(), 'src/assets/images');
const EXT = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'];
const has = (key: string) => EXT.some(e => existsSync(join(ROOT, `${key}.${e}`)));

// 스토리에서 실제로 쓰인 표정·CG 수집
const exprs: Record<string, Set<string>> = {};
const cgs = new Set<string>();
const walk = (nodes: StoryNode[]) => nodes.forEach(n => {
  if (n.t === 'say' && n.who && n.who in CHARACTERS) (exprs[n.who] ??= new Set(['default'])).add(n.expr ?? 'default');
  if (n.t === 'cmd' && n.name === 'stand' && n.args[0] in CHARACTERS) (exprs[n.args[0]] ??= new Set(['default'])).add(n.args[1] ?? 'default');
  if (n.t === 'cmd' && n.name === 'cg' && n.args[0] && n.args[0] !== 'off') cgs.add(n.args[0]);
  if (n.t === 'if') n.branches.forEach(b => walk(b.body));
  if (n.t === 'choice') n.options.forEach(o => walk(o.body));
});
Object.values(SCENES).forEach(s => walk(s.nodes));

const groups: [string, { key: string; note: string; required: boolean }[]][] = [
  ['캐릭터 스탠딩 (chars/{id}/표정)', CHAR_ORDER.flatMap(id => [
    ...[...(exprs[id] ?? new Set(['default']))].map(e => ({ key: `chars/${id}/${e}`, note: `${CHARACTERS[id].name} 현생 · ${e}`, required: e === 'default' })),
    { key: `chars/${id}/past_default`, note: `${CHARACTERS[id].past} 전생(밤) — 없으면 현생 이미지 사용`, required: false },
    { key: `chars/${id}/avatar`, note: `${CHARACTERS[id].name} 프로필·톡 아이콘`, required: false },
  ])],
  ['배경 (bg/{key})', Object.entries(BACKGROUNDS).map(([k, v]) => ({ key: `bg/${k}`, note: v.label, required: true }))],
  ['전생 기억 카드·CG (cg/{장면id})', [...DREAMS.map(d => ({ key: `cg/${d.id}`, note: `도감 카드 · ${d.title}`, required: false })), ...[...cgs].map(c => ({ key: `cg/${c}`, note: '스토리 [cg] 명령', required: true }))]],
  ['스케줄 아이콘 (schedule/{id})', SLOTS.flatMap(s => s.options.map(o => ({ key: `schedule/${o.id}`, note: `${s.label} · ${o.name}`, required: false })))],
  ['UI (ui/…)', [{ key: 'ui/title', note: '타이틀 배경', required: false }]],
];

let total = 0, done = 0;
for (const [title, items] of groups) {
  console.log(`\n■ ${title}`);
  for (const it of items) {
    total++; const ok = has(it.key); if (ok) done++;
    console.log(`  ${ok ? '✔' : it.required ? '✘' : '·'} ${it.key.padEnd(30)} ${it.note}`);
  }
}
const extra = (dir: string): string[] => readdirSync(join(ROOT, dir), { withFileTypes: true }).flatMap(d => d.isDirectory() ? extra(join(dir, d.name)) : [join(dir, d.name)]);
console.log(`\n준비된 이미지 ${done}/${total}  (✘ 필수 · · 선택)  확장자: ${EXT.join('/')}`);
console.log(`현재 폴더의 파일 수: ${extra('.').filter(f => !f.endsWith('.gitkeep') && !f.endsWith('.md')).length}`);
