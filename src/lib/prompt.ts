import type { SajuResult, Category, MbtiType } from './types';
import type { AstrologyResult } from './astrology';
import { STEM_KOREAN, BRANCH_KOREAN, CATEGORY_LABELS } from './types';
import { SIGN_KOREAN } from './astrology';
import { formatPillarKo } from './format';
import { getTodayStems } from './currentSaju';
import { calculateTenGod } from './tenGod';
import type { HeavenlyStem } from './types';

// 역마, 괴강, 녹, 양인 등 특수살 판별
function getSpecialTags(dayGanzhi: string): string[] {
  const tags: string[] = [];
  const branch = dayGanzhi[1];

  // 역마살: 일지 寅申巳亥
  if ('寅申巳亥'.includes(branch)) tags.push('역마살(이동·해외·변화 인연)');

  // 괴강살: 戊辰 戊戌 庚辰 庚戌 壬辰 壬戌
  const 괴강 = ['戊辰', '戊戌', '庚辰', '庚戌', '壬辰', '壬戌'];
  if (괴강.includes(dayGanzhi)) tags.push('괴강살(강한 카리스마·극단적 성취)');

  // 양인: 丙午 戊午 壬子
  const 양인 = ['丙午', '戊午', '壬子'];
  if (양인.includes(dayGanzhi)) tags.push('양인살(강렬한 에너지·결단력)');

  return tags;
}

export function buildPrompt(
  saju: SajuResult,
  astro: AstrologyResult,
  mbti: MbtiType | null,
  gender: 'M' | 'F',
  category: Category
): string {
  const yearPillar = `${saju.year.ganzhi}(${formatPillarKo(saju.year)})`;
  const monthPillar = `${saju.month.ganzhi}(${formatPillarKo(saju.month)})`;
  const dayPillar = `${saju.day.ganzhi}(${formatPillarKo(saju.day)})`;
  const hourPillar = `${saju.hour.ganzhi}(${formatPillarKo(saju.hour)})`;

  const specialTags = getSpecialTags(saju.day.ganzhi);
  const tagsStr = specialTags.length
    ? `특수살: ${specialTags.join(', ')}`
    : '특수살: 해당 없음';

  const sunSign = SIGN_KOREAN[astro.sun];
  const moonSign = SIGN_KOREAN[astro.moon];
  const ascSign = SIGN_KOREAN[astro.ascendant];

  const mbtiStr = mbti ? `MBTI: ${mbti}` : 'MBTI: 정보 없음';
  const genderStr = gender === 'F' ? '여성' : '남성';

  // 오늘/올해 카테고리용 추가 정보
  let timeContext = '';
  if (category === 'today' || category === 'year') {
    const stems = getTodayStems();
    const tenGodDay = calculateTenGod(
      saju.day.stem as HeavenlyStem,
      stems.day
    );
    const tenGodYear = calculateTenGod(
      saju.day.stem as HeavenlyStem,
      stems.year
    );
    timeContext = `
[시간 정보]
• 오늘 날짜: ${new Date().toLocaleDateString('ko-KR')}
• 오늘 일진: ${stems.dayGanzhi} (본인 일간과의 십성: ${tenGodDay})
• 올해 세운: ${stems.yearGanzhi} (본인 일간과의 십성: ${tenGodYear})
`;
  }

  const catLabel = CATEGORY_LABELS[category];

  return `너는 사주명리학 + 서양 점성술 + MBTI를 다 아는 20대 후반 친구야.

[이 사람]
사주: 연주 ${yearPillar} / 월주 ${monthPillar} / 일주 ${dayPillar} / 시주 ${hourPillar}
일주: ${saju.day.ganzhi}(${formatPillarKo(saju.day)}) — ${tagsStr}
별자리: 태양 ${sunSign} / 달 ${moonSign} / 상승 ${ascSign}
${mbtiStr}
성별: ${genderStr}
${timeContext}
[요청] "${catLabel}" 분석

[톤 규칙 — 반드시 지켜]
- 20대가 친구한테 톡하듯 가볍게 반말. "~거든", "~잖아", "~인 듯" 자연스럽게.
- 절대 금지: "아이고", "우리 언니/오빠", "~하시네요", "~랍니다", "~이에요" 같은 존댓말·아줌마 말투.
- MBTI 분석 블로그 톤 참고. 짧은 문장, 끊어 쓰기.

[내용 규칙]
1. 사주·별자리${mbti ? '·MBTI' : ''}를 하나의 이야기로 엮어. "사주로는~, 별자리로는~" 나열 금지. 자연스럽게 녹여.
2. 세 체계의 공통점이나 재밌는 대조를 찾아 연결. 예: 역마살 + 사수자리 방랑 기질이 겹치는 것.
3. 전문 용어(역마, 십성, 상승궁 등) 자연스럽게 쓰되 맥락에서 이해되게.
4. 구체적 장면으로 표현. "회의에서 먼저 손드는 타입", "카톡 읽고 3시간 고민하는 스타일" 같은.
5. 장점 + 주의점 균형.
6. 800~1200자. 짧게 끝내지 말고 풍부하게.
7. 이모지, 마크다운, 볼드, 별표 전부 금지. 순수 텍스트만.`;
}
