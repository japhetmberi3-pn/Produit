"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface Shop {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  shop?: Shop | null;
  user?: {
    id: number;
    name: string;
  } | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function RecherchePage() {
  const searchParams = useSearchParams();

  const query = searchParams.get("q")?.trim() || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const searchProducts = async () => {
      if (!query) {
        setProducts([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/products/search?q=${encodeURIComponent(query)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(
            data?.message || "Erreur lors de la recherche."
          );
        }

        const data = await response.json();

        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Erreur recherche :", err);

        setError(
          err instanceof Error
            ? err.message
            : "Impossible d'effectuer la recherche."
        );

        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query]);

  return (
    <main className="min-h-screen bg-black text-white">

      {/* ========================================================= */}
      {/* ARRIÈRE-PLAN                                              */}
      {/* ========================================================= */}

      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[5%] top-[15%] h-32 w-32 rounded-full border border-blue-500/10 bg-blue-500/5 blur-[1px]" />

        <div className="absolute right-[8%] top-[25%] h-24 w-24 rotate-12 rounded-2xl border border-purple-500/10 bg-purple-500/5" />

        <div className="absolute left-[15%] top-[60%] h-20 w-20 rotate-45 border border-cyan-400/10 bg-cyan-400/5" />

        <div className="absolute right-[15%] top-[70%] h-32 w-32 rounded-full border border-indigo-500/10 bg-indigo-500/5" />
      </div>

      {/* ========================================================= */}
      {/* HEADER                                                     */}
      {/* ========================================================= */}

      <header className="relative z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            <span className="text-white">SHOP</span>
            <span className="text-blue-500">X</span>
          </Link>

          <Link
            href="/Produits"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
          >
            Voir les produits
          </Link>

        </div>
      </header>

      {/* ========================================================= */}
      {/* CONTENU                                                     */}
      {/* ========================================================= */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12">

        {/* ======================================================= */}
        {/* TITRE                                                     */}
        {/* ======================================================= */}

        <AnimatedContainer delay={0}>
          <div className="mb-10">

            <p className="mb-2 text-sm font-medium uppercase tracking-widest text-blue-400">
              Recherche ShopX
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Résultats pour{" "}
              <span className="text-blue-500">
                « {query} »
              </span>
            </h1>

            {!loading && !error && (
              <p className="mt-3 text-sm text-gray-500">
                {products.length}{" "}
                {products.length > 1
                  ? "produits trouvés"
                  : "produit trouvé"}
              </p>
            )}

          </div>
        </AnimatedContainer>

        {/* ======================================================= */}
        {/* CHARGEMENT                                                */}
        {/* ======================================================= */}

        {loading && (
          <AnimatedContainer delay={0.1}>
            <div className="flex min-h-[300px] items-center justify-center">

              <div className="text-center">

                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

                <p className="text-sm text-gray-400">
                  Recherche des produits...
                </p>

              </div>

            </div>
          </AnimatedContainer>
        )}

        {/* ======================================================= */}
        {/* ERREUR                                                    */}
        {/* ======================================================= */}

        {!loading && error && (
          <AnimatedContainer delay={0.1}>
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">

              <p className="font-semibold text-red-400">
                Une erreur est survenue
              </p>

              <p className="mt-2 text-sm text-gray-400">
                {error}
              </p>

            </div>
          </AnimatedContainer>
        )}

        {/* ======================================================= */}
        {/* AUCUN RÉSULTAT                                            */}
        {/* ======================================================= */}

        {!loading && !error && products.length === 0 && (
          <AnimatedContainer delay={0.15}>
            <div className="flex min-h-[350px] items-center justify-center rounded-3xl border border-white/10 bg-zinc-900/40 px-6">

              <div className="max-w-md text-center">

                <div className="mb-5 text-5xl">
                  🔍
                </div>

                <h2 className="text-2xl font-bold">
                  Aucun produit trouvé
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  Aucun produit ne correspond à votre recherche
                  <span className="font-semibold text-gray-300">
                    {" "}
                    « {query} »
                  </span>
                  .
                </p>

                <Link
                  href="/Produits"
                  className="mt-6 inline-flex rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02]"
                >
                  Parcourir les produits
                </Link>

              </div>

            </div>
          </AnimatedContainer>
        )}

        {/* ======================================================= */}
        {/* PRODUITS                                                  */}
        {/* ======================================================= */}

        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

            {products.map((product, index) => (
              <AnimatedContainer
                key={product.id}
                delay={0.1 + index * 0.08}
              >
                <article
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/70 shadow-xl shadow-black/20 backdrop-blur-sm transition duration-300 hover:-translate-y-2 hover:border-blue-500/30 hover:shadow-blue-500/10"
                >

                  {/* Image / aperçu */}
                  <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-800 via-zinc-900 to-black">

                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10 opacity-0 transition duration-500 group-hover:opacity-100" />

                    <div className="relative text-6xl transition duration-500 group-hover:scale-110 group-hover:rotate-3">
                      🛍️
                    </div>

                    {/* Stock */}
                    <div className="absolute right-3 top-3">

                      {product.stock > 0 ? (
                        <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-400">
                          En stock
                        </span>
                      ) : (
                        <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-400">
                          Rupture
                        </span>
                      )}

                    </div>

                  </div>

                  {/* Informations */}
                  <div className="p-5">

                    <h2 className="line-clamp-1 text-lg font-bold text-white">
                      {product.name}
                    </h2>

                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-gray-400">
                      {product.description ||
                        "Aucune description disponible."}
                    </p>

                    {/* Boutique */}
                    {product.shop && (
                      <p className="mt-4 text-xs text-gray-500">
                        Boutique :{" "}
                        <span className="font-medium text-gray-300">
                          {product.shop.name}
                        </span>
                      </p>
                    )}

                    {/* Prix */}
                    <div className="mt-5 flex items-center justify-between">

                      <div>

                        <p className="text-xs text-gray-500">
                          Prix
                        </p>

                        <p className="text-xl font-black text-blue-400">
                          {Number(product.price).toLocaleString(
                            "fr-FR"
                          )}{" "}
                          <span className="text-sm font-semibold">
                            FCFA
                          </span>
                        </p>

                      </div>

                      <Link
                        href={`/Produits/${product.id}`}
                        className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-blue-500/10 transition hover:-translate-y-1 hover:from-blue-500 hover:to-indigo-500"
                      >
                        Voir
                      </Link>

                    </div>

                  </div>

                </article>
              </AnimatedContainer>
            ))}

          </div>
        )}

      </section>
    </main>
  );
}
