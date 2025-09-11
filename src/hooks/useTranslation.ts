// Enhanced Translation Hook
// Provides additional translation utilities beyond react-i18next

import { useTranslation as useI18nTranslation } from 'react-i18next';
import { useMemo } from 'react';

export interface TranslationOptions {
  fallback?: string;
  context?: string;
  count?: number;
  interpolation?: Record<string, any>;
  returnObjects?: boolean;
  defaultValue?: string;
}

export interface DateTimeFormatOptions extends Intl.DateTimeFormatOptions {
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

export interface NumberFormatOptions extends Intl.NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent' | 'unit';
  currency?: string;
  unit?: string;
}

export const useTranslation = (namespace?: string | string[]) => {
  const { t: originalT, i18n, ready } = useI18nTranslation(namespace);

  // Enhanced translation function with better error handling
  const t = (key: string, options?: TranslationOptions) => {
    try {
      const translated = originalT(key, {
        defaultValue: options?.defaultValue,
        count: options?.count,
        context: options?.context,
        returnObjects: options?.returnObjects,
        ...options?.interpolation
      });

      // Return fallback if translation is missing and fallback provided
      if (translated === key && options?.fallback) {
        return options.fallback;
      }

      return translated;
    } catch (error) {
      console.warn(`Translation error for key "${key}":`, error);
      return options?.fallback || key;
    }
  };

  // Format numbers with locale
  const formatNumber = (value: number, options?: NumberFormatOptions) => {
    try {
      return new Intl.NumberFormat(i18n.language, options).format(value);
    } catch (error) {
      console.warn('Number formatting error:', error);
      return value.toString();
    }
  };

  // Format currency with locale
  const formatCurrency = (value: number, currency = 'USD') => {
    return formatNumber(value, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    });
  };

  // Format percentage
  const formatPercentage = (value: number, maximumFractionDigits = 1) => {
    return formatNumber(value / 100, {
      style: 'percent',
      maximumFractionDigits
    });
  };

  // Format dates with locale
  const formatDate = (date: Date | string | number, options?: DateTimeFormatOptions) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(i18n.language, options).format(dateObj);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return String(date);
    }
  };

  // Format relative time (e.g., "2 hours ago", "in 3 days")
  const formatRelativeTime = (date: Date | string | number, options?: Intl.RelativeTimeFormatOptions) => {
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffInMs = dateObj.getTime() - now.getTime();
      
      // Convert to different units
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 365 * 24 * 60 * 60 * 1000],
        ['month', 30 * 24 * 60 * 60 * 1000],
        ['day', 24 * 60 * 60 * 1000],
        ['hour', 60 * 60 * 1000],
        ['minute', 60 * 1000],
        ['second', 1000]
      ];

      for (const [unit, ms] of units) {
        const value = Math.round(diffInMs / ms);
        if (Math.abs(value) >= 1) {
          return new Intl.RelativeTimeFormat(i18n.language, {
            numeric: 'auto',
            ...options
          }).format(value, unit);
        }
      }

      return t('dates.just_now');
    } catch (error) {
      console.warn('Relative time formatting error:', error);
      return String(date);
    }
  };

  // Format lists with locale
  const formatList = (items: string[], options?: Intl.ListFormatOptions) => {
    try {
      return new Intl.ListFormat(i18n.language, {
        style: 'long',
        type: 'conjunction',
        ...options
      }).format(items);
    } catch (error) {
      console.warn('List formatting error:', error);
      return items.join(', ');
    }
  };

  // Get translated validation messages
  const getValidationMessage = (rule: string, field: string, options?: Record<string, any>) => {
    const key = `validation.${rule}`;
    return t(key, {
      interpolation: { field: t(field), ...options },
      fallback: `${field} is invalid`
    });
  };

  // Get pluralized strings with proper grammar
  const plural = (key: string, count: number, options?: TranslationOptions) => {
    return t(key, { ...options, count });
  };

  // Check if translation exists
  const exists = (key: string, options?: { ns?: string }) => {
    return i18n.exists(key, options);
  };

  // Get current language info
  const currentLanguage = useMemo(() => {
    const supportedLangs = [
      { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
      { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
      { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
      { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
      { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
      { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true }
    ];
    
    return supportedLangs.find(lang => lang.code === i18n.language) || supportedLangs[0];
  }, [i18n.language]);

  // Get text direction based on language
  const isRTL = currentLanguage.rtl;
  const textDirection = isRTL ? 'rtl' : 'ltr';

  // Get month names in current language
  const getMonthNames = (format: 'long' | 'short' = 'long') => {
    try {
      const months = [];
      for (let i = 0; i < 12; i++) {
        const date = new Date(2000, i, 1);
        months.push(new Intl.DateTimeFormat(i18n.language, { month: format }).format(date));
      }
      return months;
    } catch (error) {
      console.warn('Month names formatting error:', error);
      return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    }
  };

  // Get day names in current language
  const getDayNames = (format: 'long' | 'short' = 'long') => {
    try {
      const days = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(2000, 0, i + 2); // Start from Sunday
        days.push(new Intl.DateTimeFormat(i18n.language, { weekday: format }).format(date));
      }
      return days;
    } catch (error) {
      console.warn('Day names formatting error:', error);
      return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }
  };

  // Conditional translation based on conditions
  const conditionalT = (conditions: { condition: boolean; key: string }[], fallbackKey: string) => {
    for (const { condition, key } of conditions) {
      if (condition) {
        return t(key);
      }
    }
    return t(fallbackKey);
  };

  return {
    // Core translation functions
    t,
    i18n,
    ready,

    // Enhanced formatting functions
    formatNumber,
    formatCurrency,
    formatPercentage,
    formatDate,
    formatRelativeTime,
    formatList,

    // Utility functions
    getValidationMessage,
    plural,
    exists,
    conditionalT,

    // Language information
    currentLanguage,
    isRTL,
    textDirection,
    
    // Date/time utilities
    getMonthNames,
    getDayNames,

    // Common date formats for current locale
    dateFormats: {
      short: { dateStyle: 'short' as const },
      medium: { dateStyle: 'medium' as const },
      long: { dateStyle: 'long' as const },
      full: { dateStyle: 'full' as const }
    },

    // Common time formats for current locale
    timeFormats: {
      short: { timeStyle: 'short' as const },
      medium: { timeStyle: 'medium' as const },
      long: { timeStyle: 'long' as const },
      full: { timeStyle: 'full' as const }
    }
  };
};

// Hook for accessing common translated strings
export const useCommonTranslations = () => {
  const { t } = useTranslation();

  return useMemo(() => ({
    // Navigation
    nav: {
      home: t('navigation.home'),
      dashboard: t('navigation.dashboard'),
      universities: t('navigation.universities'),
      mentors: t('navigation.mentors'),
      applications: t('navigation.applications'),
      settings: t('navigation.settings'),
      help: t('navigation.help'),
      logout: t('navigation.logout'),
      login: t('navigation.login'),
      signup: t('navigation.signup')
    },

    // Common actions
    actions: {
      save: t('common.save'),
      cancel: t('common.cancel'),
      delete: t('common.delete'),
      edit: t('common.edit'),
      view: t('common.view'),
      search: t('common.search'),
      filter: t('common.filter'),
      sort: t('common.sort'),
      submit: t('common.submit'),
      reset: t('common.reset'),
      clear: t('common.clear'),
      confirm: t('common.confirm'),
      close: t('common.close'),
      next: t('common.next'),
      previous: t('common.previous')
    },

    // Status messages
    status: {
      loading: t('common.loading'),
      error: t('common.error'),
      success: t('common.success'),
      active: t('common.active'),
      inactive: t('common.inactive'),
      enabled: t('common.enabled'),
      disabled: t('common.disabled'),
      public: t('common.public'),
      private: t('common.private')
    },

    // Form fields
    fields: {
      name: t('common.name'),
      email: t('common.email'),
      phone: t('common.phone'),
      address: t('common.address'),
      description: t('common.description'),
      date: t('common.date'),
      time: t('common.time'),
      status: t('common.status'),
      type: t('common.type'),
      category: t('common.category'),
      tags: t('common.tags'),
      location: t('common.location')
    }
  }), [t]);
};

export default useTranslation;