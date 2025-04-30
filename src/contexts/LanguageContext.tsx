import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Language } from '../i18n/types';

interface LanguageContextType {
  selectedLanguage: Language;
  setSelectedLanguage: (language: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(() => {
    // Usar localStorage para persistir a escolha do idioma, mas apenas durante a inicialização
    try {
      const savedLanguage = localStorage.getItem('selectedLanguage');
      return (savedLanguage as Language) || "pt-BR";
    } catch (e) {
      // Em caso de erro ao acessar localStorage (ex: navegação privada)
      return "pt-BR";
    }
  });

  // Usando useCallback para evitar recriações desnecessárias da função
  const handleLanguageChange = useCallback((language: Language) => {
    // Usando uma atualização funcional do estado para garantir o valor mais recente
    setSelectedLanguage(prevLanguage => {
      if (prevLanguage !== language) {
        // Usar setTimeout para evitar bloqueio da UI
        setTimeout(() => {
          try {
            localStorage.setItem('selectedLanguage', language);
          } catch (e) {
            console.warn('Falha ao salvar idioma no localStorage:', e);
          }
        }, 0);
        return language;
      }
      return prevLanguage;
    });
  }, []);

  // Sincroniza o valor do localStorage apenas quando o selectedLanguage mudar
  useEffect(() => {
    try {
      localStorage.setItem('selectedLanguage', selectedLanguage);
    } catch (e) {
      console.warn('Falha ao salvar idioma no localStorage:', e);
    }
  }, [selectedLanguage]);

  const contextValue = React.useMemo(() => ({
    selectedLanguage,
    setSelectedLanguage: handleLanguageChange
  }), [selectedLanguage, handleLanguageChange]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};