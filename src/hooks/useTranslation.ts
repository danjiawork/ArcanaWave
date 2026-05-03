// src/hooks/useTranslation.ts
import { useState, useCallback } from "react";
import zh from "../i18n/zh.json";
import en from "../i18n/en.json";

export type Language = "zh" | "en";

const messages: Record<Language, Record<string, string>> = { zh, en };

function getInitialLanguage(): Language {
  const stored = localStorage.getItem("arcanawave-lang");
  if (stored === "zh" || stored === "en") return stored;
  return navigator.language.startsWith("zh") ? "zh" : "en";
}

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(getInitialLanguage);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    localStorage.setItem("arcanawave-lang", l);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let text = messages[lang][key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    },
    [lang]
  );

  return { t, lang, setLang };
}
