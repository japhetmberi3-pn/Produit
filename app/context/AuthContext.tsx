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

export interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
  profile_photo?: string | null;
  profile_photo_url?: string | null;
  is_online?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

const parseUser = (raw: string | null): User | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);

    return parsed?.id ? (parsed as User) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  // localStorage est la source de vérité : pas de copie dans un useState,
  // donc pas de setState dans un useEffect, et synchronisation entre onglets.
  const token = useLocalStorageItem("token");
  const rawUser = useLocalStorageItem("user");
  const user = useMemo(() => parseUser(rawUser), [rawUser]);

  // Nettoie un "user" corrompu (aucun setState ici).
  useEffect(() => {
    if (rawUser && !user) {
      console.error("Utilisateur invalide dans localStorage, suppression.");
      localStorage.removeItem("user");
    }
  }, [rawUser, user]);

  /**
   * Met à jour localStorage puis notifie :
   * tous les composants utilisant useAuth() sont immédiatement actualisés.
   */
  const setUser = useCallback((updatedUser: User | null) => {
    if (updatedUser) {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } else {
      localStorage.removeItem("user");
    }

    notifyLocalStorageChange();
  }, []);

  // useCallback : référence stable, utilisable dans les dépendances de useEffect.
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    notifyLocalStorageChange();
  }, []);

  const value = useMemo(
    () => ({ user, token, setUser, logout }),
    [user, token, setUser, logout]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth doit être utilisé à l'intérieur de AuthProvider."
    );
  }

  return context;
}