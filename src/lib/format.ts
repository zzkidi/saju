import type { Pillar } from './types';
import { STEM_KOREAN, BRANCH_KOREAN } from './types';

export function formatPillarKo(p: Pillar): string {
  return `${STEM_KOREAN[p.stem]}${BRANCH_KOREAN[p.branch]}`;
}

export function formatPillarFull(p: Pillar): string {
  return `${p.ganzhi} (${formatPillarKo(p)})`;
}
