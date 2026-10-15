/* 콘텐츠 검증 — 스토리·스케줄을 수정한 뒤 `npm test` 로 오타를 잡으세요 */
import { describe, expect, it } from 'vitest';
import { SCENES, STORY_ERRORS, DREAMS } from '@/engine/story/library';
import { checkCond } from '@/engine/story/context';
import type { StoryNode } from '@/engine/types';
import { BACKGROUNDS } from '@/content/backgrounds';
import { CHAR_ORDER } from '@/content/characters';
import { AFTER_SCHOOL, NIGHT, CLUBS } from '@/content/timetable';
import { PLACES } from '@/content/places';
import { WEEKEND_PLACES } from '@/content/presence';
import { LECTURES } from '@/content/vacation';
import { ENDINGS } from '@/content/endings';
import { CAREER_ORDER } from '@/content/careers';
import { ROMANCEABLE, CHARACTERS } from '@/content/characters';
const CHARACTERS_NAMES = Object.fromEntries(Object.entries(CHARACTERS).map(([k, v]) => [k, v.name.slice(1)])) as Record<string, string>;
import { MAIN_EVENTS } from '@/engine/story/library';
import { INVITES, TRACES, INVITE_REPLY, DECLINE_REPLY } from '@/content/weekend';
import { isBase, isSkill } from '@/engine/timetable';

const FX = ['none', 'petal', 'sakura', 'leaf', 'snow', 'rain', 'ember'];
const CMDS = ['bg', 'fx', 'stand', 'cg', 'shake', 'flash', 'card'];

function walk(nodes: StoryNode[], fn: (n: StoryNode) => void) {
  for (const n of nodes) {
    fn(n);
    if (n.t === 'if') n.branches.forEach(b => walk(b.body, fn));
    if (n.t === 'choice') n.options.forEach(o => walk(o.body, fn));
  }
}

describe('스토리 파일', () => {
  it('문법 오류가 없다', () => expect(STORY_ERRORS).toEqual([]));

  it('명령·배경·조건·호출 대상이 모두 올바르다', () => {
    const problems: string[] = [];
    for (const s of Object.values(SCENES)) {
      walk(s.nodes, n => {
        const at = `${s.file}:${n.line}`;
        if (n.t === 'cmd') {
          const chat = s.id.startsWith('chat.') || s.id.startsWith('call.');
          if (!CMDS.includes(n.name) && !(chat && ['photo', 'promise'].includes(n.name))) problems.push(`${at} 알 수 없는 명령 [${n.name}]`);
          if (n.name === 'bg' && !BACKGROUNDS[n.args[0]]) problems.push(`${at} 배경 "${n.args[0]}"이 backgrounds.ts에 없음`);
          if (n.name === 'fx' && !FX.includes(n.args[0])) problems.push(`${at} 효과 "${n.args[0]}" 없음 (${FX.join('/')})`);
          if (n.name === 'stand' && n.args[0] !== 'off' && !(CHAR_ORDER as string[]).includes(n.args[0])) problems.push(`${at} 인물 "${n.args[0]}" 없음`);
        }
        if (n.t === 'call' && !SCENES[n.id]) problems.push(`${at} [call ${n.id}] 장면 없음`);
        if (n.t === 'if') n.branches.forEach(b => { const e = b.cond && checkCond(b.cond); if (e) problems.push(`${at} ${e}`); });
        if (n.t === 'choice') n.options.forEach(o => { const e = o.cond && checkCond(o.cond); if (e) problems.push(`${at} ${e}`); });
      });
    }
    expect(problems).toEqual([]);
  });

  it('엔진이 찾는 장면이 모두 있다', () => {
    const need = ['prologue', 'wakeup', 'prologue.hand', 'opening.1', 'opening.2', 'opening.3', 'self1', 'self2', 'self3',
      'event.exam', 'event.sports', 'event.festival', 'event.counsel.hint', 'event.counsel.decide', 'event.suneung', 'event.graduation',
      'event.slump', 'event.sihyun_rescue', 'vacation.start', 'vacation.lecture', 'vacation.decline', 'final.choice',
      ...CAREER_ORDER.map(r => `career.${r}`), 'career.none',
      ...ROMANCEABLE.flatMap(c => [`true.${c}`, `normal.${c}`, `reject.${c}`]),
      'reject.ihyun', 'ihyun.end', 'ihyun.hidden', 'hidden.taejun',
      ...CHAR_ORDER.flatMap(c => [`basic.${c}`, `main.${c}.1`, 'summer1', 'summer2', 'summer3', 'winter1', 'winter2'].map((x, i) => (i < 2 ? x : `vac.${c}.${x}`)))];
    expect(need.filter(id => !SCENES[id])).toEqual([]);
  });

  it('메인 이벤트는 인물별로 1부터 빠짐없이 이어지고 장소가 올바르다', () => {
    const problems: string[] = [];
    for (const c of CHAR_ORDER) {
      const list = MAIN_EVENTS.filter(e => e.ch === c);
      list.forEach((e, i) => { if (e.step !== i + 1) problems.push(`${e.id}: 번호가 ${i + 1}이어야 함`); });
      list.forEach(e => {
        if (!e.auto && !e.place) problems.push(`${e.id}: place= 또는 auto=1 이 필요`);
        if (e.place && !PLACES.some(p => p.id === e.place)) problems.push(`${e.id}: 장소 ${e.place} 없음`);
      });
    }
    expect(problems).toEqual([]);
  });

  it('엔딩 장면의 ending id가 endings.ts에 있다', () => {
    const ids = ENDINGS.map(e => e.id);
    const bad = Object.values(SCENES).filter(s => s.attrs.ending && !ids.includes(s.attrs.ending)).map(s => `${s.id} → ${s.attrs.ending}`);
    expect(bad).toEqual([]);
  });

  it('전생 꿈의 requires 대상이 있다', () => {
    const ids = DREAMS.map(d => d.id);
    expect(DREAMS.flatMap(d => d.requires.filter(r => !ids.includes(r)))).toEqual([]);
  });
});

