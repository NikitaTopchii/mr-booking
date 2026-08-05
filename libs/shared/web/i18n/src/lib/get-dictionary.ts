import 'server-only';

import { cache } from 'react';
import { hasLocale } from './locales';
import type { AppDictionary } from './types/dictionary.types';
import type { Locale } from './types/locale.contracts';

const dictionaryLoaders: Record<Locale, () => Promise<AppDictionary>> = {
  uk: () => import('./dictionaries/uk').then((module) => module.dictionary),
  en: () => import('./dictionaries/en').then((module) => module.dictionary),
};

export const getDictionary = cache(
  async (locale: Locale): Promise<AppDictionary> => {
    if (!hasLocale(locale)) {
      throw new Error(`Unsupported locale: ${String(locale)}`);
    }

    return dictionaryLoaders[locale]();
  },
);
