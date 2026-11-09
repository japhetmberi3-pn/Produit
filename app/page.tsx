"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { openAuthModal } from "@/app/components/auth/AuthModal";
import Footer from "@/app/components/Footer";
import {
  ArrowRightIcon,
  CartIcon,
  HeartIcon,
  MessageIcon,
  PackageIcon,
  SearchIcon,
  ShieldIcon,
  StarIcon,
  StoreIcon,
} from "@/app/components/icons";
import Navbar from "@/app/components/Navbar";
import ProductCard, {
  type AddToCartState,
  ProductCardSkeleton,
  ProductVisual,
} from "@/app/components/shop/ProductCard";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch, errorMessage, UnauthorizedError } from "@/lib/api";
import { addToCart, type Product, useFavorites } from "@/lib/shop";

const FEATURES = [
  {
    icon: StoreIcon,
    title: "Boutiques indépendantes",
    text: "Des vendeurs locaux réunis sur une seule plateforme.",
  },
  {
    icon: StarIcon,
    title: "Avis clients",
    text: "Notes et commentaires laissés par les acheteurs.",
  },
  {
    icon: MessageIcon,
    title: "Contact direct",
    text: "Échangez avec le vendeur avant d'acheter.",
  },
  {
    icon: PackageIcon,
    title: "Suivi des commandes",
    text: "Retrouvez toutes vos commandes dans votre espace.",
  },
];

const STEPS = [
  { icon: SearchIcon, title: "Trouvez", text: "Parcourez le catalogue ou recherchez un article précis." },
  { icon: HeartIcon, title: "Comparez", text: "Ajoutez vos coups de cœur en favoris et lisez les avis." },
  { icon: CartIcon, title: "Commandez", text: "Validez votre panier et suivez votre commande." },
];

