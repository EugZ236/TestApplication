import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import {
  APP_LANGUAGE_STORAGE_KEY,
  AppLanguage,
  getDefaultLanguage,
  translate,
} from "@/src/i18n/translations";

type TranslateParams = Record<string, string | number>;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (next: AppLanguage) => Promise<void>;
  t: (key: string, params?: TranslateParams) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function AppLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(getDefaultLanguage);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const saved = await AsyncStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
        if (!mounted) {
          return;
        }

        if (saved === "uk" || saved === "en") {
          setLanguageState(saved);
        }
      } catch (error) {
        console.error("Failed to load language pref", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const setLanguage = useCallback(async (next: AppLanguage) => {
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(APP_LANGUAGE_STORAGE_KEY, next);
    } catch (error) {
      console.error("Failed to save language pref", error);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: TranslateParams) => translate(language, key, params),
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      language: getDefaultLanguage(),
      setLanguage: async (_next: AppLanguage) => {},
      t: (key: string, _params?: TranslateParams) => key,
    };
  }

  return ctx;
}
