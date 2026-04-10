import { Origin, Horoscope } from 'circular-natal-horoscope-js';

export type ZodiacSign =
  | 'aries'
  | 'taurus'
  | 'gemini'
  | 'cancer'
  | 'leo'
  | 'virgo'
  | 'libra'
  | 'scorpio'
  | 'sagittarius'
  | 'capricorn'
  | 'aquarius'
  | 'pisces';

const LABEL_TO_KEY: Record<string, ZodiacSign> = {
  Aries: 'aries',
  Taurus: 'taurus',
  Gemini: 'gemini',
  Cancer: 'cancer',
  Leo: 'leo',
  Virgo: 'virgo',
  Libra: 'libra',
  Scorpio: 'scorpio',
  Sagittarius: 'sagittarius',
  Capricorn: 'capricorn',
  Aquarius: 'aquarius',
  Pisces: 'pisces',
};

export const SIGN_KOREAN: Record<ZodiacSign, string> = {
  aries: '양자리',
  taurus: '황소자리',
  gemini: '쌍둥이자리',
  cancer: '게자리',
  leo: '사자자리',
  virgo: '처녀자리',
  libra: '천칭자리',
  scorpio: '전갈자리',
  sagittarius: '사수자리',
  capricorn: '염소자리',
  aquarius: '물병자리',
  pisces: '물고기자리',
};

export const SIGN_EMOJI: Record<ZodiacSign, string> = {
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  cancer: '♋',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',
};

export type AstrologyResult = {
  sun: ZodiacSign;
  moon: ZodiacSign;
  ascendant: ZodiacSign;
};

// 출생 시간을 한국시(KST, UTC+9)로 간주
const BIRTH_TZ_OFFSET_MIN = 540;

// 라이브러리는 moment.js 기반으로 입력을 시스템 로컬시로 해석함.
// 브라우저/서버 타임존에 관계없이 동일한 UTC 순간을 만들기 위해
// 실행 환경의 로컬시로 변환해서 전달.
function toMomentLocalFields(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
) {
  const utcMs =
    Date.UTC(year, month - 1, day, hour, minute) - BIRTH_TZ_OFFSET_MIN * 60 * 1000;
  const local = new Date(utcMs);
  return {
    year: local.getFullYear(),
    month: local.getMonth(), // 0-indexed (라이브러리 요구)
    date: local.getDate(),
    hour: local.getHours(),
    minute: local.getMinutes(),
  };
}

function buildHoroscope(
  fields: ReturnType<typeof toMomentLocalFields>,
  latitude: number,
  longitude: number
) {
  const origin = new Origin({
    ...fields,
    latitude,
    longitude,
  });
  return new Horoscope({
    origin,
    houseSystem: 'placidus',
    zodiac: 'tropical',
    aspectPoints: [],
    aspectWithPoints: [],
    customOrbs: {},
    language: 'en',
  });
}

export function calculateAstrology(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  latitude: number,
  longitude: number
): AstrologyResult {
  const fields = toMomentLocalFields(year, month, day, hour, minute);
  const horoscope = buildHoroscope(fields, latitude, longitude);
  return {
    sun: LABEL_TO_KEY[horoscope.CelestialBodies.sun.Sign.label],
    moon: LABEL_TO_KEY[horoscope.CelestialBodies.moon.Sign.label],
    ascendant: LABEL_TO_KEY[horoscope.Angles.ascendant.Sign.label],
  };
}

// 오늘 기준 태양·달 별자리 (한국 서울 위치로 고정, 정확도 충분)
export function getTodaySkyVibes(): { sun: ZodiacSign; moon: ZodiacSign } {
  // 현재 순간을 한국시(KST=UTC+9) 달력상 년/월/일/시/분으로 변환
  const nowMs = Date.now();
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(nowMs + kstOffset);
  const kstYear = kstDate.getUTCFullYear();
  const kstMonth = kstDate.getUTCMonth() + 1;
  const kstDay = kstDate.getUTCDate();
  const kstHour = kstDate.getUTCHours();
  const kstMinute = kstDate.getUTCMinutes();

  const fields = toMomentLocalFields(kstYear, kstMonth, kstDay, kstHour, kstMinute);
  const horoscope = buildHoroscope(fields, 37.57, 126.98);
  return {
    sun: LABEL_TO_KEY[horoscope.CelestialBodies.sun.Sign.label],
    moon: LABEL_TO_KEY[horoscope.CelestialBodies.moon.Sign.label],
  };
}