export default function HomePage() {
  const { user, token, logout } = useAuth();
  const favorites = useFavorites();

  const [products, setProducts] = useState<Product[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [addStates, setAddStates] = useState<Record<number, AddToCartState>>({});
  const [cartError, setCartError] = useState("");

  const isSeller = user?.role === "vendeur" || user?.role === "seller";

  /* ===================== NOUVEAUTÉS (utilisateur connecté) ===================== */

  useEffect(() => {
    if (!token) return;

    const controller = new AbortController();

    apiFetch<Product[] | { products?: Product[] }>("/products", { signal: controller.signal })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.products || [];
        setProducts(list);
        setLoadedFor(token);
      })
      .catch((error) => {
        if (controller.signal.aborted) return;
        if (error instanceof UnauthorizedError) logout();
        console.error("Erreur chargement nouveautés :", error);
        setLoadedFor(token);
      });

    return () => controller.abort();
  }, [token, logout]);

  const loading = Boolean(token) && loadedFor !== token;

  const latestProducts = useMemo(
    () =>
      [...products]
        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
        .slice(0, 8),
    [products]
  );

  const showcase = latestProducts.slice(0, 3);

  const handleAddToCart = useCallback(
    async (productId: number) => {
      setCartError("");
      setAddStates((s) => ({ ...s, [productId]: "adding" }));

      try {
        await addToCart(productId);
        setAddStates((s) => ({ ...s, [productId]: "added" }));
        setTimeout(() => setAddStates((s) => ({ ...s, [productId]: "idle" })), 2000);
      } catch (error) {
        setAddStates((s) => ({ ...s, [productId]: "idle" }));
        if (error instanceof UnauthorizedError) {
          logout();
          openAuthModal("login");
          return;
        }
        setCartError(errorMessage(error, "Impossible d'ajouter le produit au panier."));
      }
    },
    [logout]
  );

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <main>
        {/* ===================== HERO ===================== */}
        <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6 md:pt-10">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand to-indigo-600 px-6 py-10 text-white sm:px-10 md:py-14 lg:px-14">
            <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
            <div className="pointer-events-none absolute -bottom-32 right-40 h-72 w-72 rounded-full bg-white/5" />

            <div className="relative grid items-center gap-10 lg:grid-cols-[1.2fr_1fr]">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <ShieldIcon size={14} /> Marketplace de boutiques indépendantes
                </span>

                <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
                  Tout ce qu&apos;il vous faut,
                  <br />
                  <span className="text-amber-300">au même endroit.</span>
                </h1>

                <p className="mt-5 max-w-xl text-base text-blue-100 sm:text-lg">
                  Découvrez les produits de nos vendeurs, comparez les avis et commandez en
                  quelques clics. Vous vendez ? Ouvrez votre boutique gratuitement.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/Produits"
                    className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 font-semibold text-white shadow-lg shadow-orange-900/20 transition hover:bg-accent-hover"
                  >
                    Découvrir le catalogue <ArrowRightIcon size={18} />
                  </Link>

                  {!user ? (
                    <button
                      type="button"
                      onClick={() => openAuthModal("register")}
                      className="rounded-xl bg-white/15 px-6 py-3.5 font-semibold backdrop-blur transition hover:bg-white/25"
                    >
                      Créer un compte
                    </button>
                  ) : (
                    <Link
                      href="/Boutique"
                      className="rounded-xl bg-white/15 px-6 py-3.5 font-semibold backdrop-blur transition hover:bg-white/25"
                    >
                      Voir les boutiques
                    </Link>
                  )}
                </div>
              </div>

              {/* Vitrine : vrais produits si connecté, sinon cartes d'illustration */}
              <div className="relative hidden h-[22rem] lg:block" aria-hidden="true">
                {(showcase.length > 0
                  ? showcase
                  : [
                      { id: 11, name: "Mode" },
                      { id: 23, name: "High Tech" },
                      { id: 47, name: "Maison" },
                    ]
                ).map((item, index) => (
                  <div
                    key={item.id}
                    className={`absolute w-44 overflow-hidden rounded-2xl bg-surface text-ink shadow-2xl ${
                      ["left-0 top-8 -rotate-6", "right-0 top-0 rotate-3", "right-14 top-44 -rotate-2"][index]
                    }`}
                  >
                    <ProductVisual product={item} className="h-24" />
                    <div className="p-3">
                      <p className="truncate text-sm font-semibold">{item.name}</p>
                      {"price" in item ? (
                        <p className="text-sm font-bold text-brand">
                          {Number(item.price).toLocaleString("fr-FR")} FCFA
                        </p>
                      ) : (
                        <div className="mt-1.5 h-2 w-16 rounded bg-surface-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ===================== ATOUTS ===================== */}
        <section className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
            {FEATURES.map(({ icon: FeatureIcon, title, text }) => (
              <div key={title} className="flex items-start gap-3 bg-surface p-4 sm:p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <FeatureIcon size={19} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{title}</p>
                  <p className="mt-0.5 hidden text-xs text-muted sm:block">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== NOUVEAUTÉS ===================== */}
        <section className="mx-auto max-w-7xl px-4 pt-14 md:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Nouveautés</h2>
              <p className="mt-1 text-sm text-muted">Les derniers articles ajoutés par nos vendeurs.</p>
            </div>
            {user && (
              <Link
                href="/Produits"
                className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-brand hover:underline sm:flex"
              >
                Tout voir <ArrowRightIcon size={16} />
              </Link>
            )}
          </div>

          {cartError && (
            <p role="alert" className="mb-4 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
              {cartError}
            </p>
          )}

          {!user ? (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-line bg-surface px-6 py-14 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft text-brand">
                <CartIcon size={26} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-ink">Connectez-vous pour voir le catalogue</h3>
              <p className="mt-1 max-w-md text-sm text-muted">
                Créez un compte gratuit pour parcourir les produits, enregistrer vos favoris et
                passer commande.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openAuthModal("login")}
                  className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
                >
                  Se connecter
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal("register")}
                  className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-surface-2"
                >
                  Créer un compte
                </button>
              </div>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : latestProducts.length === 0 ? (
            <p className="rounded-3xl border border-line bg-surface px-6 py-12 text-center text-sm text-muted">
              Aucun produit pour le moment. Revenez bientôt !
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
              {latestProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  average={Number(product.average_rating ?? product.rating ?? 0)}
                  reviewCount={product.reviews_count ?? 0}
                  isFavorite={favorites.isFavorite(product.id)}
                  onToggleFavorite={() => favorites.toggle(product.id)}
                  onAddToCart={() => handleAddToCart(product.id)}
                  addState={addStates[product.id]}
                />
              ))}
            </div>
          )}
        </section>

        {/* ===================== COMMENT ÇA MARCHE ===================== */}
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Acheter en 3 étapes
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STEPS.map(({ icon: StepIcon, title, text }, index) => (
              <div key={title} className="rounded-2xl border border-line bg-surface p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <StepIcon size={20} />
                  </span>
                  <span className="text-sm font-semibold text-muted">Étape {index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ===================== VENDEURS ===================== */}
        <section className="mx-auto max-w-7xl px-4 pt-16 md:px-6">
          <div className="flex flex-col items-start gap-6 rounded-3xl border border-line bg-surface p-8 md:flex-row md:items-center md:justify-between md:p-10">
            <div className="flex items-start gap-4">
              <span className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-soft text-brand sm:flex">
                <StoreIcon size={26} />
              </span>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-ink">
                  {isSeller ? "Gérez votre boutique" : "Vous avez des produits à vendre ?"}
                </h2>
                <p className="mt-1 max-w-xl text-sm text-muted">
                  {isSeller
                    ? "Ajoutez des articles, suivez vos commandes et répondez à vos clients."
                    : "Ouvrez votre boutique ShopX, publiez vos articles et touchez de nouveaux clients."}
                </p>
              </div>
            </div>

            {isSeller ? (
              <Link
                href="/Vendeur"
                className="shrink-0 rounded-xl bg-brand px-6 py-3 font-semibold text-on-brand transition hover:bg-brand-hover"
              >
                Mon espace vendeur
              </Link>
            ) : !user ? (
              <button
                type="button"
                onClick={() => openAuthModal("register")}
                className="shrink-0 rounded-xl bg-brand px-6 py-3 font-semibold text-on-brand transition hover:bg-brand-hover"
              >
                Devenir vendeur
              </button>
            ) : null}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
