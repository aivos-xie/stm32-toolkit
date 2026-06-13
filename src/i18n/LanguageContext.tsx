/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { translations, type Lang } from "./translations";

interface LanguageContextType {
  lang: Lang;
  t: (key: string) => string;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  t: (key: string) => key,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("stm32-toolkit-lang");
    return saved === "zh" ? "zh" : "en";
  });

  const t = useCallback(
    (key: string) => {
      return translations[lang][key] ?? key;
    },
    [lang]
  );

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === "en" ? "zh" : "en";
      localStorage.setItem("stm32-toolkit-lang", next);
      return next;
    });
  }, []);

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useT() {
  const { t } = useContext(LanguageContext);
  return t;
}

export function useLang() {
  const { lang, toggleLang } = useContext(LanguageContext);
  return { lang, toggleLang };
}
