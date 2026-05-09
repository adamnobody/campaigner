import type { CharacterTrait } from '@campaigner/shared';
import type { Ambition } from '@campaigner/shared';
import type { PoliticalScale, ScaleZone } from '@campaigner/shared';
import type { TFunction } from 'i18next';
import i18n from 'i18next';

/**
 * Catalog EN lives only under `en` resources; with `fallbackLng: 'en'`, `t()` would
 * still resolve English for `ru`. Builtin rows are seeded in Russian in the API — use them as-is.
 */
function isRuLocaleCatalogFromApi(): boolean {
  const lng = i18n.resolvedLanguage ?? i18n.language ?? '';
  return lng === 'ru' || lng.startsWith('ru-');
}

/** `/traits/foo.jpg` → `foo`. */
export function traitSlugFromImagePath(imagePath: string | undefined | null): string | null {
  if (!imagePath?.startsWith('/traits/')) return null;
  const m = /^\/traits\/([^/]+)\.jpg$/i.exec(imagePath);
  return m ? m[1] : null;
}

/** Builtin ambition icons `/ambitions/name.svg|.jpg|.png`. */
export function ambitionSlugFromIconPath(iconPath: string | undefined | null): string | null {
  if (!iconPath?.includes('/ambitions/')) return null;
  const m = /\/ambitions\/([^/.]+)/i.exec(iconPath);
  return m ? m[1] : null;
}

export function localizedPredefinedTraitTexts(
  trait: Pick<CharacterTrait, 'name' | 'description' | 'isPredefined' | 'imagePath'>,
  t: TFunction
): { displayLabel: string; displayDescription: string } {
  if (!trait.isPredefined) {
    return { displayLabel: trait.name, displayDescription: trait.description };
  }
  const slug = traitSlugFromImagePath(trait.imagePath);
  if (!slug) {
    return { displayLabel: trait.name, displayDescription: trait.description };
  }
  if (isRuLocaleCatalogFromApi()) {
    return { displayLabel: trait.name, displayDescription: trait.description };
  }
  const base = `characters:catalogTraits.${slug}`;
  return {
    displayLabel: t(`${base}.name`, { defaultValue: trait.name }),
    displayDescription: t(`${base}.description`, { defaultValue: trait.description }),
  };
}

export function localizedPredefinedAmbitionTexts(
  ambition: Pick<Ambition, 'name' | 'description' | 'isCustom' | 'iconPath'>,
  t: TFunction
): { displayLabel: string; displayDescription: string } {
  if (ambition.isCustom) {
    return { displayLabel: ambition.name, displayDescription: ambition.description };
  }
  const slug = ambitionSlugFromIconPath(ambition.iconPath);
  if (!slug) {
    return { displayLabel: ambition.name, displayDescription: ambition.description };
  }
  if (isRuLocaleCatalogFromApi()) {
    return { displayLabel: ambition.name, displayDescription: ambition.description };
  }
  const base = `factions:catalogAmbitions.${slug}`;
  return {
    displayLabel: t(`${base}.name`, { defaultValue: ambition.name }),
    displayDescription: t(`${base}.description`, { defaultValue: ambition.description }),
  };
}

/** System political scales seeded in Russian; localize by stable `code` for EN/UI. */
export function localizedBuiltinPoliticalScale(
  scale: PoliticalScale,
  t: TFunction
): Pick<
  PoliticalScale,
  'name' | 'leftPoleLabel' | 'rightPoleLabel' | 'leftPoleDescription' | 'rightPoleDescription' | 'zones'
> {
  if (!scale.isSystem) {
    return {
      name: scale.name,
      leftPoleLabel: scale.leftPoleLabel,
      rightPoleLabel: scale.rightPoleLabel,
      leftPoleDescription: scale.leftPoleDescription,
      rightPoleDescription: scale.rightPoleDescription,
      zones: scale.zones ?? null,
    };
  }
  if (isRuLocaleCatalogFromApi()) {
    return {
      name: scale.name,
      leftPoleLabel: scale.leftPoleLabel,
      rightPoleLabel: scale.rightPoleLabel,
      leftPoleDescription: scale.leftPoleDescription,
      rightPoleDescription: scale.rightPoleDescription,
      zones: scale.zones ?? null,
    };
  }
  const b = `politicalScalesBuiltin.${scale.code}`;
  const zones: ScaleZone[] | null =
    scale.zones?.map((z, i) => ({
      ...z,
      label: t(`factions:${b}.zones.${i}.label`, { defaultValue: z.label }),
      description:
        z.description != null && z.description !== ''
          ? t(`factions:${b}.zones.${i}.description`, { defaultValue: z.description })
          : z.description,
    })) ?? null;
  return {
    name: t(`factions:${b}.name`, { defaultValue: scale.name }),
    leftPoleLabel: t(`factions:${b}.leftPole`, { defaultValue: scale.leftPoleLabel }),
    rightPoleLabel: t(`factions:${b}.rightPole`, { defaultValue: scale.rightPoleLabel }),
    leftPoleDescription: t(`factions:${b}.leftDesc`, { defaultValue: scale.leftPoleDescription }),
    rightPoleDescription: t(`factions:${b}.rightDesc`, { defaultValue: scale.rightPoleDescription }),
    zones,
  };
}
