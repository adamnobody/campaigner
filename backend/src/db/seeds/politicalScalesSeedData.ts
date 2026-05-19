import { BUILTIN_POLITICAL_SCALES } from '@campaigner/shared/seeds';

/**
 * Системные политические шкалы (сид). Коды глобально уникальны.
 */
export type SeedPoliticalScale = {
  code: string;
  entityType: 'state' | 'faction';
  category: string;
  name: string;
  leftPoleLabel: string;
  rightPoleLabel: string;
  leftPoleDescription: string;
  rightPoleDescription: string;
  zonesJson: string | null;
  sortOrder: number;
};

export const SYSTEM_POLITICAL_SCALES_SEED: SeedPoliticalScale[] = BUILTIN_POLITICAL_SCALES.map(
  (scale) => ({
    code: scale.code,
    entityType: scale.entityType,
    category: scale.category,
    name: scale.name,
    leftPoleLabel: scale.leftPoleLabel,
    rightPoleLabel: scale.rightPoleLabel,
    leftPoleDescription: scale.leftPoleDescription,
    rightPoleDescription: scale.rightPoleDescription,
    zonesJson: scale.zones ? JSON.stringify(scale.zones) : null,
    sortOrder: scale.sortOrder,
  }),
);
