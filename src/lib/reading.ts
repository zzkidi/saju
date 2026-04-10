import type {
  SajuResult,
  Category,
  StaticCategory,
  TextFragments,
  HeavenlyStem,
  TenGod,
  MbtiType,
  MbtiBase,
  DayPillar,
} from './types';
import type { AstrologyResult, ZodiacSign } from './astrology';
import { calculateTenGod } from './tenGod';
import { getTodayStems } from './currentSaju';
import { getTodaySkyVibes } from './astrology';
import sajuTextsData from '@/data/texts.json';
import astroTextsData from '@/data/astrology-texts.json';
import mbtiTextsData from '@/data/mbti-texts.json';

const STATIC_CATEGORIES: StaticCategory[] = [
  'overall',
  'love',
  'wealth',
  'career',
  'family',
  'relation',
  'health',
  'study',
];

function isStatic(cat: Category): cat is StaticCategory {
  return (STATIC_CATEGORIES as Category[]).includes(cat);
}

const sajuTexts = sajuTextsData as unknown as TextFragments;

type AstrologyTexts = {
  sun: Record<ZodiacSign, Record<StaticCategory, string>>;
  todayByMoon: Record<ZodiacSign, string>;
  yearBySun: Record<ZodiacSign, string>;
  moon: Record<ZodiacSign, Record<StaticCategory, string>>;
  ascendant: Record<ZodiacSign, Record<StaticCategory, string>>;
};
const astroTexts = astroTextsData as unknown as AstrologyTexts;

type MbtiData = {
  types: Record<MbtiBase, string>;
  variants: { A: string; T: string };
};
const mbtiData = mbtiTextsData as MbtiData;

// ============ 페르소나 (첫 공개 시 한 번만) ============

export function generateSajuPersona(saju: SajuResult): string {
  const dp = saju.day.ganzhi as DayPillar;
  const dayPillarOverall = sajuTexts.dayPillar[dp]?.overall ?? '';
  const monthMod = sajuTexts.monthBranch[saju.month.branch]?.overall ?? '';
  const hourMod = sajuTexts.hourBranch[saju.hour.branch]?.overall ?? '';
  return [dayPillarOverall, monthMod, hourMod].filter(Boolean).join('\n\n');
}

export function generateAstroPersona(astro: AstrologyResult): string {
  const moonMod = astroTexts.moon[astro.moon]?.overall ?? '';
  const ascMod = astroTexts.ascendant[astro.ascendant]?.overall ?? '';
  return [moonMod, ascMod].filter(Boolean).join(' ');
}

export function generateMbtiPersona(mbti: MbtiType): string {
  const base = mbti.slice(0, 4) as MbtiBase;
  const variantKey = mbti.endsWith('-A') ? 'A' : 'T';
  const baseText = mbtiData.types[base] ?? '';
  const variantText = mbtiData.variants[variantKey] ?? '';
  return [baseText, variantText].filter(Boolean).join('\n\n');
}

// ============ 카테고리별 해석 (60일주 본문 + 월지/시지 보정) ============

export function generateSajuReading(saju: SajuResult, category: Category): string {
  if (category === 'today') {
    const today = getTodayStems();
    const tenGod: TenGod = calculateTenGod(saju.day.stem as HeavenlyStem, today.day);
    const text = sajuTexts.tenGodToday[tenGod] ?? '';
    return `오늘 일진은 ${today.dayGanzhi}, 너랑은 '${tenGod}' 관계야.\n\n${text}`;
  }
  if (category === 'year') {
    const today = getTodayStems();
    const tenGod: TenGod = calculateTenGod(saju.day.stem as HeavenlyStem, today.year);
    const text = sajuTexts.tenGodYear[tenGod] ?? '';
    return `올해 세운은 ${today.yearGanzhi}, 너랑은 '${tenGod}' 관계.\n\n${text}`;
  }
  if (!isStatic(category)) return '';

  const dp = saju.day.ganzhi as DayPillar;
  const base = sajuTexts.dayPillar[dp]?.[category] ?? '';
  const monthBr = sajuTexts.monthBranch[saju.month.branch]?.[category] ?? '';
  const hourBr = sajuTexts.hourBranch[saju.hour.branch]?.[category] ?? '';

  return [base, monthBr, hourBr].filter(Boolean).join('\n\n');
}

export function generateAstroReading(
  astro: AstrologyResult,
  category: Category
): string {
  if (category === 'today') {
    const sky = getTodaySkyVibes();
    return astroTexts.todayByMoon[sky.moon] ?? '';
  }
  if (category === 'year') {
    return astroTexts.yearBySun[astro.sun] ?? '';
  }
  if (!isStatic(category)) return '';

  const base = astroTexts.sun[astro.sun]?.[category] ?? '';
  const moonMod = astroTexts.moon[astro.moon]?.[category] ?? '';
  const ascMod = astroTexts.ascendant[astro.ascendant]?.[category] ?? '';
  return [base, moonMod, ascMod].filter(Boolean).join('\n\n');
}

// 기존 호환성 유지
export const generateReading = generateSajuReading;
