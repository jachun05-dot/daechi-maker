/* 변화량 → 화면 표시용 칩 */
import type { Chip } from '@/store/ui';
import type { CharId, ResKey, StatKey } from './types';
import type { Delta } from './schedule';
import { RES_LABEL, STAT_LABEL } from './schedule';
import { CHARACTERS } from '@/content/characters';

export const shortMoney = (v: number) => {
  const s = v > 0 ? '+' : v < 0 ? '−' : '';
  const a = Math.abs(v);
  return s + (a >= 10000 ? `${+(a / 10000).toFixed(1)}만` : a.toLocaleString('ko-KR'));
};
export const won = (n: number) => `${n.toLocaleString('ko-KR')}원`;

const ORDER: (StatKey | ResKey)[] = ['hp', 'stress', 'money', 'int', 'art', 'sense', 'cha', 'charm', 'spirit', 'fit'];

export function deltaChips(d: Delta): Chip[] {
  return ORDER.filter(k => d[k]).map(k => {
    const v = d[k]!;
    if (k === 'money') return { label: `용돈 ${shortMoney(v)}`, tone: 'money' };
    const label = (STAT_LABEL as Record<string, string>)[k] ?? RES_LABEL[k as ResKey];
    const good = k === 'stress' ? v < 0 : v > 0;
    return { label: `${label} ${v > 0 ? '+' : '−'}${Math.abs(v)}`, tone: good ? 'up' : 'down' };
  });
}

export function affChips(diff: Partial<Record<CharId, number>>): Chip[] {
  return Object.entries(diff).filter(([, v]) => v).map(([k, v]) => ({ label: `${CHARACTERS[k as CharId].name} 호감 +${v}`, tone: 'heart' }));
}
