"use client";

import { useCallback, useSyncExternalStore } from "react";

/** Événement émis après une écriture locale (l'événement "storage" ne se déclenche que dans les AUTRES onglets). */
export const LOCAL_STORAGE_EVENT = "local-storage-change";

export function notifyLocalStorageChange() {
  window.dispatchEvent(new Event(LOCAL_STORAGE_EVENT));
}

const readItem = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

/**
 * Lit une clé de localStorage et re-rend le composant quand elle change
 * (autre onglet, notifyLocalStorageChange(), ou l'un des `extraEvents`).
 * Renvoie null côté serveur, ce qui évite les erreurs d'hydratation.
 */
export function useLocalStorageItem(
  key: string,
  extraEvents: readonly string[] = []
): string | null {
  const eventsKey = extraEvents.join("|");

  const subscribe = useCallback(
    (onChange: () => void) => {
      const events = ["storage", LOCAL_STORAGE_EVENT, ...eventsKey.split("|").filter(Boolean)];

      events.forEach((event) => window.addEventListener(event, onChange));

      return () => {
        events.forEach((event) => window.removeEventListener(event, onChange));
      };
    },
    [eventsKey]
  );

  return useSyncExternalStore(
    subscribe,
    () => readItem(key),
    () => null
  );
}
