/* =========================================================
   등장인물 — 설정 원본은 docs/CHARACTERS.md
   - 스탠딩 이미지는 src/assets/images/chars/{id}/ 폴더에 넣으세요. (README 참고)
   - color: 이름표·호감도 등 UI 포인트 색
   - 전생 이름·역할은 src/content/eras/{시대}/index.ts
   ========================================================= */
import type { CharId } from '@/engine/types';
import { ERA } from './eras';
import type { EraPast } from './eras/types';

/** 현생(대치동) 쪽 설정. 전생 쪽(past·pastRole·pastDesc)은 전생 시대 팩에서 붙는다 */
interface CharacterBase {
  id: CharId;
  name: string;
  hanja: string;
  role: string;
  color: string;
  desc: string;
  romanceable: boolean;
  /** 마지막 선택지에 나오는 문장 */
  finalChoice: string;
}
export type Character = CharacterBase & EraPast;

const BASE: Record<CharId, CharacterBase> = {
  ian: {
    id: 'ian', name: '이안', hanja: '李安',
    role: '이화고 · 동급생 · 로열패밀리', color: '#5f78b8',
    desc: '외모·성적·집안·매너 모두 완벽한 왕자님. 겉으로는 남을 깔보지만, 이용하려 다가오는 사람이 많아서 생긴 방어기제다. 본래는 다정하고 부드럽다.',
    romanceable: true, finalChoice: '이안에게 간다',
  },
  mujin: {
    id: 'mujin', name: '강무진', hanja: '姜武眞',
    role: '이화고 · 동급생 · 체육 특기생', color: '#8a6a4f',
    desc: '188cm, 까무잡잡한 피부, 리트리버 같은 대형견. 가난하지만 탈인간급 운동 재능으로 이안 집안의 후원을 받는다. 이안을 지키는 걸 당연한 의무로 여긴다.',
    romanceable: true, finalChoice: '무진에게 간다',
  },
  doyun: {
    id: 'doyun', name: '차도윤', hanja: '車度允',
    role: '이화고 · 한 학년 위 선배 · 전교 1등', color: '#4f6f6a',
    desc: '안경 쓴 이과 감성의 너드. 사람을 변수로 계산하고, 쓸모없다고 판단한 사람에게는 대놓고 무례하다. 맞는 선택을 하고도 한 번도 이해받아 본 적 없는 사람.',
    romanceable: true, finalChoice: '도윤 선배에게 간다',
  },
  taejun: {
    id: 'taejun', name: '한태준', hanja: '韓泰俊',
    role: '청담동 졸부 집안 장남', color: '#b8933c',
    desc: '명품으로 휘감은 까칠한 츤데레. 살 수 있는 건 많은데, 스스로 결정할 수 있는 건 적다. 어머니의 전화가 오면 표정이 굳는다.',
    romanceable: true, finalChoice: '태준에게 간다',
  },
  seoha: {
    id: 'seoha', name: '윤서하', hanja: '尹書河',
    role: '한 살 연하 · 배우 지망생 (2학년부터 이화고 후배)', color: '#c07a66',
    desc: '사람의 속을 꿰뚫어 보는 신비로운 예술가. 관찰한 것을 수첩에 기록한다. 그런데 여주만은 읽히지 않는다.',
    romanceable: true, finalChoice: '서하에게 간다',
  },
  ihyun: {
    id: 'ihyun', name: '김이현', hanja: '金怡現',
    role: '한성국제고 · 일본 혼혈', color: '#a0675a',
    desc: '신비로운 갈색 눈동자에 능글맞은 플러팅. 아버지는 일본 기업 총수. 불치성 심장 질환을 끝까지 웃으며 숨긴다.',
    romanceable: false, finalChoice: '공항으로 간다',
  },
  sihyun: {
    id: 'sihyun', name: '류시현', hanja: '柳時賢',
    role: '홍대 밴드 기타리스트 (설정 보류)', color: '#7a68a6',
    desc: '은발에 피어싱, 나른하고 퇴폐적인 분위기. 여주를 "대치동 범생이 아가씨"라 부른다. (설정 재검토 중)',
    romanceable: true, finalChoice: '시현에게 간다',
  },
};

/** 현생 설정 + 지금 전생 시대 팩의 전생 설정 */
export const CHARACTERS = Object.fromEntries(
  Object.entries(BASE).map(([id, c]) => [id, { ...c, ...ERA.chars[id as CharId] }]),
) as Record<CharId, Character>;

export const CHAR_ORDER: CharId[] = ['ian', 'mujin', 'doyun', 'taejun', 'seoha', 'ihyun', 'sihyun'];
export const ROMANCEABLE: CharId[] = CHAR_ORDER.filter(c => CHARACTERS[c].romanceable);
export const isCharId = (s: string): s is CharId => s in CHARACTERS;

/** 메신저에 등장하는 조연 */
export const NPCS: Record<string, { name: string; color: string }> = {
  mom: { name: '엄마', color: '#d9849b' },
  jiyu: { name: '단짝 지유', color: '#d8a548' },
};
