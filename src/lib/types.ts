export type HeavenlyStem =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type EarthlyBranch =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type Category =
  | 'overall'
  | 'today'
  | 'year'
  | 'love'
  | 'wealth'
  | 'career'
  | 'family'
  | 'relation'
  | 'health'
  | 'study';

export type StaticCategory = Exclude<Category, 'today' | 'year'>;

export type Pillar = {
  stem: HeavenlyStem;
  branch: EarthlyBranch;
  ganzhi: string;
};

export type SajuResult = {
  year: Pillar;
  month: Pillar;
  day: Pillar;
  hour: Pillar;
};

export type TenGod =
  | '비견' | '겁재' | '식신' | '상관' | '편재'
  | '정재' | '편관' | '정관' | '편인' | '정인';

// MBTI 16유형 × A/T = 32
export type MbtiBase =
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';
export type MbtiVariant = 'A' | 'T';
export type MbtiType = `${MbtiBase}-${MbtiVariant}`;

export const MBTI_BASE_LIST: MbtiBase[] = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export const MBTI_GROUPS: { label: string; bases: MbtiBase[] }[] = [
  { label: '분석가(NT)', bases: ['INTJ', 'INTP', 'ENTJ', 'ENTP'] },
  { label: '외교관(NF)', bases: ['INFJ', 'INFP', 'ENFJ', 'ENFP'] },
  { label: '관리자(SJ)', bases: ['ISTJ', 'ISFJ', 'ESTJ', 'ESFJ'] },
  { label: '탐험가(SP)', bases: ['ISTP', 'ISFP', 'ESTP', 'ESFP'] },
];

// 60갑자 일주 (일간+일지 조합, 전통 사주 일주 해석 기반)
export type DayPillar =
  | '甲子' | '乙丑' | '丙寅' | '丁卯' | '戊辰' | '己巳' | '庚午' | '辛未' | '壬申' | '癸酉'
  | '甲戌' | '乙亥' | '丙子' | '丁丑' | '戊寅' | '己卯' | '庚辰' | '辛巳' | '壬午' | '癸未'
  | '甲申' | '乙酉' | '丙戌' | '丁亥' | '戊子' | '己丑' | '庚寅' | '辛卯' | '壬辰' | '癸巳'
  | '甲午' | '乙未' | '丙申' | '丁酉' | '戊戌' | '己亥' | '庚子' | '辛丑' | '壬寅' | '癸卯'
  | '甲辰' | '乙巳' | '丙午' | '丁未' | '戊申' | '己酉' | '庚戌' | '辛亥' | '壬子' | '癸丑'
  | '甲寅' | '乙卯' | '丙辰' | '丁巳' | '戊午' | '己未' | '庚申' | '辛酉' | '壬戌' | '癸亥';

// 카테고리 태그별 텍스트 (카테고리 10개 중 동적 오늘/올해 제외한 8개 static)
export type TextFragments = {
  dayPillar: Record<DayPillar, Record<StaticCategory, string>>;
  tenGodToday: Record<TenGod, string>;
  tenGodYear: Record<TenGod, string>;
  monthBranch: Record<EarthlyBranch, Record<StaticCategory, string>>;
  hourBranch: Record<EarthlyBranch, Record<StaticCategory, string>>;
};

export const STEM_KOREAN: Record<HeavenlyStem, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
};

export const BRANCH_KOREAN: Record<EarthlyBranch, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해',
};

export const STEM_WUXING: Record<HeavenlyStem, string> = {
  '甲': '목', '乙': '목', '丙': '화', '丁': '화', '戊': '토',
  '己': '토', '庚': '금', '辛': '금', '壬': '수', '癸': '수',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  overall: '총운',
  today: '오늘',
  year: '올해',
  love: '연애',
  wealth: '재물',
  career: '직업',
  family: '가족',
  relation: '관계',
  health: '건강',
  study: '학업',
};

export const CATEGORY_EMOJI: Record<Category, string> = {
  overall: '🌟',
  today: '📅',
  year: '📆',
  love: '💗',
  wealth: '💰',
  career: '💼',
  family: '🏠',
  relation: '👥',
  health: '🌿',
  study: '📚',
};

export const CATEGORY_PROMPTS: Record<Category, string[]> = {
  overall: ['나 전체적으로 어떤 사람이야?', '총운 좀 봐줘', '나 어떤 스타일이야?'],
  today: ['오늘 운세 어때?', '오늘 하루 뭐가 중요해?', '오늘 어떤 날이야?'],
  year: ['올해 나 어때?', '올해 운세 봐줘', '올해 뭐에 집중해야 돼?'],
  love: ['내 연애 스타일 어때?', '연애운 봐줘', '나 연애 어떤 타입이야?'],
  wealth: ['나 돈 좀 벌어?', '재물운 어때?', '내 돈 흐름 봐줘'],
  career: ['직업은 뭐가 잘 맞아?', '일 운세 어때?', '내 커리어 어떨까?'],
  family: ['가족 관계는 어떨까?', '가족이랑 나 어때?', '부모·자식 관계 봐줘'],
  relation: ['사람 관계 어때?', '친구·동료랑 잘 맞아?', '인간관계 봐줘'],
  health: ['건강은 괜찮을까?', '내 몸 어때?', '건강운 봐줘'],
  study: ['공부는 잘 맞아?', '학업운 어때?', '시험·공부 흐름 봐줘'],
};

export const CATEGORY_ORDER: Category[] = [
  'overall',
  'today',
  'year',
  'love',
  'wealth',
  'career',
  'family',
  'relation',
  'health',
  'study',
];
