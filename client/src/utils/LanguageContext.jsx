import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('etender_lang') || 'en';
  });

  const setLanguage = (lang) => {
    localStorage.setItem('etender_lang', lang);
    setLanguageState(lang);
  };

  const t = (key) => {
    if (translations[language] && translations[language][key]) {
      return translations[language][key];
    }
    if (translations.en && translations.en[key]) {
      return translations.en[key];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage, 
      lang: language, 
      setLang: setLanguage, 
      t 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: 'en',
      setLanguage: () => {},
      lang: 'en',
      setLang: () => {},
      t: (key) => key
    };
  }
  return context;
}
