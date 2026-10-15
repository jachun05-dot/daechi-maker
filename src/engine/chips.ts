/* 변화량 → 화면 표시용 칩 */
import type { Chip } from '@/store/ui';
import type { CharId } from './types';
import type { Delta } from './timetable';
import { BASE_LABEL, SKILL_LABEL, BASE_KEYS, SKILL_KEYS } from '@/content/careers';
import { CHARACTERS } from '@/content/characters';

export const shortMoney = (v: number) => {
  const s = v > 0 ? '+' : v < 0 ? '−' : '';
  const a = Math.abs(Math.round(v));
  return s + (a >= 10000 ? `${+(a / 10000).toFixed(1)}만` : a.toLocaleString('ko-KR'));
};
export const won = (n: number) => `${Math.round(n).toLocaleString('ko-KR')}원`;
/** 소수 스탯 표시: 1 이상은 정수, 그 아래는 소수 한 자리 */
export const num = (v: number) => (Math.abs(v) >= 1 ? String(Math.round(v)) : (Math.round(v * 10) / 10).toString());

const ORDER = ['hp', 'stress', 'money', ...BASE_KEYS, ...SKILL_KEYS] as (keyof Delta)[];
const LABEL: Record<string, string> = { hp: '체력', stress: '스트레스', money: '용돈', ...BASE_LABEL, ...SKILL_LABEL };

export function deltaChips(d: Delta): Chip[] {
  return ORDER.filter(k => d[k] && Math.abs(d[k]!) >= 0.05).map(k => {
    const v = d[k]!;
    if (k === 'money') return { label: `용돈 ${shortMoney(v)}`, tone: 'money' };
    const good = k === 'stress' ? v < 0 : v > 0;
    return { label: `${LABEL[k]} ${v > 0 ? '+' : '−'}${num(Math.abs(v))}`, tone: good ? 'up' : 'down' };
  });
}

export function affChips(diff: Partial<Record<CharId, number>>): Chip[] {
  return Object.entries(diff).filter(([, v]) => v).map(([k, v]) => ({
    label: `${CHARACTERS[k as CharId].name} 호감 ${v! > 0 ? '+' : '−'}${Math.abs(v!)}`, tone: v! > 0 ? 'heart' : 'down',
  }));
}
