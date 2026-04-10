export type Region = {
  name: string;
  offsetMinutes: number; // 사주 진태양시 보정
  latitude: number;      // 상승궁 계산용
  longitude: number;
};

// 광역 단위. 보정값은 권역 평균 경도 기반 (135° 기준 × 4분).
// 버튼 그리드 레이아웃용 flat list (9개).
export const REGIONS: Region[] = [
  { name: '서울', offsetMinutes: -32, latitude: 37.57, longitude: 126.98 },
  { name: '경기·인천', offsetMinutes: -32, latitude: 37.41, longitude: 127.00 },
  { name: '강원', offsetMinutes: -28, latitude: 37.80, longitude: 128.30 },
  { name: '충청', offsetMinutes: -30, latitude: 36.50, longitude: 127.30 },
  { name: '전라', offsetMinutes: -32, latitude: 35.30, longitude: 126.90 },
  { name: '대구·경북', offsetMinutes: -25, latitude: 36.00, longitude: 128.70 },
  { name: '부산·경남', offsetMinutes: -23, latitude: 35.20, longitude: 129.10 },
  { name: '제주', offsetMinutes: -34, latitude: 33.50, longitude: 126.53 },
  { name: '해외·기타', offsetMinutes: 0, latitude: 37.57, longitude: 126.98 },
];

export const REGION_MAP: Record<string, Region> = Object.fromEntries(
  REGIONS.map((r) => [r.name, r] as const)
);

export const REGION_OFFSETS: Record<string, number> = Object.fromEntries(
  REGIONS.map((r) => [r.name, r.offsetMinutes])
);

export const DEFAULT_REGION = '서울';
