/* =========================================================
   게임 밸런스 — 모든 수치는 여기서만 조정하세요.
   ========================================================= */
import type { RouteId, StatKey } from '@/engine/types';

export const BALANCE = {
  /** 시작 상태 */
  start: {
    stat: { int: 10, art: 10, sense: 10, cha: 10, charm: 10, spirit: 5, fit: 10 } as Record<StatKey, number>,
    hp: 100,
    stress: 10,
    money: 150_000,
  },

  /** 매 턴(월) 시작 시 */
  perTurn: {
    allowance: 100_000,    // 용돈
    hpRegen: 8,            // 체력 자연 회복
    hpRegenVacation: 14,   // 방학 중 체력 회복
    stressDecay: 3,        // 스트레스 자연 감소
  },

  /** 최대 체력 = base + 근력 / fitPerHp (최대 cap) */
  hpMax: { base: 100, fitPerHp: 5, cap: 160 },

  /** 스트레스·체력에 따른 성장 효율 */
  growth: { stressHigh: 80, multHigh: 0.6, stressMid: 60, multMid: 0.8, lowHp: 25, multLowHp: 0.7 },

  /** 일정 장소에서 인물과 마주칠 확률 */
  encounter: {
    firstMeetChance: 0.72,
    chance: 0.5,
    scriptedGain: 3,       // 단계 이벤트 기본 호감도
    smallGain: 2,          // 짧은 조우 호감도
    glanceGain: 2,         // VN 없이 눈인사만 할 때
    spiritGain: 1,         // 조우할 때마다 감응력
    maxScenesPerWeek: 2,   // 한 주에 VN으로 보여줄 조우 수
  },

  /** 위기 */
  sick: { hpRatioAfter: 0.55, stressAdd: 5, hospitalCost: 30_000 },
  slump: { statPenalty: 3 },

  /** 전생 꿈을 처음 볼 때 감응력 보너스 */
  dreamSpiritBonus: 3,

  /** 메신저: 조건을 넘은 인물이 이번 턴에 톡을 보낼 확률 */
  phoneChance: 0.7,

  /** 시험: 학업 / (base + turn * perTurn) 비율로 등급 판정 */
  exam: {
    base: 30, perTurn: 9,
    tiers: [
      { min: 1.5,  tier: 'top',  rank: '전교 1등',     eff: { stress: -10, money: 100_000 } },
      { min: 1.15, tier: 'high', rank: '전교 상위권',  eff: { stress: -5,  money: 50_000 } },
      { min: 0.8,  tier: 'mid',  rank: '중위권',       eff: { stress: 3 } },
      { min: 0,    tier: 'low',  rank: '하위권',       eff: { stress: 10 } },
    ],
  },
  sports: { base: 30, perTurn: 4 },
  festival: { base: 40, perTurn: 6 },
  suneung: { intFull: 380 },

  /** 진로 달성 조건 (엔딩 1순위 판정) */
  careers: {
    med:   { int: 420, spirit: 90 },
    idol:  { art: 380, charm: 170 },
    actor: { sense: 380, charm: 160 },
    ceo:   { cha: 320, int: 200 },
  } as Record<RouteId, Partial<Record<StatKey, number>>>,

  /** 진로 상담에서 다른 진로를 권하는 기준(적합도 차이) */
  counselSwitchGap: 0.12,

  /** 엔딩 */
  ending: {
    trueAff: 80,           // 진 엔딩: 호감도 + 전생 기억 3편
    normalAff: 55,         // 노멀 로맨스: 꿈을 못 이뤘을 때
    sayaMinAff: 10,        // 사야 출국 장면이 나오는 최소 호감도
    sayaHidden: { aff: 75, spirit: 150, int: 420 }, // 히든 생존 루트 (의대 루트는 spirit/int 면제)
  },

  /** 스탯 등급 표기 */
  grades: [[40, 'F'], [90, 'E'], [150, 'D'], [220, 'C'], [300, 'B'], [380, 'A']] as [number, string][],
  statBarMax: 400,
};
