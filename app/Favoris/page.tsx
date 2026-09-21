"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import AnimatedContainer from "@/app/components/AnimatedContainer";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";

interface Shop {
  id: number;
  name: string;
  description?: string | null;
}

interface Product {
  id: number;
  user_id: number;
  shop_id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
  shop?: Shop | null;
}

interface CartItem {
  id: number;
  quantity: number;
}

interface Conversation {
  id: number;
  unread_count?: number;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function FavorisPage() {
  const router = useRouter();

  // =====================================================
  // AUTH GLOBAL
  // =====================================================

  const { user } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifications, setUnreadNotifications] =
    useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * =====================================================
   * DÉCONNEXION
   * =====================================================
   */

  const forceLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/Connexion");
  };

  /*
   * =====================================================
   * CHARGER LES FAVORIS
   * =====================================================
   */

  const loadFavorites = () => {
    const storedFavorites =
      localStorage.getItem("shopx_favorites");

    if (!storedFavorites) {
      setFavoriteIds([]);
      return [];
    }

    try {
      const parsed: number[] =
        JSON.parse(storedFavorites);

      setFavoriteIds(parsed);

      return parsed;
    } catch (err) {
      console.error(
        "Erreur favoris :",
        err
      );

      setFavoriteIds([]);

      return [];
    }
  };

  /*
   * =====================================================
   * PRODUITS
   * =====================================================
   */

  const fetchProducts = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/products`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        forceLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Impossible de récupérer les produits."
        );
      }

      const data =
        await response.json();

      const allProducts: Product[] =
        Array.isArray(data)
          ? data
          : data.products || [];

      const storedFavorites =
        localStorage.getItem(
          "shopx_favorites"
        );

      let ids: number[] = [];

      if (storedFavorites) {
        try {
          ids = JSON.parse(
            storedFavorites
          );
        } catch {
          ids = [];
        }
      }

      setFavoriteIds(ids);

      const favoriteProducts =
        allProducts.filter(
          (product) =>
            ids.includes(product.id)
        );

      setProducts(
        favoriteProducts
      );
    } catch (err) {
      console.error(
        "Erreur favoris :",
        err
      );

      setError(
        "Impossible de récupérer vos favoris."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * =====================================================
   * PANIER
   * =====================================================
   */

  const fetchCart = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) return;

      const response =
        await fetch(
          `${API_URL}/cart`,
          {
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) return;

      const data =
        await response.json();

      const items: CartItem[] =
        Array.isArray(data)
          ? data
          : data.items || [];

      const total =
        items.reduce(
          (sum, item) =>
            sum +
            Number(
              item.quantity || 0
            ),
          0
        );

      setCartCount(total);
    } catch (err) {
      console.error(
        "Erreur panier :",
        err
      );
    }
  };

  /*
   * =====================================================
   * MESSAGES
   * =====================================================
   */

  const fetchMessages = async () => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) return;

      const response =
        await fetch(
          `${API_URL}/conversations`,
          {
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      if (!response.ok) return;

      const data: Conversation[] =
        await response.json();

      const total =
        data.reduce(
          (sum, conversation) =>
            sum +
            (
              conversation.unread_count ||
              0
            ),
          0
        );

      setUnreadMessages(total);
    } catch (err) {
      console.error(
        "Erreur messages :",
        err
      );
    }
  };

  /*
   * =====================================================
   * NOTIFICATIONS
   * =====================================================
   */

  const fetchNotifications =
    async () => {
      try {
        const token =
          localStorage.getItem("token");

        if (!token) return;

        const response =
          await fetch(
            `${API_URL}/notifications`,
            {
              headers: {
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        if (!response.ok) return;

        const data =
          await response.json();

        setUnreadNotifications(
          data.unread_count || 0
        );
      } catch (err) {
        console.error(
          "Erreur notifications :",
          err
        );
      }
    };

  /*
   * =====================================================
   * RETIRER DES FAVORIS
   * =====================================================
   */

  const removeFavorite = (
    productId: number
  ) => {
    const updated =
      favoriteIds.filter(
        (id) =>
          id !== productId
      );

    localStorage.setItem(
      "shopx_favorites",
      JSON.stringify(updated)
    );

    setFavoriteIds(updated);

    setProducts(
      (previous) =>
        previous.filter(
          (product) =>
            product.id !==
            productId
        )
    );

    window.dispatchEvent(
      new Event("favoritesUpdated")
    );
  };

  /*
   * =====================================================
   * AJOUTER AU PANIER
   * =====================================================
   */

  const addToCart = async (
    productId: number
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const response =
        await fetch(
          `${API_URL}/cart`,
          {
            method: "POST",
            headers: {
              Accept:
                "application/json",
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            body: JSON.stringify({
              product_id:
                productId,
              quantity: 1,
            }),
          }
        );

      const data =
        await response.json();

      if (response.status === 401) {
        forceLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'ajouter le produit au panier."
        );
      }

      await fetchCart();
    } catch (err) {
      console.error(
        "Erreur panier :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter le produit au panier."
      );
    }
  };

  /*
   * =====================================================
   * INITIALISATION
   * =====================================================
   */

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      forceLogout();
      return;
    }

    loadFavorites();

    fetchProducts();
    fetchCart();
    fetchMessages();
    fetchNotifications();
  }, []);

  /*
   * =====================================================
   * RENDU
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-[#020407] text-white">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-[-15%] top-[-15%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.08] blur-[140px]" />

        <div className="absolute right-[-10%] top-[20%] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.06] blur-[140px]" />

      </div>

      {/* =====================================================
          NAVIGATION GLOBALE SHOPX
      ===================================================== */}

      <Navbar />

      {/* =====================================================
          CONTENU
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">

        {/* =====================================================
            HERO
        ===================================================== */}

        <AnimatedContainer>

          <section className="mb-10 overflow-hidden rounded-3xl border border-red-400/10 bg-gradient-to-br from-red-500/[0.06] via-[#05070b] to-blue-500/[0.04] p-8">

            <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">

              <div>

                <div className="mb-4 flex items-center gap-2">

                  <span className="text-2xl text-red-400">
                    ♥
                  </span>

                  <span className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
                    SHOPX FAVORIS
                  </span>

                </div>

                <h1 className="text-4xl font-black md:text-5xl">

                  Mes{" "}

                  <span className="bg-gradient-to-r from-red-300 to-pink-400 bg-clip-text text-transparent">
                    favoris
                  </span>

                </h1>

                <p className="mt-4 max-w-xl text-sm leading-7 text-zinc-500">
                  Retrouvez ici les produits
                  que vous souhaitez garder
                  de côté.
                </p>

              </div>

              <div className="rounded-2xl border border-red-400/15 bg-red-500/[0.04] px-6 py-5">

                <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                  Produits favoris
                </p>

                <p className="mt-1 text-3xl font-black text-red-400">
                  {products.length}
                </p>

              </div>

            </div>

          </section>

        </AnimatedContainer>

        {/* =====================================================
            ERREUR
        ===================================================== */}

        {error && (

          <AnimatedContainer delay={0.1}>

            <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400">
              {error}
            </div>

          </AnimatedContainer>

        )}

        {/* =====================================================
            CHARGEMENT
        ===================================================== */}

        {loading ? (

          <AnimatedContainer delay={0.15}>

            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-r-red-400 border-t-red-400" />

                <p className="text-sm text-zinc-600">
                  Chargement de vos favoris...
                </p>

              </div>

            </div>

          </AnimatedContainer>

        ) : products.length === 0 ? (

          /* =====================================================
             AUCUN FAVORI
          ===================================================== */

          <AnimatedContainer delay={0.2}>

            <div className="rounded-3xl border border-white/10 bg-[#05070a] p-14 text-center">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/15 bg-red-500/[0.05] text-3xl text-red-400">
                ♡
              </div>

              <h2 className="text-xl font-black">
                Aucun favori
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                Ajoutez des produits à vos
                favoris depuis le catalogue
                ShopX pour les retrouver ici.
              </p>

              <Link
                href="/Produits"
                className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-black text-white transition hover:shadow-[0_0_30px_rgba(59,130,246,0.25)]"
              >
                Découvrir les produits
              </Link>

            </div>

          </AnimatedContainer>

        ) : (

          /* =====================================================
             PRODUITS FAVORIS
          ===================================================== */

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

            {products.map(
              (
                product,
                index
              ) => (

                <AnimatedContainer
                  key={product.id}
                  delay={
                    0.2 +
                    index * 0.06
                  }
                >

                  <article className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#05070a] transition duration-300 hover:-translate-y-1 hover:border-red-400/30 hover:shadow-[0_20px_60px_rgba(239,68,68,0.08)]">

                    <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400 to-transparent opacity-60" />

                    {/* =================================================
                        PRODUIT
                    ================================================= */}

                    <div className="relative border-b border-white/[0.06] p-6">

                      <div className="mb-5 flex items-start justify-between">

                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-blue-500/10 text-3xl text-blue-300">
                          ◈
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            removeFavorite(
                              product.id
                            )
                          }
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-400/30 bg-red-500/10 text-xl text-red-400 transition hover:border-red-400/50 hover:bg-red-500/20 hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                          title="Retirer des favoris"
                          aria-label="Retirer des favoris"
                        >
                          ♥
                        </button>

                      </div>

                      <h2 className="line-clamp-1 text-xl font-black">
                        {product.name}
                      </h2>

                      <p className="mt-2 min-h-[42px] text-sm leading-6 text-zinc-600">
                        {product.description ||
                          "Aucune description disponible."}
                      </p>

                    </div>

                    {/* =================================================
                        INFORMATIONS
                    ================================================= */}

                    <div className="p-6">

                      {/* BOUTIQUE */}

                      {product.shop && (

                        <button
                          type="button"
                          onClick={() =>
                            router.push(
                              `/Boutique/${product.shop?.id}`
                            )
                          }
                          className="mb-5 flex w-full items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-blue-400/20 hover:bg-blue-500/[0.04]"
                        >

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-300">
                            ◇
                          </div>

                          <div className="min-w-0">

                            <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                              Boutique
                            </p>

                            <p className="truncate text-sm font-bold text-blue-300">
                              {product.shop.name}
                            </p>

                          </div>

                        </button>

                      )}

                      {/* PRIX / STOCK */}

                      <div className="flex items-end justify-between">

                        <div>

                          <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                            Prix
                          </p>

                          <p className="mt-1 text-2xl font-black text-blue-300">

                            {Number(
                              product.price
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}

                            <span className="text-sm text-cyan-400">
                              FCFA
                            </span>

                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                            Stock
                          </p>

                          <p
                            className={`mt-1 text-lg font-black ${
                              product.stock > 0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {product.stock}
                          </p>

                        </div>

                      </div>

                      {/* PANIER */}

                      <button
                        type="button"
                        onClick={() =>
                          addToCart(
                            product.id
                          )
                        }
                        disabled={
                          product.stock <= 0
                        }
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-black text-white transition hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:bg-none disabled:text-zinc-600"
                      >
                        {product.stock > 0
                          ? "🛒 Ajouter au panier"
                          : "Rupture de stock"}
                      </button>

                    </div>

                  </article>

                </AnimatedContainer>

              )
            )}

          </div>

        )}

      </div>

    </main>
  );
}