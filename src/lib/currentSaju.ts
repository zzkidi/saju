import { Solar } from 'lunar-javascript';
import type { HeavenlyStem } from './types';

function stemsAt(date: Date) {
  const solar = Solar.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    12,
    0,
    0
  );
  const ec = solar.getLunar().getEightChar();
  return {
    year: ec.getYearGan() as HeavenlyStem,
    day: ec.getDayGan() as HeavenlyStem,
    yearGanzhi: ec.getYear(),
    dayGanzhi: ec.getDay(),
  };
}

export function getTodayStems() {
  return stemsAt(new Date());
}
