import * as i18n from './index';

describe('shared-i18n public entrypoints', () => {
  it('keeps the root entrypoint web-safe', () => {
    expect(i18n.supportedLocales).toEqual(expect.arrayContaining(['en', 'uk']));
    expect(i18n).not.toHaveProperty('getDictionary');
  });
});
