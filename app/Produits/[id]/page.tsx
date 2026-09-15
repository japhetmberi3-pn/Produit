"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface Shop {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  email?: string;
}

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  shop?: Shop | null;
  user?: User | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function ProduitDetailPage() {
  const params = useParams();
  const router = useRouter();

  const productId = params.id;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Récupération du produit
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/products/${productId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || "Impossible de récupérer le produit."
          );
        }

        setProduct(data);
      } catch (err) {
        console.error("Erreur produit :", err);

        setError(
          err instanceof Error
            ? err.message
            : "Impossible de récupérer le produit."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  /*
  |--------------------------------------------------------------------------
  | Ajouter au panier
  |--------------------------------------------------------------------------
  */

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/Compte");
      return;
    }

    if (!product) {
      return;
    }

    setAddingToCart(true);
    setCartMessage("");

    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Impossible d'ajouter le produit au panier."
        );
      }

      setCartMessage("Produit ajouté au panier !");

      setTimeout(() => {
        setCartMessage("");
      }, 3000);
    } catch (err) {
      console.error("Erreur panier :", err);

      setCartMessage(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setAddingToCart(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Chargement
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <AnimatedContainer>
            <div className="text-center">
              <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-zinc-700 border-t-blue-500" />

              <p className="text-sm text-gray-400">
                Chargement du produit...
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Erreur
  |--------------------------------------------------------------------------
  */

  if (error || !product) {
    return (
      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <AnimatedContainer>
          <div className="mx-auto max-w-2xl rounded-3xl border border-red-500/20 bg-zinc-900/70 p-10 text-center shadow-2xl">
            <div className="mb-5 text-5xl">
              ⚠️
            </div>

            <h1 className="text-2xl font-bold">
              Produit introuvable
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-400">
              {error ||
                "Ce produit n'existe pas ou n'est plus disponible."}
            </p>

            <Link
              href="/Produits"
              className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:scale-[1.02]"
            >
              Retour aux produits
            </Link>
          </div>
        </AnimatedContainer>
      </main>
    );
  }

  const price = Number(product.price);
  const isAvailable = product.stock > 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">

      {/* ========================================================= */}
      {/* DÉCORATIONS                                               */}
      {/* ========================================================= */}

      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-[5%] top-[15%] h-28 w-28 rounded-full border border-blue-500/15 bg-blue-500/5 blur-[1px]" />

        <div className="absolute right-[8%] top-[20%] h-24 w-24 rotate-12 rounded-2xl border border-purple-500/15 bg-purple-500/5" />

        <div className="absolute left-[15%] top-[65%] h-20 w-20 rotate-45 border border-cyan-400/15 bg-cyan-400/5" />

        <div className="absolute right-[12%] top-[70%] h-32 w-32 rounded-full border border-indigo-500/15 bg-indigo-500/5" />
      </div>

      {/* ========================================================= */}
      {/* HEADER                                                     */}
      {/* ========================================================= */}

      <header className="relative z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <Link
            href="/"
            className="text-xl font-black tracking-tight"
          >
            <span className="text-white">SHOP</span>
            <span className="text-blue-500">X</span>
          </Link>

          <div className="flex items-center gap-3">

            <Link
              href="/Produits"
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/40 hover:bg-blue-500/10 hover:text-white"
            >
              Produits
            </Link>

            <Link
              href="/Panier"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition hover:from-blue-500 hover:to-indigo-500"
            >
              🛒 Panier
            </Link>

          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* CONTENU                                                    */}
      {/* ========================================================= */}

      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12 lg:py-20">

        {/* Fil d'Ariane */}
        <AnimatedContainer delay={0}>
          <div className="mb-8">
            <Link
              href="/Produits"
              className="text-sm text-gray-500 transition hover:text-blue-400"
            >
              ← Retour aux produits
            </Link>
          </div>
        </AnimatedContainer>

        {/* ======================================================= */}
        {/* FICHE                                                    */}
        {/* ======================================================= */}

        <div className="grid gap-8 lg:grid-cols-2">

          {/* ===================================================== */}
          {/* VISUEL PRODUIT                                        */}
          {/* ===================================================== */}

          <AnimatedContainer delay={0.1}>
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/70 shadow-2xl shadow-black/30 transition duration-500 hover:-translate-y-1 hover:border-blue-500/20">

              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-purple-500/10" />

              <div className="relative flex min-h-[450px] items-center justify-center">

                <div className="text-[120px] transition duration-700 hover:scale-110 hover:rotate-3">
                  🛍️
                </div>

                {/* Badge stock */}
                <AnimatedContainer delay={0.35}>
                  <div className="absolute right-5 top-5">

                    {isAvailable ? (
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 backdrop-blur-md">
                        ✓ En stock
                      </span>
                    ) : (
                      <span className="rounded-full border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 backdrop-blur-md">
                        Rupture de stock
                      </span>
                    )}

                  </div>
                </AnimatedContainer>

              </div>
            </div>
          </AnimatedContainer>

          {/* ===================================================== */}
          {/* INFORMATIONS                                          */}
          {/* ===================================================== */}

          <AnimatedContainer delay={0.2}>
            <div className="flex flex-col justify-center">

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Produit ShopX
              </p>

              <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                {product.name}
              </h1>

              {/* Prix */}
              <AnimatedContainer delay={0.3}>
                <div className="mt-6">

                  <p className="text-sm text-gray-500">
                    Prix
                  </p>

                  <p className="mt-1 text-3xl font-black text-blue-400">
                    {price.toLocaleString("fr-FR")}{" "}
                    <span className="text-lg">
                      FCFA
                    </span>
                  </p>

                </div>
              </AnimatedContainer>

              {/* Description */}
              <AnimatedContainer delay={0.4}>
                <div className="mt-8 border-t border-white/10 pt-7">

                  <h2 className="text-sm font-bold uppercase tracking-wider text-gray-300">
                    Description
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-gray-400">
                    {product.description ||
                      "Aucune description disponible pour ce produit."}
                  </p>

                </div>
              </AnimatedContainer>

              {/* Boutique */}
              {product.shop && (
                <AnimatedContainer delay={0.5}>
                  <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:border-blue-500/20 hover:bg-white/[0.05]">

                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Boutique
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {product.shop.name}
                    </p>

                  </div>
                </AnimatedContainer>
              )}

              {/* Vendeur */}
              {product.user && (
                <AnimatedContainer delay={0.6}>
                  <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition duration-300 hover:border-purple-500/20 hover:bg-white/[0.05]">

                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      Vendeur
                    </p>

                    <p className="mt-1 font-semibold text-white">
                      {product.user.name}
                    </p>

                  </div>
                </AnimatedContainer>
              )}

              {/* Stock */}
              <AnimatedContainer delay={0.7}>
                <div className="mt-5 flex items-center gap-2 text-sm">

                  <span className="text-gray-500">
                    Disponibilité :
                  </span>

                  <span
                    className={
                      isAvailable
                        ? "font-semibold text-emerald-400"
                        : "font-semibold text-red-400"
                    }
                  >
                    {isAvailable
                      ? `${product.stock} disponible${
                          product.stock > 1 ? "s" : ""
                        }`
                      : "Indisponible"}
                  </span>

                </div>
              </AnimatedContainer>

              {/* ================================================= */}
              {/* ACTIONS                                           */}
              {/* ================================================= */}

              {isAvailable && (
                <AnimatedContainer delay={0.8}>
                  <div className="mt-8">

                    <div className="flex items-center gap-4">

                      {/* Quantité */}
                      <div className="flex items-center overflow-hidden rounded-xl border border-white/10 bg-zinc-900">

                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((current) =>
                              Math.max(1, current - 1)
                            )
                          }
                          className="px-4 py-3 text-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                          −
                        </button>

                        <span className="min-w-[45px] text-center text-sm font-bold">
                          {quantity}
                        </span>

                        <button
                          type="button"
                          onClick={() =>
                            setQuantity((current) =>
                              Math.min(
                                product.stock,
                                current + 1
                              )
                            )
                          }
                          className="px-4 py-3 text-lg text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                          +
                        </button>

                      </div>

                      {/* Ajouter */}
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        disabled={addingToCart}
                        className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition duration-300 hover:-translate-y-1 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {addingToCart
                          ? "Ajout..."
                          : "🛒 Ajouter au panier"}
                      </button>

                    </div>

                    {/* Message panier */}
                    {cartMessage && (
                      <AnimatedContainer delay={0}>
                        <div
                          className={`mt-4 rounded-xl border p-3 text-center text-sm ${
                            cartMessage.includes("ajouté")
                              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                              : "border-red-500/20 bg-red-500/10 text-red-400"
                          }`}
                        >
                          {cartMessage}
                        </div>
                      </AnimatedContainer>
                    )}

                  </div>
                </AnimatedContainer>
              )}

              {!isAvailable && (
                <AnimatedContainer delay={0.8}>
                  <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center text-sm font-semibold text-red-400">
                    Ce produit est actuellement indisponible.
                  </div>
                </AnimatedContainer>
              )}

            </div>
          </AnimatedContainer>

        </div>
      </section>
    </main>
  );
}
