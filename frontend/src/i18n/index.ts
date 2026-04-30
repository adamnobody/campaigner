import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { detectDefaultLanguage } from './language';

import commonEn from './locales/en/common.json';
import navigationEn from './locales/en/navigation.json';
import projectsEn from './locales/en/projects.json';
import charactersEn from './locales/en/characters.json';
import factionsEn from './locales/en/factions.json';
import dynastiesEn from './locales/en/dynasties.json';
import mapEn from './locales/en/map.json';
import graphEn from './locales/en/graph.json';
import ambitionsEn from './locales/en/ambitions.json';
import policiesEn from './locales/en/policies.json';
import dogmasEn from './locales/en/dogmas.json';
import notesEn from './locales/en/notes.json';
import wikiEn from './locales/en/wiki.json';
import timelineEn from './locales/en/timeline.json';
import settingsEn from './locales/en/settings.json';
import appearanceEn from './locales/en/appearance.json';

import commonRu from './locales/ru/common.json';
import navigationRu from './locales/ru/navigation.json';
import projectsRu from './locales/ru/projects.json';
import charactersRu from './locales/ru/characters.json';
import factionsRu from './locales/ru/factions.json';
import dynastiesRu from './locales/ru/dynasties.json';
import mapRu from './locales/ru/map.json';
import graphRu from './locales/ru/graph.json';
import ambitionsRu from './locales/ru/ambitions.json';
import policiesRu from './locales/ru/policies.json';
import dogmasRu from './locales/ru/dogmas.json';
import notesRu from './locales/ru/notes.json';
import wikiRu from './locales/ru/wiki.json';
import timelineRu from './locales/ru/timeline.json';
import settingsRu from './locales/ru/settings.json';
import appearanceRu from './locales/ru/appearance.json';

export const NAMESPACES = [
  'common',
  'navigation',
  'projects',
  'characters',
  'factions',
  'dynasties',
  'map',
  'graph',
  'ambitions',
  'policies',
  'dogmas',
  'notes',
  'wiki',
  'timeline',
  'settings',
  'appearance',
] as const;

void i18n.use(initReactI18next).init({
  lng: detectDefaultLanguage(),
  supportedLngs: ['en', 'ru'],
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: [...NAMESPACES],
  interpolation: { escapeValue: false },
  resources: {
    en: {
      common: commonEn,
      navigation: navigationEn,
      projects: projectsEn,
      characters: charactersEn,
      factions: factionsEn,
      dynasties: dynastiesEn,
      map: mapEn,
      graph: graphEn,
      ambitions: ambitionsEn,
      policies: policiesEn,
      dogmas: dogmasEn,
      notes: notesEn,
      wiki: wikiEn,
      timeline: timelineEn,
      settings: settingsEn,
      appearance: appearanceEn,
    },
    ru: {
      common: commonRu,
      navigation: navigationRu,
      projects: projectsRu,
      characters: charactersRu,
      factions: factionsRu,
      dynasties: dynastiesRu,
      map: mapRu,
      graph: graphRu,
      ambitions: ambitionsRu,
      policies: policiesRu,
      dogmas: dogmasRu,
      notes: notesRu,
      wiki: wikiRu,
      timeline: timelineRu,
      settings: settingsRu,
      appearance: appearanceRu,
    },
  },
});

export default i18n;
