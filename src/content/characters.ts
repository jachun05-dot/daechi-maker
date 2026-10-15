/* =========================================================
   등장인물 — 설정 원본은 docs/CHARACTERS.md
   - 스탠딩 이미지는 src/assets/images/chars/{id}/ 폴더에 넣으세요. (README 참고)
   - color: 이름표·호감도 등 UI 포인트 색
   ========================================================= */
import type { CharId } from '@/engine/types';

export interface Character {
  id: CharId;
  name: string;
  hanja: string;
  past: string;          // 밤(전생) 장면에서 이름표에 표시되는 이름
  pastHanja: string;
  role: string;
  pastRole: string;
  color: string;
  desc: string;
  pastDesc: string;
  romanceable: boolean;
  /** 마지막 선택지에 나오는 문장 */
  finalChoice: string;
}

export const CHARACTERS: Record<CharId, Character> = {
  ian: {
    id: 'ian', name: '이안', hanja: '李安', past: '영안대군', pastHanja: '永安大君',
    role: '이화고 · 동급생 · 로열패밀리', pastRole: '미끼로 버려진 왕자', color: '#5f78b8',
    desc: '외모·성적·집안·매너 모두 완벽한 왕자님. 겉으로는 남을 깔보지만, 이용하려 다가오는 사람이 많아서 생긴 방어기제다. 본래는 다정하고 부드럽다.',
    pastDesc: '왕의 피란길에서 미끼로 버려진 왕자. 호위무사 강무진과 단둘이 남았고, 의병인 여주가 두 사람을 발견해 보호했다.',
    romanceable: true, finalChoice: '이안에게 간다',
  },
  mujin: {
    id: 'mujin', name: '강무진', hanja: '姜武眞', past: '호위무사 강무진', pastHanja: '姜武眞',
    role: '이화고 · 동급생 · 체육 특기생', pastRole: '영안대군의 호위무사', color: '#8a6a4f',
    desc: '188cm, 까무잡잡한 피부, 리트리버 같은 대형견. 가난하지만 탈인간급 운동 재능으로 이안 집안의 후원을 받는다. 이안을 지키는 걸 당연한 의무로 여긴다.',
    pastDesc: '미끼로 버려진 왕자와 단둘이 남은 호위무사. 우연이 아니라, 가장 믿을 만한 무사라서 선택된 사람이었다.',
    romanceable: true, finalChoice: '무진에게 간다',
  },
  doyun: {
    id: 'doyun', name: '차도윤', hanja: '車度允', past: '책사 차도윤', pastHanja: '車度允',
    role: '이화고 · 한 학년 위 선배 · 전교 1등', pastRole: '왕의 책사', color: '#4f6f6a',
    desc: '안경 쓴 이과 감성의 너드. 사람을 변수로 계산하고, 쓸모없다고 판단한 사람에게는 대놓고 무례하다. 맞는 선택을 하고도 한 번도 이해받아 본 적 없는 사람.',
    pastDesc: '왕자를 미끼로 버리자는 계책을 낸 책사. 그 계책의 진짜 의도는 아무도 몰랐다.',
    romanceable: true, finalChoice: '도윤 선배에게 간다',
  },
  taejun: {
    id: 'taejun', name: '한태준', hanja: '韓泰俊', past: '한 도령', pastHanja: '韓泰俊',
    role: '청담동 졸부 집안 장남', pastRole: '양반가 도련님', color: '#b8933c',
    desc: '명품으로 휘감은 까칠한 츤데레. 살 수 있는 건 많은데, 스스로 결정할 수 있는 건 적다. 어머니의 전화가 오면 표정이 굳는다.',
    pastDesc: '의병대와 여주에게 지원을 약속했지만, 어머니의 협박에 못 이겨 약속을 깨고 도망쳤다.',
    romanceable: true, finalChoice: '태준에게 간다',
  },
  seoha: {
    id: 'seoha', name: '윤서하', hanja: '尹書河', past: '광대 서하', pastHanja: '尹書河',
    role: '한 살 연하 · 배우 지망생 (2학년부터 이화고 후배)', pastRole: '광대 겸 기록관', color: '#c07a66',
    desc: '사람의 속을 꿰뚫어 보는 신비로운 예술가. 관찰한 것을 수첩에 기록한다. 그런데 여주만은 읽히지 않는다.',
    pastDesc: '왕실과 민중의 비극을 기록하던 광대. 왕자를 버린 왕실의 치부를 기록했다가 쫓겨, 여주 일행에 합류했다.',
    romanceable: true, finalChoice: '서하에게 간다',
  },
  ihyun: {
    id: 'ihyun', name: '김이현', hanja: '金怡現', past: '사야가', pastHanja: '沙也可',
    role: '한성국제고 · 일본 혼혈', pastRole: '조선에 귀화한 왜군 장수', color: '#a0675a',
    desc: '신비로운 갈색 눈동자에 능글맞은 플러팅. 아버지는 일본 기업 총수. 불치성 심장 질환을 끝까지 웃으며 숨긴다.',
    pastDesc: '여주를 지키려 가문을 저버리고 조선에 귀화한 왜군 선봉장. 가문에 대한 죄책감으로 여주보다 먼저 스스로 생을 끝냈다.',
    romanceable: false, finalChoice: '공항으로 간다',
  },
  sihyun: {
    id: 'sihyun', name: '류시현', hanja: '柳時賢', past: '악공 시현', pastHanja: '柳時賢',
    role: '홍대 밴드 기타리스트 (설정 보류)', pastRole: '거문고 악공 출신 첩보원', color: '#7a68a6',
    desc: '은발에 피어싱, 나른하고 퇴폐적인 분위기. 여주를 "대치동 범생이 아가씨"라 부른다. (설정 재검토 중)',
    pastDesc: '천민 출신 거문고 악공. 왜군 진영의 기밀을 빼내 의병에게 넘겼다. (설정 재검토 중)',
    romanceable: true, finalChoice: '시현에게 간다',
  },
};

export const CHAR_ORDER: CharId[] = ['ian', 'mujin', 'doyun', 'taejun', 'seoha', 'ihyun', 'sihyun'];
export const ROMANCEABLE: CharId[] = CHAR_ORDER.filter(c => CHARACTERS[c].romanceable);
export const isCharId = (s: string): s is CharId => s in CHARACTERS;

/** 메신저에 등장하는 조연 */
export const NPCS: Record<string, { name: string; color: string }> = {
  mom: { name: '엄마', color: '#d9849b' },
  jiyu: { name: '단짝 지유', color: '#d8a548' },
};
