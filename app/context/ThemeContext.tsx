"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";

import {
  notifyLocalStorageChange,
  useLocalStorageItem,
} from "@/lib/useLocalStorage";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

export { THEME_STORAGE_KEY };

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Clair par défaut ; la préférence est sauvegardée dans localStorage.
  const stored = useLocalStorageItem(THEME_STORAGE_KEY);
  const theme: Theme = stored === "dark" ? "dark" : "light";

  // Synchronise l'attribut lu par le CSS (aucun setState ici).
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // localStorage indisponible : le thème s'applique quand même ci-dessous.
    }

    document.documentElement.setAttribute("data-theme", next);
    notifyLocalStorageChange();
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  const value = useMemo(
    () => ({ theme, isDark: theme === "dark", setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error(
      "useTheme doit être utilisé à l'intérieur de ThemeProvider."
    );
  }

  return context;
}
