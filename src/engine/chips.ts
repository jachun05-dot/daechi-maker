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
/** 스탯 표시 — 화면에는 정수만 (안에서는 소수로 쌓인다) */
export const num = (v: number) => String(Math.floor(v + 1e-9));

const ORDER = ['hp', 'stress', 'money', ...BASE_KEYS, ...SKILL_KEYS] as (keyof Delta)[];
const LABEL: Record<string, string> = { hp: '체력', stress: '스트레스', money: '용돈', ...BASE_LABEL, ...SKILL_LABEL };

export function deltaChips(d: Delta): Chip[] {
  return ORDER.filter(k => d[k] && Math.abs(d[k]!) >= 0.05).map(k => {
    const v = d[k]!;
    if (k === 'money') return { label: `용돈 ${shortMoney(v)}`, tone: 'money' };
    const good = k === 'stress' ? v < 0 : v > 0;
    // 0.5 미만은 숫자 대신 화살표 (소수점을 보이지 않는다)
    const n = Math.round(Math.abs(v));
    return { label: `${LABEL[k]} ${n ? `${v > 0 ? '+' : '−'}${n}` : v > 0 ? '▲' : '▼'}`, tone: good ? 'up' : 'down' };
  });
}

/** 호감 변화 — 숫자는 숨기고 크기만 (♥▲ 조금 · ♥▲▲ 크게) */
export function affChips(diff: Partial<Record<CharId, number>>): Chip[] {
  return Object.entries(diff).filter(([, v]) => v).map(([k, v]) => ({
    label: `${CHARACTERS[k as CharId].name} ♥${v! > 0 ? (v! >= 5 ? '▲▲' : '▲') : (v! <= -5 ? '▼▼' : '▼')}`, tone: v! > 0 ? 'heart' : 'down',
  }));
}
