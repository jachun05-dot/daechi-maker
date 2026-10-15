/* =========================================================
   이미지 자동 연결
   src/assets/images/ 아래에 정해진 이름으로 파일을 넣으면 코드 수정 없이 화면에 나온다.
   (확장자: png / jpg / jpeg / webp / gif / avif) — 이름 규칙은 README 참고
   ========================================================= */
const files = import.meta.glob('/src/assets/images/**/*.{png,jpg,jpeg,webp,gif,avif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const byKey: Record<string, string> = {};
for (const [path, url] of Object.entries(files)) byKey[path.replace('/src/assets/images/', '').replace(/\.\w+$/, '')] = url;

export const image = (key: string): string | undefined => byKey[key];

/** 스탠딩: 밤이면 past_표정 → past_default → 표정 → default 순으로 찾는다 */
export function standImage(id: string, expr: string, night: boolean) {
  const keys = night ? [`past_${expr}`, 'past_default', expr, 'default'] : [expr, 'default'];
  for (const k of keys) { const u = byKey[`chars/${id}/${k}`]; if (u) return u; }
  return undefined;
}
export const standPath = (id: string, expr: string, night: boolean) => `chars/${id}/${night ? 'past_' : ''}${expr}.png`;

export const bgImage = (key: string) => byKey[`bg/${key}`];
export const cgImage = (key: string) => byKey[`cg/${key}`];
export const avatarImage = (id: string) => byKey[`chars/${id}/avatar`];
export const scheduleImage = (id: string) => byKey[`schedule/${id}`];
export const uiImage = (key: string) => byKey[`ui/${key}`];
export const photoImage = (id: string) => byKey[`photo/${id}`];
