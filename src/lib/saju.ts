import { Solar } from 'lunar-javascript';
import type {
  SajuResult,
  HeavenlyStem,
  EarthlyBranch,
} from './types';

export function calculateSaju(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  offsetMinutes: number = -32
): SajuResult {
  const date = new Date(year, month - 1, day, hour, minute);
  date.setMinutes(date.getMinutes() + offsetMinutes);

  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    0
  );

  const ec = solar.getLunar().getEightChar();

  return {
    year: {
      stem: ec.getYearGan() as HeavenlyStem,
      branch: ec.getYearZhi() as EarthlyBranch,
      ganzhi: ec.getYear(),
    },
    month: {
      stem: ec.getMonthGan() as HeavenlyStem,
      branch: ec.getMonthZhi() as EarthlyBranch,
      ganzhi: ec.getMonth(),
    },
    day: {
      stem: ec.getDayGan() as HeavenlyStem,
      branch: ec.getDayZhi() as EarthlyBranch,
      ganzhi: ec.getDay(),
    },
    hour: {
      stem: ec.getTimeGan() as HeavenlyStem,
      branch: ec.getTimeZhi() as EarthlyBranch,
      ganzhi: ec.getTime(),
    },
  };
}
