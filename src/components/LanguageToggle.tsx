import type { Language } from "../hooks/useTranslation";

interface Props {
  lang: Language;
  onToggle: (l: Language) => void;
}

export function LanguageToggle({ lang, onToggle }: Props) {
  return (
    <button
      onClick={() => onToggle(lang === "zh" ? "en" : "zh")}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full border border-amber-500/40 bg-black/50 backdrop-blur-sm text-amber-200 text-sm font-medium hover:bg-amber-900/30 transition-colors"
    >
      {lang === "zh" ? "EN" : "中"}
    </button>
  );
}
