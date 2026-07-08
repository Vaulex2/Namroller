import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru.json';
import uz from './locales/uz.json';
import en from './locales/en.json';
import zh from './locales/zh.json';
import fa from './locales/fa.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uz: { translation: uz },
      en: { translation: en },
      zh: { translation: zh },
      fa: { translation: fa },
    },
    fallbackLng: 'ru',
    supportedLngs: ['ru', 'uz', 'en', 'zh', 'fa'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
