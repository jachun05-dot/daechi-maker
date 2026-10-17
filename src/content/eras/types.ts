/* =========================================================
   전생 시대 팩 — 전생(밤) 쪽 설정만 모은 묶음
   현생(대치동) 쪽은 그대로 두고, 이 팩만 갈아 끼우면 전생 시대가 바뀐다.
   새 시대 만들기: docs/ARCHITECTURE.md 「전생 시대 바꾸기」
   ========================================================= */
import type { CareerId, CharId } from '@/engine/types';

export interface EraPast {
  /** 밤(전생) 장면 이름표에 뜨는 이름 */
  past: string;
  pastHanja: string;
  /** 한 줄 역할 */
  pastRole: string;
  /** 도감에 나오는 전생 설명 */
  pastDesc: string;
}

export interface EraCareer {
  past: string;          // {past}      — 전생의 나
  role: string;          // {role}      — 짧은 호칭
  item: string;          // {item}      — 꿈속에서 쥐고 있는 물건
  pastDream: string;     // {pastDream} — 전생에 품었던 꿈
}

export interface EraPack {
  id: string;
  /** 설정 화면·문서용 이름 */
  name: string;
  /** 사건과 시기 (예: '임진왜란 · 1592–1593') */
  period: string;
  /** 크레딧 「그리고」 문단. 줄바꿈은 \n */
  dedication: string;
  chars: Record<CharId, EraPast>;
  careers: Record<CareerId, EraCareer>;
  /** 밤(전생) 배경. 이미지는 src/assets/images/eras/{id}/bg/{key}.jpg 또는 공용 bg/ */
  backgrounds: Record<string, { label: string; color: string; focus?: string }>;
}
