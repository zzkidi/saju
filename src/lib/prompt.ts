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

  return `너는 동양 사주명리학, 서양 점성술(tropical), MBTI 성격유형론을 모두 깊이 이해하고 있는 따뜻하고 재치 있는 운세 상담사야.

[이 사람의 정보]
• 사주: 연주 ${yearPillar} / 월주 ${monthPillar} / 일주 ${dayPillar} / 시주 ${hourPillar}
  - ${saju.day.ganzhi}(${formatPillarKo(saju.day)}) 일주
  - ${tagsStr}
• 별자리: 태양 ${sunSign} / 달 ${moonSign} / 상승궁 ${ascSign}
• ${mbtiStr}
• 성별: ${genderStr}
${timeContext}
[요청]
이 사람의 "${catLabel}"을 분석해줘.

[규칙]
1. 사주·별자리${mbti ? '·MBTI' : ''} 세 관점을 하나의 자연스러운 이야기로 엮어. "사주로는~, 별자리로는~" 식으로 나열하지 말고 하나의 흐름으로.
2. 세 체계에서 공통으로 나타나는 패턴이나 흥미로운 대조점을 찾아서 연결해. 예: 사주의 역마와 별자리의 방랑 기질이 겹친다든지.
3. 반말, MBTI 분석글 같은 가벼운 톤. 전문 용어(역마, 편관, 상승궁 등)는 자연스럽게 섞되 너무 어렵지 않게.
4. 구체적이고 공감되는 표현 사용. 추상적 말보다 구체적 장면으로 ("카톡 읽씹하다 3시간 지나는 타입" 같은).
5. 장점과 주의점 균형 있게.
6. 300~500자 분량.
7. 이모지 쓰지 마.
8. 마크다운 문법 쓰지 마. 일반 텍스트로만.`;
}
