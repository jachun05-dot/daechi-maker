/* =========================================================
   게임 밸런스 — 모든 수치는 여기서만 조정하세요.
   스탯은 소수로 쌓이고 화면에는 정수로 보입니다.
   ========================================================= */
import type { BaseStat, CareerId, SkillKey, SubjectKey } from '@/engine/types';

export const BALANCE = {
  /** 시작 상태 */
  start: {
    stat: { int: 10, sense: 10, cha: 10, fit: 10, spirit: 5 } as Record<BaseStat, number>,
    hp: 100,
    stress: 10,
    money: 150_000,
  },

  /** 매 턴(월) 시작 시 */
  perTurn: { allowance: 100_000, stressDecay: 3 },

  /** 최대 체력 = base + 근력 / fitPerHp (최대 cap) */
  hpMax: { base: 100, fitPerHp: 5, cap: 160 },

  /* ---------- 평일 ---------- */
  weekday: {
    schoolHp: -1,          // 등교만으로 드는 체력
    nightRegen: 8,         // 매일 밤 자면서 회복
    heavyStreak: 3,        // 무거운 일정이 이만큼 연속되면
    heavyStreakHp: -3,     // 하루마다 추가로 깎이는 체력
    collapseRecover: 10,   // 체력 0으로 쓰러져 잔 날 회복량
  },
  /** 수업 중 졸음: 체력 비율에 따른 수업 효율 */
  drowsy: { lowRatio: 0.3, normal: 1, low: 0.6, zero: 0.3 },
  /** 수업으로 하루에 오르는 양 */
  school: { int: 0.3, focusInt: 0.3, focusSkill: 0.35 },
  /** 집중 과목 → 함께 오르는 특기 */
  subjectSkills: {
    kor: ['debate'], eng: ['language'], math: ['science'], sci: ['science', 'medicine'], arts: ['vocal', 'dance', 'acting'],
  } as Record<SubjectKey, SkillKey[]>,
  /** 스트레스가 높을 때 성장 효율 */
  growth: { scale: 0.55, stressHigh: 80, multHigh: 0.6, stressMid: 60, multMid: 0.8 },  // scale: 모든 성장량에 곱하는 전체 배율
  /** 한 달에 일어나는 평일 돌발 사건 수 */
  incidentsPerMonth: 2,

  /* ---------- 주말 ---------- */
  weekend: { visitsPerWeek: 2 },

  /* ---------- 인연 ---------- */
  affection: {
    basic: 2,              // 출몰 장소 기본 이벤트
    incident: 2,           // 평일 돌발 사건
    main: 5,               // 메인 이벤트 기본값 (+선택지)
    vacation: 6,           // 방학 이벤트 기본값
    jealousy: 1,           // 이안·무진: 한쪽 호감이 오를 때 다른 쪽이 잃는 양
    spiritOnMeet: 0.5,     // 인물을 만날 때마다 감응
  },
  /** 방학 */
  vacation: { invites: 2, declineBonus: 0.3 },

  /** 위기 */
  slump: { statPenalty: 3 },

  /** 전생 꿈을 처음 볼 때 감응 보너스 */
  dreamSpiritBonus: 3,

  /** 메신저: 조건을 넘은 인물이 이번 턴에 톡을 보낼 확률 */
  phoneChance: 0.7,

  /* ---------- 월말 이벤트 ---------- */
  exam: {
    base: 15, perTurn: 4, focusBonus: 0.1,
    tiers: [
      { min: 1.5,  tier: 'top',  rank: '전교 1등',    eff: { stress: -10, money: 100_000 } },
      { min: 1.15, tier: 'high', rank: '전교 상위권', eff: { stress: -5,  money: 50_000 } },
      { min: 0.8,  tier: 'mid',  rank: '중위권',      eff: { stress: 3 } },
      { min: 0,    tier: 'low',  rank: '하위권',      eff: { stress: 10 } },
    ],
  },
  sports: { base: 15, perTurn: 2 },
  festival: { base: 8, perTurn: 2.5 },
  suneung: { intFull: 160 },

  /* ---------- 진로 ---------- */
  /** 진로별 마지막 관문 조건 (기초 능력 + 특기) */
  careers: {
    med:    { int: 150, science: 150, medicine: 80 },
    idol:   { sense: 90, vocal: 130, dance: 130 },
    actor:  { sense: 100, acting: 140, voice: 100 },
    leader: { cha: 100, language: 130, debate: 120 },
  } as Record<CareerId, Partial<Record<BaseStat | SkillKey, number>>>,
  /** 꿈을 정한 뒤 바꿀 때의 대가 */
  goalChangeStress: 30,

  /* ---------- 엔딩 ---------- */
  ending: {
    acceptAff: 50,         // 마지막 선택에서 받아들여지는 최소 호감도 (미만이면 차임)
    ihyunAff: 60,          // 이현 엔딩 최소 호감도 (+ 메인 이벤트 완주)
  },

  /** 스탯 등급 표기 */
  grades: [[15, 'F'], [35, 'E'], [60, 'D'], [90, 'C'], [120, 'B'], [150, 'A']] as [number, string][],
  statBarMax: 180,
};
