import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supportedLanguages } from '@/i18n';

interface LanguageSelectorProps {
  variant?: 'default' | 'compact';
  showLabel?: boolean;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'default',
  showLabel = true,
  className = ''
}) => {
  const { i18n, t } = useTranslation();

  const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      
      // Update document language and direction
      document.documentElement.lang = languageCode;
      document.documentElement.dir = ['ar'].includes(languageCode) ? 'rtl' : 'ltr';
      
      // Store preference in localStorage
      localStorage.setItem('gradapp-language', languageCode);
      
      // Optional: Send analytics event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'language_change', {
          new_language: languageCode,
          previous_language: i18n.language
        });
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className={`p-2 ${className}`}>
            <span className="text-lg" role="img" aria-label={currentLanguage.name}>
              {currentLanguage.flag}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {supportedLanguages.map((language) => (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg" role="img" aria-label={language.name}>
                  {language.flag}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{language.nativeName}</span>
                  <span className="text-xs text-gray-500">{language.name}</span>
                </div>
              </div>
              {i18n.language === language.code && (
                <Check className="h-4 w-4 text-green-600" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={`flex items-center space-x-2 ${className}`}>
          <Globe className="h-4 w-4" />
          <span className="text-lg" role="img" aria-label={currentLanguage.name}>
            {currentLanguage.flag}
          </span>
          {showLabel && (
            <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5 text-sm font-medium text-gray-700 border-b border-gray-100">
          {t('common.language')}
        </div>
        {supportedLanguages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex items-center space-x-3">
              <span className="text-lg w-6" role="img" aria-label={language.name}>
                {language.flag}
              </span>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{language.nativeName}</span>
                <span className="text-xs text-gray-500">{language.name}</span>
              </div>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-green-600" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Language switcher for mobile/responsive design
export const MobileLanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await i18n.changeLanguage(languageCode);
      document.documentElement.lang = languageCode;
      document.documentElement.dir = ['ar'].includes(languageCode) ? 'rtl' : 'ltr';
      localStorage.setItem('gradapp-language', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-700">{t('common.language')}</h3>
      <div className="grid grid-cols-2 gap-2">
        {supportedLanguages.map((language) => (
          <button
            key={language.code}
            onClick={() => handleLanguageChange(language.code)}
            className={`flex items-center space-x-2 p-2 rounded-md text-left transition-colors ${
              i18n.language === language.code
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-100'
            }`}
          >
            <span className="text-lg" role="img" aria-label={language.name}>
              {language.flag}
            </span>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{language.nativeName}</span>
              <span className="text-xs text-gray-500">{language.name}</span>
            </div>
            {i18n.language === language.code && (
              <Check className="h-4 w-4 text-blue-600 ml-auto" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

// Language detection hook
export const useLanguageDetection = () => {
  const { i18n } = useTranslation();

  React.useEffect(() => {
    // Detect language from URL, localStorage, or browser
    const detectLanguage = () => {
      // 1. Check URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const urlLang = urlParams.get('lang');
      if (urlLang && supportedLanguages.some(lang => lang.code === urlLang)) {
        return urlLang;
      }

      // 2. Check localStorage
      const storedLang = localStorage.getItem('gradapp-language');
      if (storedLang && supportedLanguages.some(lang => lang.code === storedLang)) {
        return storedLang;
      }

      // 3. Check browser language
      const browserLang = navigator.language.split('-')[0];
      if (supportedLanguages.some(lang => lang.code === browserLang)) {
        return browserLang;
      }

      // 4. Default to English
      return 'en';
    };

    const detectedLanguage = detectLanguage();
    if (detectedLanguage !== i18n.language) {
      i18n.changeLanguage(detectedLanguage);
    }

    // Set initial document properties
    document.documentElement.lang = detectedLanguage;
    document.documentElement.dir = ['ar'].includes(detectedLanguage) ? 'rtl' : 'ltr';
  }, [i18n]);

  return {
    currentLanguage: i18n.language,
    supportedLanguages,
    changeLanguage: i18n.changeLanguage
  };
};

export default LanguageSelector;