import type { Chip } from '@/store/ui';

export function Chips({ chips }: { chips: Chip[] }) {
  if (!chips.length) return null;
  return <div className="chips">{chips.map((c, i) => <span key={i} className={`chip ${c.tone}`}>{c.label}</span>)}</div>;
}
