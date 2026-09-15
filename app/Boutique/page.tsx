"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface Shop {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  products?: Product[];
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function BoutiquesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/shops`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        console.log("STATUT /api/shops :", response.status);
        console.log("RÉPONSE /api/shops :", data);

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          window.location.href = "/";
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || `Erreur HTTP ${response.status}`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "La réponse de Laravel n'est pas une liste de boutiques."
          );
        }

        setShops(data);
      } catch (err) {
        console.error("Erreur boutiques :", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Impossible de charger les boutiques.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* =========================
          NAVIGATION
      ========================== */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link
            href="/"
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black">X</span>
            </div>

            <span className="text-2xl font-black tracking-tight">
              Shop<span className="text-blue-500">X</span>
            </span>
          </Link>

          {/* Navigation */}
          <div className="hidden items-center gap-7 md:flex">
            <Link
              href="/"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Accueil
            </Link>

            <Link
              href="/Produits"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Catalogue
            </Link>

            <Link
              href="/Boutique"
              className="text-sm font-semibold text-blue-400"
            >
              Boutiques
            </Link>

            <Link
              href="/Commandes"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Commandes
            </Link>

            <Link
              href="/Compte"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Mon compte
            </Link>
          </div>

          {/* Boutons */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:text-white sm:block"
            >
              Accueil
            </Link>

            <Link
              href="/Produits"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Acheter
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================
          CONTENU
      ========================== */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <AnimatedContainer>
          <section className="relative mb-12 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950/40 via-gray-950 to-violet-950/30 p-8 md:p-12">
            {/* Glow */}
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                <span>✦</span>
                ShopX Marketplace
              </div>

              <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
                Découvrez nos{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                  boutiques
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
                Explorez les boutiques présentes sur ShopX et
                découvrez leurs produits, leurs offres et leurs
                collections.
              </p>

              <div className="mt-7 flex flex-wrap gap-4">
                <Link
                  href="/Produits"
                  className="rounded-xl bg-blue-600 px-6 py-3 font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
                >
                  Voir le catalogue →
                </Link>

                <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-gray-300">
                  🏪{" "}
                  <span className="ml-2">
                    {shops.length} boutique
                    {shops.length > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </AnimatedContainer>

        {/* =========================
            LOADING
        ========================== */}
        {loading && (
          <AnimatedContainer delay={0.1}>
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />

                <p className="text-gray-400">
                  Chargement des boutiques...
                </p>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* =========================
            ERREUR
        ========================== */}
        {!loading && error && (
          <AnimatedContainer delay={0.1}>
            <div className="mx-auto max-w-2xl rounded-2xl border border-red-500/20 bg-red-500/10 p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl">
                ⚠️
              </div>

              <h2 className="text-xl font-bold text-red-400">
                Impossible de charger les boutiques
              </h2>

              <p className="mt-3 text-gray-400">
                {error}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Vérifie également la console du navigateur pour
                voir la réponse exacte de Laravel.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="mt-6 rounded-xl bg-red-500/10 px-5 py-3 font-semibold text-red-400 transition hover:bg-red-500/20"
              >
                Réessayer
              </button>
            </div>
          </AnimatedContainer>
        )}

        {/* =========================
            AUCUNE BOUTIQUE
        ========================== */}
        {!loading && !error && shops.length === 0 && (
          <AnimatedContainer delay={0.2}>
            <div className="rounded-3xl border border-white/10 bg-gray-950 p-12 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-500/10 text-4xl">
                🏪
              </div>

              <h2 className="text-2xl font-bold">
                Aucune boutique disponible
              </h2>

              <p className="mx-auto mt-3 max-w-md text-gray-400">
                Les boutiques apparaîtront ici lorsqu'elles seront
                créées sur ShopX.
              </p>

              <Link
                href="/Produits"
                className="mt-7 inline-block rounded-xl bg-blue-600 px-6 py-3 font-bold transition hover:bg-blue-500"
              >
                Explorer les produits
              </Link>
            </div>
          </AnimatedContainer>
        )}

        {/* =========================
            BOUTIQUES
        ========================== */}
        {!loading && !error && shops.length > 0 && (
          <>
            <AnimatedContainer delay={0.15}>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-500">
                    Marketplace
                  </p>

                  <h2 className="mt-1 text-3xl font-bold">
                    Toutes les boutiques
                  </h2>
                </div>

                <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-400 sm:block">
                  {shops.length} disponible
                  {shops.length > 1 ? "s" : ""}
                </span>
              </div>
            </AnimatedContainer>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shops.map((shop, index) => {
                const productCount = shop.products?.length || 0;

                return (
                  <AnimatedContainer
                    key={shop.id}
                    delay={0.2 + index * 0.08}
                  >
                    <div className="group relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-gray-950 to-black p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10">
                      {/* Glow */}
                      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-600/10 blur-3xl transition group-hover:bg-blue-600/20" />

                      {/* Icône */}
                      <div className="relative mb-6 flex items-center justify-between">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-3xl shadow-lg shadow-blue-500/5">
                          🏪
                        </div>

                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          ● Active
                        </span>
                      </div>

                      {/* Nom */}
                      <h2 className="relative text-2xl font-bold transition group-hover:text-blue-400">
                        {shop.name}
                      </h2>

                      {/* Description */}
                      <p className="mt-3 min-h-[56px] text-sm leading-6 text-gray-400">
                        {shop.description ||
                          "Cette boutique n'a pas encore ajouté de description."}
                      </p>

                      {/* Produits */}
                      <div className="mt-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-400">
                            Produits disponibles
                          </span>

                          <span className="text-lg font-bold text-white">
                            {productCount}
                          </span>
                        </div>

                        {/* Petite barre */}
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-violet-500"
                            style={{
                              width: `${Math.min(
                                Math.max(productCount * 10, 8),
                                100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Footer carte */}
                      <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                        <div>
                          <p className="text-xs text-gray-500">
                            Boutique
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-300">
                            ShopX Store
                          </p>
                        </div>

                        <Link
                          href={`/Boutique/${shop.id}`}
                          className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold shadow-lg shadow-blue-600/10 transition hover:bg-blue-500"
                        >
                          Découvrir →
                        </Link>
                      </div>
                    </div>
                  </AnimatedContainer>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="mt-16 border-t border-white/10 bg-gray-950/50">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} ShopX. Tous droits réservés.
          </p>

          <div className="flex gap-5">
            <Link
              href="/Produits"
              className="transition hover:text-blue-400"
            >
              Catalogue
            </Link>

            <Link
              href="/Commandes"
              className="transition hover:text-blue-400"
            >
              Commandes
            </Link>

            <Link
              href="/Compte"
              className="transition hover:text-blue-400"
            >
              Mon compte
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}