"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function BoutiqueDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | RÉCUPÉRER LA BOUTIQUE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          setLoading(false);
          return;
        }

        const shopId = params.id;

        const response = await fetch(
          `${API_URL}/shops/${shopId}`,
          {
            method: "GET",

            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(
          "STATUT boutique :",
          response.status
        );

        console.log(
          "RÉPONSE boutique :",
          data
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");

          router.push("/");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Erreur HTTP ${response.status}`
          );
        }

        setShop(data);
      } catch (err) {
        console.error(
          "Erreur boutique :",
          err
        );

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "Impossible de charger la boutique."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [params.id, router]);

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#050509] text-white">

        {/* Lueurs */}

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative flex min-h-screen items-center justify-center px-6">

          <AnimatedContainer>

            <div className="text-center">

              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">

                <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-400" />

              </div>

              <h1 className="text-xl font-bold">
                Chargement de la boutique
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Récupération des informations...
              </p>

            </div>

          </AnimatedContainer>

        </div>

      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERREUR
  |--------------------------------------------------------------------------
  */

  if (error || !shop) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#050509] text-white">

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6">

          <AnimatedContainer>

            <div className="w-full rounded-3xl border border-red-500/20 bg-[#0d0d14] p-8 text-center shadow-2xl shadow-black/30 sm:p-12">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-red-500/20 bg-red-500/10 text-4xl">
                🏪
              </div>

              <p className="mb-2 text-sm font-medium uppercase tracking-[0.2em] text-red-400">
                SHOPX
              </p>

              <h1 className="text-3xl font-black">
                Boutique introuvable
              </h1>

              <p className="mx-auto mt-4 max-w-lg text-gray-500">
                {error ||
                  "Cette boutique n'existe pas ou n'est plus disponible."}
              </p>

              <button
                onClick={() =>
                  router.push("/Boutique")
                }
                className="mt-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 font-bold shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-indigo-500"
              >
                ← Retour aux boutiques
              </button>

            </div>

          </AnimatedContainer>

        </div>

      </main>
    );
  }

  const productCount =
    shop.products?.length || 0;

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen overflow-hidden bg-[#050509] text-white">

      {/* ========================================================= */}
      {/* LUEURS DE FOND */}
      {/* ========================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-indigo-600/5 blur-3xl" />

      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

        {/* ========================================================= */}
        {/* RETOUR */}
        {/* ========================================================= */}

        <AnimatedContainer>

          <button
            onClick={() =>
              router.push("/Boutique")
            }
            className="group mb-8 inline-flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-gray-400 backdrop-blur transition hover:border-blue-500/30 hover:bg-blue-500/[0.06] hover:text-blue-300"
          >

            <span className="transition-transform group-hover:-translate-x-1">
              ←
            </span>

            Retour aux boutiques

          </button>

        </AnimatedContainer>

        {/* ========================================================= */}
        {/* HERO BOUTIQUE */}
        {/* ========================================================= */}

        <AnimatedContainer delay={0.1}>

          <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[#0b0b12] shadow-2xl shadow-black/30">

            {/* Glow */}

            <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

            <div className="relative p-7 sm:p-10 lg:p-12">

              <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

                {/* IDENTITÉ */}

                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/15 to-violet-500/10 text-5xl shadow-lg shadow-blue-950/20">

                    🏪

                    <div className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full border-4 border-[#0b0b12] bg-emerald-500">

                      <span className="h-2 w-2 rounded-full bg-white" />

                    </div>

                  </div>

                  <div>

                    <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">

                      <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.9)]" />

                      Boutique ShopX

                    </div>

                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">

                      <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                        {shop.name}
                      </span>

                    </h1>

                    <p className="mt-3 max-w-2xl leading-7 text-gray-500">

                      {shop.description ||
                        "Découvrez les produits proposés par cette boutique ShopX."}

                    </p>

                  </div>

                </div>

                {/* STATISTIQUE */}

                <div className="flex shrink-0 gap-3">

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 backdrop-blur">

                    <p className="text-xs uppercase tracking-wider text-gray-600">
                      Produits
                    </p>

                    <p className="mt-1 text-2xl font-black text-white">
                      {productCount}
                    </p>

                  </div>

                  <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 backdrop-blur">

                    <p className="text-xs uppercase tracking-wider text-gray-600">
                      Statut
                    </p>

                    <div className="mt-2 flex items-center gap-2">

                      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />

                      <span className="text-sm font-semibold text-emerald-300">
                        Active
                      </span>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </section>

        </AnimatedContainer>

        {/* ========================================================= */}
        {/* PRODUITS */}
        {/* ========================================================= */}

        <AnimatedContainer delay={0.2}>

          <section className="mt-12">

            <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                  Catalogue
                </p>

                <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                  Produits de la boutique
                </h2>

              </div>

              <div className="text-sm text-gray-600">

                {productCount}{" "}
                {productCount > 1
                  ? "produits"
                  : "produit"}

              </div>

            </div>

            {/* AUCUN PRODUIT */}

            {!shop.products ||
            shop.products.length === 0 ? (

              <AnimatedContainer delay={0.3}>

                <div className="rounded-3xl border border-white/[0.07] bg-white/[0.025] p-12 text-center backdrop-blur">

                  <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/10 bg-blue-500/10 text-4xl">
                    📦
                  </div>

                  <h3 className="text-xl font-bold">
                    Aucun produit
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-gray-500">
                    Cette boutique ne contient
                    actuellement aucun produit.
                  </p>

                </div>

              </AnimatedContainer>

            ) : (

              /* PRODUITS */

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">

                {shop.products.map(
                  (product, index) => (

                    <AnimatedContainer
                      key={product.id}
                      delay={
                        0.3 + index * 0.08
                      }
                    >

                      <article className="group relative h-full overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d0d14] p-5 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-blue-950/20">

                        {/* Glow */}

                        <div className="pointer-events-none absolute -right-16 -top-16 h-36 w-36 rounded-full bg-blue-500/10 blur-3xl transition group-hover:bg-blue-500/20" />

                        {/* TOP */}

                        <div className="relative mb-6 flex items-start justify-between">

                          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/15 to-violet-500/10 text-2xl">
                            📦
                          </div>

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${
                              product.stock > 0
                                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                                : "border-red-400/20 bg-red-400/10 text-red-300"
                            }`}
                          >
                            {product.stock > 0
                              ? "Disponible"
                              : "Rupture"}
                          </span>

                        </div>

                        {/* NOM */}

                        <h3 className="relative text-xl font-bold transition group-hover:text-blue-300">
                          {product.name}
                        </h3>

                        {/* PRIX */}

                        <div className="mt-5">

                          <p className="text-xs uppercase tracking-wider text-gray-600">
                            Prix
                          </p>

                          <p className="mt-1 text-2xl font-black text-blue-400">

                            {Number(
                              product.price
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}

                            <span className="text-sm font-semibold text-blue-400/70">
                              FCFA
                            </span>

                          </p>

                        </div>

                        {/* STOCK */}

                        <div className="mt-5 border-t border-white/[0.06] pt-4">

                          <div className="flex items-center justify-between">

                            <span className="text-sm text-gray-500">
                              Stock disponible
                            </span>

                            <span
                              className={`text-sm font-bold ${
                                product.stock >
                                0
                                  ? "text-emerald-400"
                                  : "text-red-400"
                              }`}
                            >
                              {product.stock}
                            </span>

                          </div>

                          {/* BARRE STOCK */}

                          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">

                            <div
                              className={`h-full rounded-full transition-all ${
                                product.stock > 0
                                  ? "bg-gradient-to-r from-blue-500 to-indigo-500"
                                  : "bg-red-500"
                              }`}
                              style={{
                                width:
                                  product.stock >
                                  0
                                    ? `${Math.min(
                                        product.stock *
                                          10,
                                        100
                                      )}%`
                                    : "0%",
                              }}
                            />

                          </div>

                        </div>

                        {/* BOUTON */}

                        <button
                          type="button"
                          disabled={
                            product.stock <= 0
                          }
                          onClick={() =>
                            router.push(
                              "/Commandes"
                            )
                          }
                          className="mt-6 w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold shadow-lg shadow-blue-950/20 transition hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-900/30 disabled:cursor-not-allowed disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:shadow-none"
                        >
                          {product.stock > 0
                            ? "Commander →"
                            : "Rupture de stock"}
                        </button>

                      </article>

                    </AnimatedContainer>

                  )
                )}

              </div>

            )}

          </section>

        </AnimatedContainer>

        {/* ========================================================= */}
        {/* BAS DE PAGE */}
        {/* ========================================================= */}

        <AnimatedContainer delay={0.4}>

          <div className="mt-14 rounded-3xl border border-blue-500/10 bg-gradient-to-r from-blue-500/[0.06] via-indigo-500/[0.04] to-violet-500/[0.06] p-6 sm:p-8">

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div>

                <p className="text-sm font-semibold text-blue-300">
                  SHOPX
                </p>

                <h3 className="mt-1 text-lg font-bold">
                  Trouvez ce qu'il vous faut.
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Découvrez toutes les boutiques
                  disponibles sur ShopX.
                </p>

              </div>

              <button
                onClick={() =>
                  router.push("/Boutique")
                }
                className="shrink-0 rounded-xl border border-blue-500/20 bg-blue-500/10 px-5 py-3 font-semibold text-blue-300 transition hover:bg-blue-500/20 hover:text-blue-200"
              >
                Voir toutes les boutiques →
              </button>

            </div>

          </div>

        </AnimatedContainer>

      </div>

    </main>
  );
}