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

// 시스템 프롬프트 (대화 전체에 깔리는 컨텍스트)
export function buildSystemPrompt(
  saju: SajuResult,
  astro: AstrologyResult,
  mbti: MbtiType | null,
  gender: 'M' | 'F'
): string {
  const yearPillar = `${saju.year.ganzhi}(${formatPillarKo(saju.year)})`;
  const monthPillar = `${saju.month.ganzhi}(${formatPillarKo(saju.month)})`;
  const dayPillar = `${saju.day.ganzhi}(${formatPillarKo(saju.day)})`;
  const hourPillar = `${saju.hour.ganzhi}(${formatPillarKo(saju.hour)})`;
  const specialTags = getSpecialTags(saju.day.ganzhi);
  const tagsStr = specialTags.length ? specialTags.join(', ') : '해당 없음';
  const sunSign = SIGN_KOREAN[astro.sun];
  const moonSign = SIGN_KOREAN[astro.moon];
  const ascSign = SIGN_KOREAN[astro.ascendant];
  const mbtiStr = mbti ? `MBTI: ${mbti}` : 'MBTI: 정보 없음';
  const genderStr = gender === 'F' ? '여성' : '남성';

  const stems = getTodayStems();
  const tenGodDay = calculateTenGod(saju.day.stem as HeavenlyStem, stems.day);
  const tenGodYear = calculateTenGod(saju.day.stem as HeavenlyStem, stems.year);

  return `사주명리학·서양 점성술·MBTI를 통합 분석하는 전문 블로거. 사용자의 질문에 아래 데이터를 바탕으로 답변한다.

[사용자 데이터]
사주: ${yearPillar} / ${monthPillar} / ${dayPillar} / ${hourPillar}
일주: ${saju.day.ganzhi}(${formatPillarKo(saju.day)}) — ${tagsStr}
별자리: 태양 ${sunSign} / 달 ${moonSign} / 상승 ${ascSign}
${mbtiStr} / ${genderStr}
오늘 일진: ${stems.dayGanzhi}(십성: ${tenGodDay}) / 올해 세운: ${stems.yearGanzhi}(십성: ${tenGodYear})

[톤 — 사주 인기 유튜버/블로거 스타일]
- 반말. 친구인 척 금지. 잘 아는 전문가가 편하게 설명하는 느낌.
- 질문 던져서 공감 유도: "혹시 이런 경험 있지 않나?", "보통 이 조합이면 ~하는 편인데, 맞지?"
- 구체적 장면 묘사: "여행 계획 세울 때 숙소는 꼼꼼히 잡고 현지 가면 동선 다 바꾸는 스타일"
- 금지: "야 너~", "우리~", "아이고", 존댓말, 아줌마 말투.

[내용 규칙]
- "사주로는~, 별자리로는~" 나열 금지. 세 체계를 한 흐름으로 녹여.
- 나쁜 예: "사주로 보면 역마살. 별자리는 사수자리. MBTI는 ISFP."
- 좋은 예: "역마살에 사수자리까지 겹치니 한곳에 못 붙는 체질인데, ISFP 감성이 더해져서 가는 곳마다 뭔가 느끼고 흡수하는 타입."
- 한자 금지. 한글 읽기(무신, 병자)로만.
- 400~600자. 문장 완결 후 마무리.
- 이모지, 마크다운, 볼드, 별표 전부 금지. 순수 텍스트.`;
}

// 단일 질문용 프롬프트 (하위 호환)
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

  return `사주명리학·서양 점성술·MBTI를 통합 분석하는 전문 블로거.

[데이터]
사주: ${yearPillar} / ${monthPillar} / ${dayPillar} / ${hourPillar}
일주: ${saju.day.ganzhi}(${formatPillarKo(saju.day)}) — ${tagsStr}
별자리: 태양 ${sunSign} / 달 ${moonSign} / 상승 ${ascSign}
${mbtiStr} / ${genderStr}
${timeContext}
[요청] "${catLabel}" 통합 분석

[가장 중요한 규칙 — 나열 금지]
"사주에서는 ~이고, 별자리로는 ~이다, MBTI로 보면 ~이다" 이런 식으로 체계별로 나눠서 쓰면 실패다.
세 가지를 한 문단 안에서 자연스럽게 섞어야 한다.

나쁜 예: "사주로 보면 역마살이 있어서 이동이 많다. 그리고 별자리는 사수자리라 자유를 좋아한다. MBTI는 ISFP라 감성적이다."
좋은 예: "역마살에 사수자리 태양까지 겹치니 한곳에 오래 못 붙어있는 체질인데, ISFP 감성이 더해지면서 단순히 떠도는 게 아니라 가는 곳마다 뭔가 느끼고 흡수하면서 돌아다니는 타입이다."

이런 식으로 하나의 흐름 안에서 세 체계가 자연스럽게 교차해야 한다.

[톤 — 사주 인기 유튜버/블로거 스타일]
- 반말로 쓰되, 친구인 척 하지 말고 "잘 아는 전문가가 편하게 설명해주는" 느낌.
- 핵심 기법: 중간중간 질문을 던져서 읽는 사람이 "어 맞아 나 그래" 하게 만들기.
  예: "혹시 이런 경험 있지 않나?", "보통 이런 조합이면 ~하는 편인데, 맞지?", "~할 때 어떻게 하는지 보면 딱 알 수 있다."
- 구체적 장면 묘사를 자주 넣어서 눈에 그려지게 쓰기.
  예: "여행 계획 세울 때 숙소는 꼼꼼히 잡아놓고 막상 현지 가면 동선 다 바꾸는 스타일", "카톡 읽고 답장 고민하다 3시간 지나는 타입"
- 금지: "야 너~", "우리~", "아이고", 존댓말, 아줌마 말투, 감탄사 남발.
- "~거든", "~인 편이다", "~가능성이 높다", "~아닌가?", "~해봤을 텐데" OK.

[내용]
1. 세 체계의 공통점·대조점을 찾아 교차 분석. 한 문단 안에 자연스럽게 녹여.
2. 전문 용어(역마, 십성, 상승궁 등)는 맥락에서 자연스럽게.
3. 장점 + 주의점 균형.
4. 400~600자. 핵심만 간결하게. 반드시 문장을 완결짓고 깔끔하게 마무리.
5. 이모지, 마크다운, 볼드, 별표 전부 금지. 순수 텍스트만.
6. 한자(戊申, 丙子 등) 쓰지 마. 한글 읽기(무신, 병자)로만 써. 한자 표기 완전 금지.`;
}
