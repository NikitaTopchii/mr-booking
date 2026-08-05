jest.mock('server-only', () => ({}));

import { dictionary as englishDictionary } from './dictionaries/en';
import { dictionary as ukrainianDictionary } from './dictionaries/uk';
import { getDictionary } from './get-dictionary';
import { hasLocale, localizedRoute } from './locales';

describe('shared i18n', () => {
  it('supports Ukrainian and English and rejects unsupported locales', () => {
    expect(hasLocale('uk')).toBe(true);
    expect(hasLocale('en')).toBe(true);
    expect(hasLocale('fr')).toBe(false);
  });

  it('keeps dictionaries structurally identical', () => {
    expect(dictionaryShape(englishDictionary)).toEqual(
      dictionaryShape(ukrainianDictionary),
    );
  });

  it('translates every auth field and form error in both locales', () => {
    const fieldCodes = [
      'NAME_REQUIRED',
      'EMAIL_REQUIRED',
      'EMAIL_INVALID',
      'PASSWORD_REQUIRED',
      'PASSWORD_LENGTH',
      'EMAIL_ALREADY_EXISTS',
    ] as const;

    for (const dictionary of [ukrainianDictionary, englishDictionary]) {
      for (const code of fieldCodes) {
        expect(dictionary.auth.errors.fields[code].length).toBeGreaterThan(0);
      }
      expect(dictionary.auth.errors.invalidCredentials.length).toBeGreaterThan(
        0,
      );
      expect(dictionary.auth.errors.network.length).toBeGreaterThan(0);
      expect(dictionary.auth.errors.serviceUnavailable.length).toBeGreaterThan(
        0,
      );
    }
  });

  it('loads only a requested dictionary and fails usefully for bad input', async () => {
    await expect(getDictionary('en')).resolves.toEqual(englishDictionary);
    await expect(getDictionary('fr' as 'en')).rejects.toThrow(
      'Unsupported locale: fr',
    );
  });

  it('builds locale-prefixed routes', () => {
    expect(localizedRoute('uk', '/login')).toBe('/uk/login');
    expect(localizedRoute('en', '/')).toBe('/en');
  });
});

function dictionaryShape(value: unknown): unknown {
  if (typeof value !== 'object' || value === null) {
    return typeof value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, dictionaryShape(child)]),
  );
}
