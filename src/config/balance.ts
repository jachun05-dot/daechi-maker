/* =========================================================
   게임 밸런스 — 모든 수치는 여기서만 조정하세요.
   스탯은 소수로 쌓이고 화면에는 정수로 보입니다.
   ========================================================= */
import type { BaseStat, CareerId, Season, SkillKey, SubjectKey } from '@/engine/types';

export const BALANCE = {
  /** 시작 상태 */
  start: {
    stat: { int: 10, sense: 10, cha: 10, fit: 10, style: 10, spirit: 5 } as Record<BaseStat, number>,
    hp: 100,
    stress: 10,
    money: 150_000,
  },

  /** 매 턴(월) 시작 시 */
  perTurn: { allowance: 120_000, stressDecay: 3 },

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
  growth: { scale: 0.35, stressHigh: 80, multHigh: 0.6, stressMid: 60, multMid: 0.8 },  // scale: 모든 성장량에 곱하는 전체 배율
  /** 한 달에 일어나는 평일 돌발 사건 수 */
  incidentsPerMonth: 2,

  /* ---------- 주말 ---------- */
  weekend: {
    halfDay: 0.45,          // 낮·저녁 한 칸짜리 일정의 효과 배율 (변화량 전체에 곱함)
    fullDay: 0.85,          // 하루 종일(long) 일정의 효과 배율
    fare: 1500,             // 다른 구역으로 한 번 움직일 때 교통비
    moveHp: -2,             // 다른 구역으로 한 번 움직일 때 체력
    homeDistrict: '강남',   // 집이 있는 구역 (하루는 집에서 나가 집으로 돌아온다)
    regular: [3, 8],        // 단골 레벨 2·3이 되는 방문 횟수
    regularMult: [1, 1.1, 1.2], // 단골 레벨별 성장·수입 배율
    badWeather: 0.7,        // 비·눈 오는 날 야외 장소 효율
    streetChance: 0.22,     // 아무도 안 만난 칸에서 길거리 사건이 일어날 확률
    /** 계절별 날씨 확률 (나머지는 맑음) */
    weather: {
      spring: { rain: 0.25, cloud: 0.2 }, summer: { rain: 0.45, cloud: 0.15 },
      autumn: { rain: 0.15, cloud: 0.25 }, winter: { snow: 0.35, cloud: 0.25 },
    } as Record<Season, Partial<Record<'rain' | 'snow' | 'cloud', number>>>,
  },
  /** 주말 약속 */
  promise: {
    minAff: 20,             // 이 호감도부터 약속 연락이 온다
    chance: 0.3,            // 조건이 되는 인물이 이번 주에 연락할 확률
    maxPerWeek: 2,
    aff: 5,                 // 약속을 지켰을 때
    decline: 1,             // 거절했을 때 잃는 호감도
    conflict: 3,            // 같은 시간 두 약속 중 고르지 않은 쪽 (이안·무진은 질투로 추가 하락)
    clashChance: 0.5,       // 이안·무진이 같은 주에 부를 때 같은 시간을 고를 확률
  },

  /* ---------- 인연 ---------- */
  affection: {
    basic: 2,              // 출몰 장소 기본 이벤트
    incident: 2,           // 평일 돌발 사건
    main: 5,               // 메인 이벤트 기본값 (+선택지)
    vacation: 6,           // 방학 이벤트 기본값
    jealousy: 1,           // 이안·무진: 한쪽 호감이 오를 때 다른 쪽이 잃는 양
    jealousyMin: 4,        // 이만큼 이상 오를 때만 질투 (메인·약속·방학 같은 큰 순간. 톡·짧은 만남은 제외)
    spiritOnMeet: 0.5,     // 인물을 만날 때마다 감응
  },
  /** 방학 */
  vacation: { invites: 2, declineBonus: 0.3 },

  /** 야식 — 스트레스가 이만큼 쌓인 주에 이 확률로 */
  snack: { minStress: 35, chance: 0.3 },

  /** 위기 */
  slump: { statPenalty: 3 },

  /** 전생 꿈을 처음 볼 때 감응 보너스 */
  dreamSpiritBonus: 3,

  /** 메신저 */
  phone: {
    callsPerMonth: 2,      // 먼저 연락하기 — 한 달에 보낼 수 있는 횟수
    deadline: 3,           // 답장 기한 (게임 속 날짜). 넘기면 읽씹·안읽씹 (인물별 반응·호감도는 content/phone.ts)
    perDay: 2,             // 하루에 도착하는 대화 최대 수
    idleChance: 0.2,       // 매주, 만난 인물이 근황 톡(on=idle)을 보낼 확률
  },

  /* ---------- 월말 이벤트 ---------- */
  exam: {
    // 시험 기준 = base + 턴 × perTurn (지성이 이 값이면 중위권과 상위권 사이). npm run sim 으로 맞춘 값
    base: 21, perTurn: 6.8, focusBonus: 0.1,
    tiers: [
      { min: 1.4,  tier: 'top',  rank: '전교 1등',    eff: { stress: -10, money: 100_000 } },
      { min: 1.15, tier: 'high', rank: '전교 상위권', eff: { stress: -5,  money: 50_000 } },
      { min: 0.8,  tier: 'mid',  rank: '중위권',      eff: { stress: 3 } },
      { min: 0,    tier: 'low',  rank: '하위권',      eff: { stress: 10 } },
    ] as { min: number; tier: 'top' | 'high' | 'mid' | 'low'; rank: string; eff: Record<string, number> }[],
  },
  sports: { base: 12, perTurn: 1.2 },      // 우승에 필요한 근력 = base + 턴 × perTurn
  festival: { base: 6, perTurn: 2.4, styleBonus: 0.15 },     // 무대 성공에 필요한 특기 = base + 턴 × perTurn (+ 스타일 × styleBonus)
  suneung: { intFull: 200 },

  /* ---------- 진로 ---------- */
  /** 진로별 마지막 관문 조건 (기초 능력 + 특기) */
  careers: {
    // npm run sim 으로 맞춤: 꿈을 정하고 그쪽으로 꾸준히 키우면 대부분 닿고, 이것저것 하면 아슬아슬
    med:    { int: 180, science: 160, medicine: 170 },
    idol:   { sense: 70, style: 45, vocal: 120, dance: 100 },
    actor:  { sense: 60, acting: 130, voice: 75 },
    leader: { cha: 65, language: 160, debate: 150 },
  } as Record<CareerId, Partial<Record<BaseStat | SkillKey, number>>>,
  /** 꿈을 정한 뒤 바꿀 때의 대가 */
  goalChangeStress: 30,

  /* ---------- 엔딩 ---------- */
  ending: {
    acceptAff: 50,         // 마지막 선택에서 받아들여지는 최소 호감도 (미만이면 차임)
    ihyunAff: 60,          // 이현 엔딩 최소 호감도 (+ 메인 이벤트 완주)
  },

  /** 월말 성적표 평가 — 이달에 오른 숫자(기초 능력 + 특기 셋)의 합 */
  report: { great: 36, good: 28 },

  /** 스탯 등급 표기 */
  grades: [[15, 'F'], [35, 'E'], [60, 'D'], [90, 'C'], [120, 'B'], [150, 'A']] as [number, string][],
  statBarMax: 180,
};
