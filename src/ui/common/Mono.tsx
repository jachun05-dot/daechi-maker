/* 이미지가 있으면 이미지, 없으면 글자 한 자를 넣은 타일 */
export function Mono({ src, text, color, round, size = 42 }: { src?: string; text: string; color?: string; round?: boolean; size?: number }) {
  return (
    <div className={`mono${round ? ' round' : ''}`} style={{ width: size, height: size, fontSize: size * 0.42, color: color ?? undefined, background: color ? `color-mix(in srgb, ${color} 14%, var(--chip))` : undefined }}>
      {src ? <img src={src} alt="" /> : text}
    </div>
  );
}
