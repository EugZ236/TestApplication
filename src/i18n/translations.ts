import type { Dictionary } from "./dictionary.types";
import { en } from "./i18n.en";
import { uk } from "./i18n.uk";

export type AppLanguage = "uk" | "en";

export const APP_LANGUAGE_STORAGE_KEY = "app_language_pref";

export const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  uk: "Українська",
  en: "English",
};

const translations: Record<AppLanguage, Dictionary> = {
  uk,
  en,
};

function readPath(source: Dictionary, path: string): string | null {
  const parts = path.split(".").filter(Boolean);
  let current: string | Dictionary | undefined = source;

  for (const part of parts) {
    if (!current || typeof current === "string") {
      return null;
    }
    current = current[part];
  }

  return typeof current === "string" ? current : null;
}

function applyParams(
  template: string,
  params?: Record<string, string | number>,
): string {
  if (!params) {
    return template;
  }

  return Object.entries(params).reduce((acc, [key, value]) => {
    return acc.replaceAll(`{{${key}}}`, String(value));
  }, template);
}

export function getDefaultLanguage(): AppLanguage {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase();
  return locale.startsWith("en") ? "en" : "uk";
}

export function translate(
  language: AppLanguage,
  key: string,
  params?: Record<string, string | number>,
): string {
  const selected = readPath(translations[language], key);
  const fallback = readPath(translations.uk, key);
  const raw = selected ?? fallback ?? key;
  return applyParams(raw, params);
}
