/* =========================================================
   등장인물
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
  where: string;         // 주로 만날 수 있는 곳 (도감 힌트)
  stat: string;          // 관련 스탯 (도감 표기용)
  desc: string;
  pastDesc: string;
  romanceable: boolean;
}

export const CHARACTERS: Record<CharId, Character> = {
  ian: {
    id: 'ian', name: '이안', hanja: '李安', past: '영안대군', pastHanja: '永安大君',
    role: '이화고 3학년 선배', pastRole: '비운의 막내 왕자', color: '#6f86c6',
    where: '이화고 도서관(평일 오후) · 대치동 스터디카페(평일 야간)', stat: '학업',
    desc: '햇빛에 녹아버릴 것처럼 하얗고 병약한 선배. 그러나 위험이 스치면 서늘한 왕자의 눈빛으로 돌변한다.',
    pastDesc: '왜란의 피란길에 홀로 버려진 열세 살의 막내 왕자. 자신을 지키다 쓰러진 의병을 그저 바라봐야만 했다.',
    romanceable: true,
  },
  mujin: {
    id: 'mujin', name: '강무진', hanja: '姜武眞', past: '부장 강무진', pastHanja: '姜武眞',
    role: '이화고 3학년 운동부 선배', pastRole: '과묵한 호위무사·의병 부장', color: '#8a6a4f',
    where: '이화고 체육관(평일 오후) · 한강 조깅(주말 오전)', stat: '근력 · 감응력',
    desc: '188cm, 까무잡잡한 피부, 극도로 적은 말수. 무심하게 초코우유와 밴드를 챙겨주는 순애보. 팔뚝에 태생적 흉터가 있다.',
    pastDesc: '연모한다는 말 한마디 못 한 채, 주인공의 등 뒤를 지키며 왜군의 칼날을 온몸으로 막아낸 무사.',
    romanceable: true,
  },
  sihyun: {
    id: 'sihyun', name: '류시현', hanja: '柳時賢', past: '악공 시현', pastHanja: '柳時賢',
    role: '홍대 밴드 기타리스트', pastRole: '거문고 가객 출신 첩보원', color: '#7a68a6',
    where: '홍대 라이브 클럽(주말 저녁) · 낙원상가 악기점(주말 오후)', stat: '예술',
    desc: '은발 탈색모에 피어싱, 나른하고 퇴폐적인 나쁜 남자. “대치동 범생이 아가씨”라 놀리지만, 지친 숨통을 틔워주는 사람.',
    pastDesc: '주인공의 예술을 알아본 천민 출신 천재 악공. 왜군 진영의 기밀을 빼내다 발각되어, 끝내 그녀를 불지 않고 처형당했다.',
    romanceable: true,
  },
  seoha: {
    id: 'seoha', name: '윤서하', hanja: '尹書河', past: '광대 서하', pastHanja: '尹書河',
    role: '대학로 배우 지망생', pastRole: '비극의 광대·기록관', color: '#c07a66',
    where: '대학로 소극장(주말 오후/저녁) · 연기 학원(평일 야간)', stat: '감수성 · 매력',
    desc: '섬세하고 다정한 예술가. 주인공의 꿈을 누구보다 진심으로 응원한다. 연기할 때는 처절하리만치 깊은 눈빛이 된다.',
    pastDesc: '탈을 쓰고 의병들을 위로하던 광대. 최후의 전투 전날 밤 주인공을 기록으로 남기고, 성안에서 함께 산화했다.',
    romanceable: true,
  },
  taejun: {
    id: 'taejun', name: '한태준', hanja: '韓泰俊', past: '한 도령', pastHanja: '韓泰俊',
    role: '청담동 재벌가 외아들', pastRole: '권문세가 양반가 외아들', color: '#b8933c',
    where: '대치동 VVIP 과외(평일 야간) · 청담동 라운지(주말 오후) · 한남동 파티(주말 저녁)', stat: '화술 · 용돈',
    desc: '온몸을 명품으로 두른 까칠한 츤데레 도련님. 그러나 극성스러운 어머니의 통제 아래 숨 쉬는 법을 잊었다.',
    pastDesc: '의병대에 군자금을 대려 했으나 어머니의 협박에 못 이겨 주인공을 외면했다. 평생을 죄책감 속에 살았다.',
    romanceable: true,
  },
  saya: {
    id: 'saya', name: '김사야', hanja: '金沙也', past: '사야가', pastHanja: '沙也可',
    role: '한성국제고 · 일본 혼혈', pastRole: '조선에 귀화한 일본 장수(항왜)', color: '#a0675a',
    where: '한성국제고 교류회(평일 오후) · 경복궁·박물관(주말 오후)', stat: '화술 · 감응력',
    desc: '신비로운 갈색 눈동자, 조각 같은 얼굴, 능글맞은 미소. 가장 설레게 다가오지만, 끝내 무언가를 숨기고 있다.',
    pastDesc: '조선을 침략한 왜군 장수였으나, 의병인 주인공을 만나 귀화(항왜)했다. 왜군과 싸우다 그녀를 구하고 전사했다.',
    romanceable: false,
  },
};

export const CHAR_ORDER: CharId[] = ['ian', 'mujin', 'sihyun', 'seoha', 'taejun', 'saya'];
export const isCharId = (s: string): s is CharId => s in CHARACTERS;

/** 메신저에 등장하는 조연 */
export const NPCS: Record<string, { name: string; color: string }> = {
  mom: { name: '엄마', color: '#d9849b' },
  jiyu: { name: '단짝 지유', color: '#d8a548' },
};
