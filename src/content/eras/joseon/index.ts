/* =========================================================
   전생 시대 팩 — 조선 · 임진왜란 (기본)
   이야기: ./stories/ (프롤로그 · 전생 꿈)
   그림:   src/assets/images/eras/joseon/ (진주성 · 손 CG · 타이틀)
   ========================================================= */
import type { EraPack } from '../types';

export const joseon: EraPack = {
  id: 'joseon',
  name: '조선 · 임진왜란',
  period: '임진왜란 · 1592–1593',
  dedication: '대치동의 밤을 견뎌 낸 모든 학생들과\n사백삼십여 년 전,\n꿈을 품에 넣고 칼을 들었던\n이름 없는 의병들에게',

  chars: {
    ian: {
      past: '영안대군', pastHanja: '永安大君', pastRole: '미끼로 버려진 왕자',
      pastDesc: '왕의 피란길에서 미끼로 버려진 왕자. 호위무사 강무진과 단둘이 남았고, 의병인 여주가 두 사람을 발견해 보호했다.',
    },
    mujin: {
      past: '호위무사 강무진', pastHanja: '姜武眞', pastRole: '영안대군의 호위무사',
      pastDesc: '미끼로 버려진 왕자와 단둘이 남은 호위무사. 우연이 아니라, 가장 믿을 만한 무사라서 선택된 사람이었다.',
    },
    doyun: {
      past: '책사 차도윤', pastHanja: '車度允', pastRole: '왕의 책사',
      pastDesc: '왕자를 미끼로 버리자는 계책을 낸 책사. 그 계책의 진짜 의도는 아무도 몰랐다.',
    },
    taejun: {
      past: '한 도령', pastHanja: '韓泰俊', pastRole: '양반가 도련님',
      pastDesc: '의병대와 여주에게 지원을 약속했지만, 어머니의 협박에 못 이겨 약속을 깨고 도망쳤다.',
    },
    seoha: {
      past: '광대 서하', pastHanja: '尹書河', pastRole: '광대 겸 기록관',
      pastDesc: '왕실과 민중의 비극을 기록하던 광대. 왕자를 버린 왕실의 치부를 기록했다가 쫓겨, 여주 일행에 합류했다.',
    },
    ihyun: {
      past: '사야가', pastHanja: '沙也可', pastRole: '조선에 귀화한 왜군 장수',
      pastDesc: '여주를 지키려 가문을 저버리고 조선에 귀화한 왜군 선봉장. 가문에 대한 죄책감으로 여주보다 먼저 스스로 생을 끝냈다.',
    },
    sihyun: {
      past: '악공 시현', pastHanja: '柳時賢', pastRole: '거문고 악공 출신 첩보원',
      pastDesc: '천민 출신 거문고 악공. 왜군 진영의 기밀을 빼내 의병에게 넘겼다. (설정 재검토 중)',
    },
  },

  careers: {
    med:    { past: '의녀 출신 의병', role: '의병 의녀', item: '약초 주머니와 은침', pastDream: '조선 제일의 명의' },
    idol:   { past: '예인 출신 첩보 의병', role: '의병 예인', item: '가야금과 밀서를 숨긴 은비녀', pastDream: '조선 최고의 가무 예인' },
    actor:  { past: '광대 출신 연락책 의병', role: '의병 광대', item: '바가지 탈과 소고', pastDream: '세상을 웃기고 울리는 이야기꾼' },
    leader: { past: '몰락 양반가의 책사 겸 의병장', role: '의병장', item: '낡은 병법서와 붓 한 자루', pastDream: '신분의 벽이 없는 세상' },
  },

  backgrounds: {
    burning:    { label: '불타는 마을',          color: '#4a120c' },
    mountain:   { label: '피란길 산길',          color: '#1d2427' },
    camp:       { label: '의병 진영',            color: '#2e140c' },
    fortress:   { label: '진주성',               color: '#3a1009', focus: '28% center' },
    river:      { label: '달밤의 강·암자',       color: '#151c28' },
    enemy:      { label: '왜군 진영',            color: '#2a0c14' },
    field:      { label: '전장',                 color: '#2a100b' },
    mansion:    { label: '양반가·약방',          color: '#2c231c' },
    moonfield:  { label: '달빛 아래 배꽃 들판',  color: '#2a2620' },
    market:     { label: '장터',                 color: '#3a2a1e' },
    palace_n:   { label: '밤의 임금 막사',       color: '#1a1420' },
  },
};
