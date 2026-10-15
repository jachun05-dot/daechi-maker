/* 선 아이콘 모음 (외부 의존성 없이 SVG) */
const PATHS: Record<string, string> = {
  calendar: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  profile: 'M4 5h16v14H4zM8 11a2 2 0 1 0 4 0 2 2 0 0 0-4 0M6.5 16c.6-1.6 2-2.5 3.5-2.5s2.9.9 3.5 2.5M15 10h3M15 13h3',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1ZM11 18h2',
  scroll: 'M7 4h11a2 2 0 0 1 0 4H7M7 4a2 2 0 0 0 0 4M7 8v10a2 2 0 0 0 2 2h9M7 20a2 2 0 0 1-2-2V6M10 12h5M10 15h5',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM19 12l2-1-1-3-2 .2-1.3-1.3L17 5l-3-1-1 2h-2L10 4 7 5l.3 2L6 8.2 4 8l-1 3 2 1v0l-2 1 1 3 2-.2 1.3 1.3L7 19l3 1 1-2h2l1 2 3-1-.3-2 1.3-1.3 2 .3 1-3Z',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6 6 18',
  play: 'M7 5v14l11-7Z',
  undo: 'M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
  sparkle: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8Z',
  heart: 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z',
};

export function Icon({ name, size = 22 }: { name: keyof typeof PATHS | string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[name] ?? ''} />
    </svg>
  );
}
