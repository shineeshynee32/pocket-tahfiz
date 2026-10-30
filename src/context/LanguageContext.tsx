"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ms" | "ar";

interface LanguageContextType {
  lang: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLanguage: () => {},
  isRTL: false,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // 1. On startup, safely read preference AFTER page has mounted in the browser
  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("preferred_lang") as Language;
    if (saved && ["en", "ms", "ar"].includes(saved)) {
      setLangState(saved);
      document.documentElement.lang = saved;
      document.documentElement.dir = saved === "ar" ? "rtl" : "ltr";
    }
  }, []);

  // 2. Keep the HTML lang and direction attributes updated
  useEffect(() => {
    if (mounted) {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    }
  }, [lang, mounted]);

  const setLanguage = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("preferred_lang", newLang);
  };

  const isRTL = lang === "ar";

  return (
    <LanguageContext.Provider value={{ lang, setLanguage, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
