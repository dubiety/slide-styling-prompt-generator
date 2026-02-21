import { describe, expect, it } from 'vitest';
import { isSupportedLanguage, parseLanguage } from './config';

describe('localization config', () => {
  it('validates supported languages', () => {
    expect(isSupportedLanguage('en')).toBe(true);
    expect(isSupportedLanguage('ja')).toBe(true);
    expect(isSupportedLanguage('fr')).toBe(false);
  });

  it('parses route language safely', () => {
    expect(parseLanguage('zh-TW')).toBe('zh-TW');
    expect(parseLanguage('de')).toBeNull();
    expect(parseLanguage(undefined)).toBeNull();
  });
});
