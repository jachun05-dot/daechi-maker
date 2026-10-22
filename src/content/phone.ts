/* =========================================================
   메신저 설정 — 대화 내용은 src/content/stories/chat/*.story
   - HABIT: 인물별 톡 습관 (주로 보내는 시각, 먼저 연락했을 때 답이 오기까지 걸리는 날)
   - IGNORE: 답장 기한(balance.ts phone.deadline)을 넘겼을 때
       read   = 읽씹 (읽고 답을 안 함) / unread = 안읽씹 (아예 안 읽음)
       aff: 잃는 호감도 · lines: 상대가 덧붙여 보내는 말 ("" 로 시작하면 시스템 문구)
       stress: 내 스트레스 변화 (엄마·지유)
   - TOPICS: 먼저 연락하기 주제 — 고르면 me 말풍선으로 나가고, call.{인물}.{주제} 장면이 답한다
   ========================================================= */
import type { CharId } from '@/engine/types';

export type Room = CharId | 'jiyu' | 'mom';
/** 여주가 존댓말을 쓰는 상대 */
export const POLITE: CharId[] = ['doyun'];

export const HABIT: Record<Room, { hours: [number, number]; replyDelay: number }> = {
  ian:    { hours: [23, 24], replyDelay: 1 },   // 밤 11시대. 늦게 읽고 다음 날 답한다
  mujin:  { hours: [19, 22], replyDelay: 0 },   // 훈련 끝나고 바로. 답이 빛의 속도
  doyun:  { hours: [21, 23], replyDelay: 0 },   // 용건만, 칼같이
  taejun: { hours: [2, 4],   replyDelay: 0 },   // 새벽
  seoha:  { hours: [22, 24], replyDelay: 0 },   // 공연 끝나고
  ihyun:  { hours: [20, 23], replyDelay: 0 },
  sihyun: { hours: [1, 3],   replyDelay: 1 },   // 새벽 합주 끝나고, 답은 하루 뒤
  jiyu:   { hours: [22, 24], replyDelay: 0 },
  mom:    { hours: [18, 21], replyDelay: 0 },
};

export interface IgnoreRule { aff: number; stress?: number; lines: string[] }
export const IGNORE: Record<Room, { read: IgnoreRule; unread: IgnoreRule }> = {
  ian: {
    read:   { aff: 4, lines: ['…그래.'] },                                   // 자존심. 봤는데 무시당한 건 오래 간다
    unread: { aff: 1, lines: [] },                                            // 원래 기대 안 했다는 얼굴
  },
  mujin: {
    read:   { aff: 2, lines: ['괜찮아!! ㅎㅎ', '…괜찮아'] },
    unread: { aff: 1, lines: ['자?', '바빠?', '밥은 먹었어?'] },
  },
  doyun: {
    read:   { aff: 1, lines: ['답이 없는 것도 답이지.'] },
    unread: { aff: 0, lines: [] },                                            // 신경 안 쓴다 (쓰는 척도 안 한다)
  },
  taejun: {
    read:   { aff: 5, lines: ['"메시지를 삭제했습니다'] },                     // 가장 아프게 받아들인다
    unread: { aff: 3, lines: ['…나 뭐 잘못했어?'] },
  },
  seoha: {
    read:   { aff: 2, lines: ['오늘의 기록. "답장 없음."'] },
    unread: { aff: 1, lines: ['선배 바쁜 거 알아요. 기다리는 거 연습 중이에요.'] },
  },
  ihyun: {
    read:   { aff: 3, lines: ['나 차인 거야? 😆'] },
    unread: { aff: 1, lines: ['"사진을 보냈습니다'] },
  },
  sihyun: {
    read:   { aff: 3, lines: ['"음성메시지 0:03 — "…됐다."'] },
    unread: { aff: 0, lines: [] },
  },
  jiyu: {
    read:   { aff: 0, stress: 2, lines: ['야 읽었으면 답을 해라 ㅡㅡ'] },
    unread: { aff: 0, lines: ['살아는 있지?'] },
  },
  mom: {
    read:   { aff: 0, stress: 4, lines: ['엄마 메시지 읽고 답 안 하니?'] },
    unread: { aff: 0, stress: 2, lines: ['전화 좀 받아.'] },
  },
};

export type Topic = 'hello' | 'promise' | 'worry' | 'dream';
/** polite: 선배(도윤)에게 보낼 때 */
export const TOPICS: Record<Topic, { label: string; text: string; polite: string; desc: string }> = {
  hello:   { label: '안부',          text: '뭐 해?', polite: '선배, 뭐 해요?', desc: '근황을 묻는다' },
  promise: { label: '주말 약속',     text: '이번 주말에 시간 돼?', polite: '이번 주말에 시간 돼요?', desc: '조금 친해지면 · 수락하면 주말 약속(데이트)이 잡힌다' },
  worry:   { label: '고민 털어놓기', text: '나 요즘 좀 힘들어…', polite: '저 요즘 좀 힘들어요…', desc: '스트레스 50 이상 · 반응은 사람마다 다르다' },
  dream:   { label: '꿈 얘기',       text: '나 요즘 이상한 꿈을 꿔. 옛날 꿈인데, 너도 나와.', polite: '요즘 이상한 꿈을 꿔요. 옛날 꿈인데, 선배도 나와요.', desc: '그 사람의 전생 기억을 봤을 때' },
};
