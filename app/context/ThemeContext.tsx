"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from "react";

interface ThemeContextType {
  lightOn: boolean;
  setLightOn: Dispatch<SetStateAction<boolean>>;
  toggleLight: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [lightOn, setLightOn] = useState<boolean>(false);

  // Récupérer l'état sauvegardé
  useEffect(() => {
    const savedLight = localStorage.getItem("shopx_light_on");

    if (savedLight === "true") {
      setLightOn(true);
    }
  }, []);

  // Sauvegarder automatiquement l'état
  useEffect(() => {
    localStorage.setItem(
      "shopx_light_on",
      String(lightOn)
    );
  }, [lightOn]);

  const toggleLight = () => {
    setLightOn((previous) => !previous);
  };

  return (
    <ThemeContext.Provider
      value={{
        lightOn,
        setLightOn,
        toggleLight,
      }}
    >
      {children}
    </ThemeContext.Provider>
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