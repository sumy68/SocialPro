import { useMemo } from "react";

const dict = {
  de: { settings: { title: "Einstellungen" } },
  en: { settings: { title: "Settings" } },
};

export function useTranslation(locale: "de" | "en" = "de") {
  const t = useMemo(() => dict[locale] ?? dict.de, [locale]);
  return { t, locale };
}
export default useTranslation;
