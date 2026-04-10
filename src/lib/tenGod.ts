import type { HeavenlyStem, TenGod } from './types';

const STEM_IDX: Record<HeavenlyStem, number> = {
  '甲': 0, '乙': 1, '丙': 2, '丁': 3, '戊': 4,
  '己': 5, '庚': 6, '辛': 7, '壬': 8, '癸': 9,
};

// 오행 인덱스: 목(0) 화(1) 토(2) 금(3) 수(4)
const STEM_WUXING_N = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];

// 양간: 갑 병 무 경 임 (index 0,2,4,6,8)
const STEM_IS_YANG = [true, false, true, false, true, false, true, false, true, false];

// 상생: 목→화→토→금→수→목
const GENERATES: Record<number, number> = { 0: 1, 1: 2, 2: 3, 3: 4, 4: 0 };
// 상극: 목→토, 화→금, 토→수, 금→목, 수→화
const OVERCOMES: Record<number, number> = { 0: 2, 1: 3, 2: 4, 3: 0, 4: 1 };

export function calculateTenGod(
  natal: HeavenlyStem,
  other: HeavenlyStem
): TenGod {
  const nI = STEM_IDX[natal];
  const oI = STEM_IDX[other];
  const nW = STEM_WUXING_N[nI];
  const oW = STEM_WUXING_N[oI];
  const sameYang = STEM_IS_YANG[nI] === STEM_IS_YANG[oI];

  if (nW === oW) return sameYang ? '비견' : '겁재';
  if (GENERATES[nW] === oW) return sameYang ? '식신' : '상관';
  if (GENERATES[oW] === nW) return sameYang ? '편인' : '정인';
  if (OVERCOMES[nW] === oW) return sameYang ? '편재' : '정재';
  if (OVERCOMES[oW] === nW) return sameYang ? '편관' : '정관';
  throw new Error('unreachable tenGod combination');
}
