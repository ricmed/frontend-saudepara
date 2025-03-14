import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useTranslation } from '@/i18n/useTranslations';
import { LanguageSelectorProps } from './types';
import { languages } from './data';

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onLanguageChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { t } = useTranslation(selectedLanguage);
  const selectedLang = languages.find(lang => lang.code === selectedLanguage);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.language-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative language-dropdown">
      <div className="flex items-center gap-2 text-white/90 mb-2 px-2">
        <Globe className="h-5 w-5" />
        <span className="text-sm">{t('language.select')}</span>
      </div>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-blue-800/50 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-3">
          <img
            src={selectedLang?.flag}
            alt={`${selectedLang?.name} flag`}
            className="w-5 h-4 object-cover rounded-sm"
          />
          <span className="text-sm">{selectedLang?.fullName}</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div 
          className="absolute bottom-full left-0 right-0 mb-1 bg-blue-900 rounded-lg overflow-hidden shadow-lg border border-blue-800 dropdown-menu animate-fadeIn"
          role="listbox"
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                onLanguageChange(lang.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                selectedLanguage === lang.code
                  ? 'bg-blue-600 text-white'
                  : 'text-white/90 hover:bg-blue-800'
              }`}
              role="option"
              aria-selected={selectedLanguage === lang.code}
            >
              <img
                src={lang.flag}
                alt={`${lang.name} flag`}
                className="w-5 h-4 object-cover rounded-sm"
              />
              <span>{lang.fullName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;