describe('시간표 · 지도 · 방학', () => {
  it('id와 배경·인물·장소가 올바르다', () => {
    const problems: string[] = [];
    for (const group of [[...AFTER_SCHOOL, ...NIGHT], CLUBS, PLACES, LECTURES]) {
      const ids = new Set<string>();
      for (const o of group) { if (ids.has(o.id)) problems.push(`중복 id ${o.id}`); ids.add(o.id); }
    }
    for (const o of [...AFTER_SCHOOL, ...NIGHT]) {
      if (!o.days.length) problems.push(`${o.id}: days 비어 있음`);
      if (o.who && !(CHAR_ORDER as string[]).includes(o.who)) problems.push(`${o.id}: 인물 ${o.who} 없음`);
    }
    for (const p of PLACES) {
      if (!BACKGROUNDS[p.bg]) problems.push(`${p.id}: 배경 ${p.bg} 없음`);
      if (!p.actions.length) problems.push(`${p.id}: actions 비어 있음`);
    }
    for (const c of CHAR_ORDER) for (const y of [1, 2, 3] as const)
      for (const pl of WEEKEND_PLACES[c][y]) if (!PLACES.some(p => p.id === pl)) problems.push(`${c} ${y}학년: 장소 ${pl} 없음`);
    // 요일마다 고를 수 있는 일정이 최소 하나는 있어야 한다
    for (let d = 0; d < 5; d++) for (const list of [AFTER_SCHOOL, NIGHT]) if (!list.some(o => o.days.includes(d))) problems.push(`${d}요일에 고를 일정 없음`);
    expect(problems).toEqual([]);
  });
});

