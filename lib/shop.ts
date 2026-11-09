"use client";

import { useCallback, useMemo } from "react";

import { apiFetch } from "@/lib/api";
import { useLocalStorageItem } from "@/lib/useLocalStorage";

/* =========================================================
   TYPES
========================================================= */

export interface Shop {
  id: number;
  name: string;
  description?: string | null;
}

export interface Product {
  id: number;
  user_id: number;
  shop_id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
  rating?: number;
  average_rating?: number;
  reviews_count?: number;
  shop?: Shop | null;
}

/* =========================================================
   FORMATAGE
========================================================= */

export const formatPrice = (value: number) =>
  Number(value).toLocaleString("fr-FR");

/** Minuscules sans accents, pour une recherche tolérante. */
export const normalizeText = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/* =========================================================
   PANIER
========================================================= */

/** Événement écouté par la Navbar pour rafraîchir le badge du panier. */
export const CART_UPDATED_EVENT = "cartUpdated";

export async function addToCart(productId: number, quantity = 1) {
  await apiFetch("/cart", {
    method: "POST",
    body: { product_id: productId, quantity },
  });

  window.dispatchEvent(new Event(CART_UPDATED_EVENT));
}

/* =========================================================
   FAVORIS (stockés dans localStorage)
========================================================= */

export const FAVORITES_KEY = "shopx_favorites";
export const FAVORITES_UPDATED_EVENT = "favoritesUpdated";
const FAVORITES_EVENTS = [FAVORITES_UPDATED_EVENT] as const;

export function parseFavorites(raw: string | null): number[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return Array.from(
      new Set(parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id)))
    );
  } catch {
    return [];
  }
}

function writeFavorites(ids: number[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(FAVORITES_UPDATED_EVENT));
}

export function useFavorites() {
  const raw = useLocalStorageItem(FAVORITES_KEY, FAVORITES_EVENTS);
  const ids = useMemo(() => parseFavorites(raw), [raw]);

  const toggle = useCallback((productId: number) => {
    const current = parseFavorites(localStorage.getItem(FAVORITES_KEY));

    writeFavorites(
      current.includes(productId)
        ? current.filter((id) => id !== productId)
        : [...current, productId]
    );
  }, []);

  const remove = useCallback((productId: number) => {
    const current = parseFavorites(localStorage.getItem(FAVORITES_KEY));

    if (current.includes(productId)) {
      writeFavorites(current.filter((id) => id !== productId));
    }
  }, []);

  const isFavorite = useCallback((productId: number) => ids.includes(productId), [ids]);

  return { ids, count: ids.length, isFavorite, toggle, remove };
}
