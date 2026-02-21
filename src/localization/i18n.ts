import i18n from 'i18next';
import HttpBackend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';
import { defaultLanguage, supportedLanguages } from './config';

void i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    fallbackLng: defaultLanguage,
    supportedLngs: supportedLanguages,
    load: 'currentOnly',
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json'
    },
    react: {
      useSuspense: false
    }
  });

export default i18n;
