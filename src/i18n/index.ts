// Internationalization Configuration
// Multi-language support for the GradApp platform

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import zh from './locales/zh.json';
import ar from './locales/ar.json';

export const defaultNS = 'common';

export const resources = {
  en: {
    common: en
  },
  es: {
    common: es
  },
  fr: {
    common: fr
  },
  de: {
    common: de
  },
  zh: {
    common: zh
  },
  ar: {
    common: ar
  }
} as const;

// Language configuration
export const supportedLanguages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' }
];

// RTL languages
export const rtlLanguages = ['ar'];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    defaultNS,
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'gradapp-language',
      caches: ['localStorage']
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already does escaping
      formatSeparator: ',',
      format: (value, format, lng) => {
        if (format === 'uppercase') {return value.toUpperCase();}
        if (format === 'lowercase') {return value.toLowerCase();}
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: getCurrencyForLanguage(lng || 'en')
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        return value;
      }
    },

    // React options
    react: {
      useSuspense: false
    },

    // Development options
    debug: process.env.NODE_ENV === 'development',
    
    // Backend options for loading translations
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      allowMultiLoading: false,
      parse: (data: string) => JSON.parse(data),
      crossDomain: false,
      withCredentials: false,
      requestOptions: {
        cache: 'default',
        credentials: 'same-origin',
        mode: 'cors'
      }
    }
  });

// Helper function to get currency for language
function getCurrencyForLanguage(lng: string): string {
  const currencyMap: Record<string, string> = {
    'en': 'USD',
    'es': 'EUR',
    'fr': 'EUR', 
    'de': 'EUR',
    'zh': 'CNY',
    'ar': 'USD'
  };
  
  return currencyMap[lng] || 'USD';
}

// Update document direction based on language
i18n.on('languageChanged', (lng) => {
  document.documentElement.dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
});

export default i18n;