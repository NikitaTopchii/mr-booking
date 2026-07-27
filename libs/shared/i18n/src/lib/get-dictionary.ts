import 'server-only';

import { cache } from 'react';
import type { AppDictionary } from './dictionary';
import { hasLocale, type Locale } from './locales';

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
