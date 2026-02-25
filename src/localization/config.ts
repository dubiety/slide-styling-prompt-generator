import type { UILanguage } from '../types';

export const supportedLanguages: UILanguage[] = ['en', 'zh-TW', 'zh-CN', 'ja', 'es', 'de', 'fr'];
export const defaultLanguage: UILanguage = 'en';
export const languageStorageKey = 'ui-language';

export function isSupportedLanguage(value: string): value is UILanguage {
  return supportedLanguages.some((language) => language === value);
}

export function parseLanguage(value?: string): UILanguage | null {
  if (!value) return null;
  return isSupportedLanguage(value) ? value : null;
}