describe('주말', () => {
  it('장소·일정·사건·약속 데이터가 올바르다', () => {
    const problems: string[] = [];
    const res = ['hp', 'stress', 'money'];
    for (const p of PLACES) {
      if (p.pos[0] < 0 || p.pos[0] > 100 || p.pos[1] < 0 || p.pos[1] > 100) problems.push(`${p.id}: pos 범위 밖`);
      for (const a of p.actions) for (const k of Object.keys(a.delta)) if (!isBase(k) && !isSkill(k) && !res.includes(k)) problems.push(`${p.id}/${a.label}: 알 수 없는 수치 ${k}`);
      if (p.open?.months && !p.actions.some(a => !a.months || a.months.some(m => p.open!.months!.includes(m)))) problems.push(`${p.id}: 열리는 달에 고를 일정이 없음`);
      for (const m of p.open?.months ?? []) if (!p.actions.some(a => !a.unlock && (!a.months || a.months.includes(m)))) problems.push(`${p.id}: ${m}월에 처음부터 고를 수 있는 일정이 없음`);
      if (p.actions.every(a => a.unlock)) problems.push(`${p.id}: 처음부터 고를 수 있는 일정이 없음`);
    }
    for (const s of Object.values(SCENES).filter(s => s.id.startsWith('street.'))) {
      const place = s.id.split('.')[1];
      if (!PLACES.some(p => p.id === place)) problems.push(`${s.id}: 장소 ${place} 없음`);
      if (s.attrs.if) { const e = checkCond(s.attrs.if); if (e) problems.push(`${s.id}: ${e}`); }
      if (s.attrs.weather && !['sun', 'cloud', 'rain', 'snow'].includes(s.attrs.weather)) problems.push(`${s.id}: 날씨 ${s.attrs.weather}`);
    }
    for (const s of Object.values(SCENES).filter(s => s.id.startsWith('weather.'))) {
      const [, c, w] = s.id.split('.');
      if (!(CHAR_ORDER as string[]).includes(c)) problems.push(`${s.id}: 인물 ${c} 없음`);
      if (!['sun', 'cloud', 'rain', 'snow'].includes(w)) problems.push(`${s.id}: 날씨 ${w}`);
    }
    for (const c of CHAR_ORDER) {
      if (!TRACES[c]?.length) problems.push(`${c}: 흔적 없음`);
      if (!INVITES[c]?.length || !INVITE_REPLY[c] || !DECLINE_REPLY[c]) problems.push(`${c}: 약속 문구 없음`);
      if (!SCENES[`promise.${c}`]) problems.push(`promise.${c} 장면 없음`);
      for (const t of TRACES[c] ?? []) if (t.includes(CHARACTERS_NAMES[c])) problems.push(`${c}: 흔적에 이름이 드러남`);
    }
    expect(problems).toEqual([]);
  });
});

describe('메신저', () => {
  const ROOMS = [...CHAR_ORDER, 'jiyu', 'mom'] as string[];
  const KEY = /^(main:\w+\.\d+|meet:\w+|promise:(kept|declined):\w+|weather:(rain|snow)|exam:(top|high|mid|low)|sports:(win|lose)|festival:(ok|fail)|counsel:(hint|decide)|suneung|jealous:(ian|mujin)|dream:\w+|turn:\d+|month:\d+|year:[123]|allowance|idle|stress|tired|slump|vac:\w+)$/;
  it('대화 장면의 방·사건·말하는 사람이 올바르다', () => {
    const problems: string[] = [];
    const photos = new Set<string>();
    for (const sc of Object.values(SCENES).filter(x => x.id.startsWith('chat.') || x.id.startsWith('call.'))) {
      const room = sc.id.split('.')[1];
      if (!ROOMS.includes(room)) { problems.push(`${sc.id}: 방 ${room} 없음`); continue; }
      if (sc.id.startsWith('chat.')) {
        const on = (sc.attrs.on ?? '').split(',').filter(Boolean);
        if (!on.length) problems.push(`${sc.id}: on= 이 필요`);
        for (const k of on) if (!KEY.test(k)) problems.push(`${sc.id}: 알 수 없는 사건 ${k}`);
        for (const k of on) if (k.startsWith('dream:') && !DREAMS.some(d => d.id === k.slice(6))) problems.push(`${sc.id}: 전생 기억 ${k.slice(6)} 없음`);
        for (const k of on) if (k.startsWith('main:') && !SCENES[`main.${k.slice(5)}`]) problems.push(`${sc.id}: 메인 이벤트 ${k.slice(5)} 없음`);
        if (sc.attrs.if) { const e = checkCond(sc.attrs.if); if (e) problems.push(`${sc.id}: ${e}`); }
      } else if (!(CHAR_ORDER as string[]).includes(room)) problems.push(`${sc.id}: 먼저 연락하기는 인물만`);
      walk(sc.nodes, n => {
        if (n.t === 'say' && n.who && n.who !== 'me' && (CHAR_ORDER as string[]).includes(n.who) && n.who !== room) problems.push(`${sc.file}:${n.line} ${room} 방에 ${n.who} 대사`);
        if (n.t === 'cmd' && n.name === 'photo') { if (photos.has(n.args[0])) problems.push(`${sc.file}:${n.line} 사진 id 중복 ${n.args[0]}`); photos.add(n.args[0]); }
      });
    }
    for (const c of CHAR_ORDER) for (const t of ['hello', 'promise', 'worry', 'dream']) if (!SCENES[`call.${c}.${t}`]) problems.push(`call.${c}.${t} 없음`);
    expect(problems).toEqual([]);
  });
});
