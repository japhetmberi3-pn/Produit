"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Footer from "@/app/components/Footer";
import {
  ChevronRightIcon,
  CloseIcon,
  FilterIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  StarIcon,
  TrashIcon,
} from "@/app/components/icons";
import Navbar from "@/app/components/Navbar";
import ProductCard, {
  type AddToCartState,
  ProductCardSkeleton,
} from "@/app/components/shop/ProductCard";
import { useAuth } from "@/app/context/AuthContext";
import { apiFetch, errorMessage, UnauthorizedError } from "@/lib/api";
import {
  addToCart,
  normalizeText,
  type Product,
  type Shop,
  useFavorites,
} from "@/lib/shop";

/* =====================================================
 * TYPES
 * ===================================================== */

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
}

interface ProductReviews {
  average: number;
  count: number;
}

type SortKey = "recent" | "price-asc" | "price-desc" | "rating" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Nouveautés" },
  { value: "price-asc", label: "Prix croissant" },
  { value: "price-desc", label: "Prix décroissant" },
  { value: "rating", label: "Mieux notés" },
  { value: "name", label: "Nom (A → Z)" },
];

const EMPTY_FORM: ProductForm = { name: "", description: "", price: "", stock: "" };

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15";

/* =====================================================
 * FORMULAIRE D'AVIS (dans la carte produit)
 * ===================================================== */

function ReviewBox({
  productId,
  open,
  rating,
  comment,
  sending,
  message,
  onOpen,
  onRatingChange,
  onCommentChange,
  onSubmit,
  onCancel,
}: {
  productId: number;
  open: boolean;
  rating: number;
  comment: string;
  sending: boolean;
  message: string;
  onOpen: () => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex w-fit items-center gap-1 text-xs font-medium text-muted transition hover:text-brand"
      >
        <StarIcon size={13} filled={false} /> Donner une note
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-line bg-surface-2 p-3">
      <p className="text-xs font-semibold text-ink-soft">Votre note</p>

      <div className="mt-1.5 flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onRatingChange(star)}
            disabled={sending}
            aria-label={`Donner ${star} étoile${star > 1 ? "s" : ""}`}
            className={`transition hover:scale-110 ${star <= rating ? "text-star" : "text-line"}`}
          >
            <StarIcon size={22} />
          </button>
        ))}
        <span className="ml-2 text-xs font-semibold text-ink-soft">{rating}/5</span>
      </div>

      <label
        htmlFor={`review-comment-${productId}`}
        className="mt-3 block text-xs font-semibold text-ink-soft"
      >
        Commentaire
      </label>
      <textarea
        id={`review-comment-${productId}`}
        value={comment}
        onChange={(event) => onCommentChange(event.target.value)}
        maxLength={1000}
        rows={3}
        disabled={sending}
        placeholder="Qu'avez-vous pensé de ce produit ?"
        className={`${inputClass} mt-1 resize-none`}
      />
      <p className="mt-0.5 text-right text-[10px] text-muted">{comment.length}/1000</p>

      {message && <p className="mt-1 text-xs text-ink-soft">{message}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={sending}
          className="flex-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60"
        >
          {sending ? "Publication..." : "Publier mon avis"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          className="rounded-lg border border-line px-3 py-2 text-xs font-semibold text-ink-soft transition hover:bg-surface"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

/* =====================================================
 * PAGE PRODUITS
 * ===================================================== */

// useSearchParams doit être sous une frontière <Suspense> (doc Next : use-search-params.md).
export default function ProduitsPage() {
  return (
    <Suspense fallback={null}>
      <ProduitsContent />
    </Suspense>
  );
}

function ProduitsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout } = useAuth();
  const favorites = useFavorites();

  /* ===================== DONNÉES ===================== */

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [productReviews, setProductReviews] = useState<Record<number, ProductReviews>>({});
  const [addStates, setAddStates] = useState<Record<number, AddToCartState>>({});

  /* ===================== FILTRES ===================== */

  const urlSearch = searchParams.get("search") ?? "";
  const [query, setQuery] = useState(urlSearch);
  const [lastUrlSearch, setLastUrlSearch] = useState(urlSearch);

  // Nouvelle recherche depuis la Navbar : on met à jour le champ pendant le rendu
  // (pattern React recommandé, sans useEffect).
  if (urlSearch !== lastUrlSearch) {
    setLastUrlSearch(urlSearch);
    setQuery(urlSearch);
  }

  const [sort, setSort] = useState<SortKey>("recent");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedShops, setSelectedShops] = useState<number[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* ===================== GESTION (vendeur / admin) ===================== */

  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [managerOpen, setManagerOpen] = useState(true);

  /* ===================== AVIS ===================== */

  const [reviewProductId, setReviewProductId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSending, setReviewSending] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  /* ===================== RÔLES ===================== */

  const isAdmin = user?.role === "admin";
  const isSeller = user?.role === "vendeur" || user?.role === "seller";
  const canManageProducts = isAdmin || isSeller;

  /* =====================================================
   * CHARGEMENT
   * ===================================================== */

  const forceLogout = useCallback(() => {
    logout();
    router.push("/Connexion");
  }, [logout, router]);

  const fetchProductReviews = useCallback(
    async (productId: number) => {
      try {
        const data = await apiFetch<ProductReviews>(`/products/${productId}/reviews`);
        setProductReviews((previous) => ({ ...previous, [productId]: data }));
      } catch (err) {
        if (err instanceof UnauthorizedError) {
          forceLogout();
          return;
        }
        console.error(`Erreur récupération avis produit ${productId} :`, err);
      }
    },
    [forceLogout]
  );

  type CatalogResponse = Product[] | { products?: Product[] };

  const applyCatalog = useCallback(
    async (data: CatalogResponse) => {
      const list = Array.isArray(data) ? data : data.products || [];

      setProducts(list);
      setError("");
      setLoading(false);
      await Promise.all(list.map((product) => fetchProductReviews(product.id)));
    },
    [fetchProductReviews]
  );

  const handleCatalogError = useCallback(
    (err: unknown) => {
      setLoading(false);
      if (err instanceof UnauthorizedError) {
        forceLogout();
        return;
      }
      console.error("Erreur récupération produits :", err);
      setError("Impossible de récupérer les produits.");
    },
    [forceLogout]
  );

  // Rechargement après création / modification.
  const fetchProducts = useCallback(
    () => apiFetch<CatalogResponse>("/products").then(applyCatalog, handleCatalogError),
    [applyCatalog, handleCatalogError]
  );

  // Chargement initial : les setState se font dans les callbacks de la promesse.
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      forceLogout();
      return;
    }

    apiFetch<CatalogResponse>("/products").then(applyCatalog, handleCatalogError);
  }, [forceLogout, applyCatalog, handleCatalogError]);

  /* =====================================================
   * LISTE FILTRÉE
   * ===================================================== */

  const ratingOf = useCallback(
    (product: Product) =>
      Number(
        productReviews[product.id]?.average ?? product.average_rating ?? product.rating ?? 0
      ),
    [productReviews]
  );

  const shops = useMemo(() => {
    const byId = new Map<number, Shop & { total: number }>();

    products.forEach((product) => {
      if (!product.shop) return;
      const existing = byId.get(product.shop.id);
      byId.set(product.shop.id, { ...product.shop, total: (existing?.total ?? 0) + 1 });
    });

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, "fr"));
  }, [products]);

  const visibleProducts = useMemo(() => {
    const q = normalizeText(query);
    const min = minPrice === "" ? null : Number(minPrice);
    const max = maxPrice === "" ? null : Number(maxPrice);

    const list = products.filter((product) => {
      if (q) {
        const haystack = normalizeText(
          `${product.name} ${product.description ?? ""} ${product.shop?.name ?? ""}`
        );
        if (!haystack.includes(q)) return false;
      }
      if (inStockOnly && product.stock <= 0) return false;
      if (selectedShops.length > 0 && (!product.shop || !selectedShops.includes(product.shop.id))) {
        return false;
      }
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      return true;
    });

    const sorters: Record<SortKey, (a: Product, b: Product) => number> = {
      recent: (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at),
      "price-asc": (a, b) => a.price - b.price,
      "price-desc": (a, b) => b.price - a.price,
      rating: (a, b) => ratingOf(b) - ratingOf(a),
      name: (a, b) => a.name.localeCompare(b.name, "fr"),
    };

    return list.sort(sorters[sort]);
  }, [products, query, inStockOnly, selectedShops, minPrice, maxPrice, sort, ratingOf]);

  const activeFilterCount =
    (query ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    selectedShops.length +
    (minPrice ? 1 : 0) +
    (maxPrice ? 1 : 0);

  const resetFilters = () => {
    setQuery("");
    setInStockOnly(false);
    setSelectedShops([]);
    setMinPrice("");
    setMaxPrice("");
  };

  const toggleShop = (shopId: number) =>
    setSelectedShops((previous) =>
      previous.includes(shopId) ? previous.filter((id) => id !== shopId) : [...previous, shopId]
    );

  /* =====================================================
   * CRÉER / MODIFIER / SUPPRIMER
   * ===================================================== */

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await apiFetch(editingProduct ? `/products/${editingProduct.id}` : "/products", {
        method: editingProduct ? "PUT" : "POST",
        body: {
          name: form.name,
          description: form.description,
          price: Number(form.price),
          stock: Number(form.stock),
        },
      });

      setForm(EMPTY_FORM);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        forceLogout();
        return;
      }
      console.error("Erreur création/modification produit :", err);
      setError(errorMessage(err, "Une erreur est survenue."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setManagerOpen(true);
    setForm({
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      stock: String(product.stock),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
  };

  const handleDelete = async (productId: number) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce produit ?")) return;

    try {
      await apiFetch(`/products/${productId}`, { method: "DELETE" });

      setProducts((previous) => previous.filter((product) => product.id !== productId));
      setProductReviews((previous) => {
        const updated = { ...previous };
        delete updated[productId];
        return updated;
      });
      favorites.remove(productId);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        forceLogout();
        return;
      }
      console.error("Erreur suppression produit :", err);
      setError(errorMessage(err, "Impossible de supprimer le produit."));
    }
  };

  /* =====================================================
   * PANIER
   * ===================================================== */

  const handleAddToCart = async (productId: number) => {
    setError("");
    setAddStates((s) => ({ ...s, [productId]: "adding" }));

    try {
      await addToCart(productId);
      setAddStates((s) => ({ ...s, [productId]: "added" }));
      setTimeout(() => setAddStates((s) => ({ ...s, [productId]: "idle" })), 2000);
    } catch (err) {
      setAddStates((s) => ({ ...s, [productId]: "idle" }));
      if (err instanceof UnauthorizedError) {
        forceLogout();
        return;
      }
      console.error("Erreur ajout panier :", err);
      setError(errorMessage(err, "Impossible d'ajouter le produit au panier."));
    }
  };

  /* =====================================================
   * AVIS
   * ===================================================== */

  const openReview = (productId: number) => {
    setReviewProductId(productId);
    setReviewRating(5);
    setReviewComment("");
    setReviewMessage("");
  };

  const closeReview = () => {
    setReviewProductId(null);
    setReviewRating(5);
    setReviewComment("");
    setReviewMessage("");
  };

  const submitReview = async () => {
    if (!reviewProductId) return;
    const productId = reviewProductId;

    setReviewSending(true);
    setReviewMessage("");

    try {
      await apiFetch(`/products/${productId}/reviews`, {
        method: "POST",
        body: { rating: reviewRating, comment: reviewComment.trim() || null },
      });

      await fetchProductReviews(productId);
      setReviewMessage("✅ Votre avis a été ajouté avec succès.");
      setReviewComment("");
      setReviewRating(5);
      setTimeout(closeReview, 1200);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        forceLogout();
        return;
      }
      console.error("Erreur ajout avis :", err);
      setReviewMessage(errorMessage(err, "Impossible d'ajouter votre avis."));
    } finally {
      setReviewSending(false);
    }
  };

  /* =====================================================
   * AFFICHAGE
   * ===================================================== */

  const filtersPanel = (
    <div className="space-y-6">
      <div>
        <label htmlFor="catalog-search" className="text-sm font-semibold text-ink">
          Rechercher
        </label>
        <div className="relative mt-2">
          <SearchIcon size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nom, description, boutique..."
            className={`${inputClass} pl-9`}
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Disponibilité</p>
        <label className="mt-2 flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(event) => setInStockOnly(event.target.checked)}
            className="h-4 w-4 rounded accent-[var(--brand)]"
          />
          En stock uniquement
        </label>
      </div>

      <div>
        <p className="text-sm font-semibold text-ink">Prix (FCFA)</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={minPrice}
            onChange={(event) => setMinPrice(event.target.value)}
            placeholder="Min"
            aria-label="Prix minimum"
            className={inputClass}
          />
          <span className="text-muted">–</span>
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={maxPrice}
            onChange={(event) => setMaxPrice(event.target.value)}
            placeholder="Max"
            aria-label="Prix maximum"
            className={inputClass}
          />
        </div>
      </div>

      {shops.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-ink">Boutiques</p>
          <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto pr-1">
            {shops.map((shop) => (
              <li key={shop.id}>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    checked={selectedShops.includes(shop.id)}
                    onChange={() => toggleShop(shop.id)}
                    className="h-4 w-4 rounded accent-[var(--brand)]"
                  />
                  <span className="flex-1 truncate">{shop.name}</span>
                  <span className="text-xs text-muted">{shop.total}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={resetFilters}
          className="w-full rounded-xl border border-line py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-2"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:py-8">
        {/* FIL D'ARIANE */}
        <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-xs text-muted">
          <Link href="/" className="hover:text-brand">
            Accueil
          </Link>
          <ChevronRightIcon size={14} />
          <span className="text-ink-soft">Produits</span>
        </nav>

        {/* EN-TÊTE */}
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              {query ? <>Résultats pour « {query} »</> : "Tous les produits"}
            </h1>
            {!loading && (
              <p className="mt-1 text-sm text-muted">
                {visibleProducts.length} article{visibleProducts.length > 1 ? "s" : ""}
                {visibleProducts.length !== products.length && ` sur ${products.length}`}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((open) => !open)}
              aria-expanded={showFilters}
              className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-2 lg:hidden"
            >
              <FilterIcon size={16} /> Filtres
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-brand px-1.5 text-[11px] font-bold text-on-brand">
                  {activeFilterCount}
                </span>
              )}
            </button>

            <label htmlFor="catalog-sort" className="sr-only">
              Trier par
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink-soft outline-none focus:border-brand"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  Trier : {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ERREUR */}
        {error && (
          <div role="alert" className="mt-5 flex items-start justify-between gap-3 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
            <span>{error}</span>
            <button type="button" onClick={() => setError("")} aria-label="Masquer l'erreur">
              <CloseIcon size={16} />
            </button>
          </div>
        )}

        {/* ESPACE VENDEUR / ADMIN */}
        {canManageProducts && (
          <section className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
            <button
              type="button"
              onClick={() => setManagerOpen((open) => !open)}
              aria-expanded={managerOpen}
              className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <span className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  {editingProduct ? <PencilIcon size={17} /> : <PlusIcon size={18} />}
                </span>
                <span>
                  <span className="block font-semibold text-ink">
                    {editingProduct ? "Modifier le produit" : "Ajouter un produit"}
                  </span>
                  <span className="block text-xs text-muted">
                    {isSeller
                      ? "Le produit sera associé à votre boutique."
                      : "Gestion des produits de la plateforme."}
                  </span>
                </span>
              </span>
              <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-semibold text-ink-soft">
                {isAdmin ? "Administrateur" : "Vendeur"}
              </span>
            </button>

            {managerOpen && (
              <form onSubmit={handleSubmit} className="grid gap-4 border-t border-line p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    Nom du produit
                  </label>
                  <input id="name" name="name" type="text" value={form.name} onChange={handleChange} required placeholder="Ex : Nike Air Max" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="price" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    Prix
                  </label>
                  <input id="price" name="price" type="number" min="0" step="0.01" value={form.price} onChange={handleChange} required placeholder="45000" className={inputClass} />
                </div>

                <div>
                  <label htmlFor="stock" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    Stock
                  </label>
                  <input id="stock" name="stock" type="number" min="0" value={form.stock} onChange={handleChange} required placeholder="25" className={inputClass} />
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label htmlFor="description" className="mb-1.5 block text-xs font-semibold text-ink-soft">
                    Description
                  </label>
                  <input id="description" name="description" type="text" value={form.description} onChange={handleChange} placeholder="Description courte" className={inputClass} />
                </div>

                <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-hover disabled:opacity-60"
                  >
                    {submitting ? "Enregistrement..." : editingProduct ? "Modifier le produit" : "Ajouter le produit"}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold text-ink-soft transition hover:bg-surface-2"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            )}
          </section>
        )}

        <div className="mt-6 lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
          {/* FILTRES */}
          <aside className={`${showFilters ? "mb-6 block" : "hidden"} rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-36 lg:mb-0 lg:block lg:self-start`}>
            {filtersPanel}
          </aside>

          {/* GRILLE */}
          <section aria-label="Liste des produits" aria-busy={loading}>
            {loading ? (
              <>
                <p className="sr-only">Chargement du catalogue...</p>
                <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                  {Array.from({ length: 6 }, (_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              </>
            ) : products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
                <h2 className="text-lg font-semibold text-ink">Aucun produit disponible</h2>
                <p className="mt-1 text-sm text-muted">
                  Les produits apparaîtront ici lorsqu&apos;ils seront disponibles.
                </p>
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
                <h2 className="text-lg font-semibold text-ink">Aucun produit ne correspond à vos critères</h2>
                <p className="mt-1 text-sm text-muted">Essayez d&apos;élargir votre recherche.</p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-5 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {visibleProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    average={ratingOf(product)}
                    reviewCount={productReviews[product.id]?.count ?? product.reviews_count ?? 0}
                    isFavorite={favorites.isFavorite(product.id)}
                    onToggleFavorite={() => favorites.toggle(product.id)}
                    onAddToCart={() => handleAddToCart(product.id)}
                    addState={addStates[product.id]}
                  >
                    <ReviewBox
                      productId={product.id}
                      open={reviewProductId === product.id}
                      rating={reviewRating}
                      comment={reviewComment}
                      sending={reviewSending}
                      message={reviewMessage}
                      onOpen={() => openReview(product.id)}
                      onRatingChange={setReviewRating}
                      onCommentChange={setReviewComment}
                      onSubmit={submitReview}
                      onCancel={closeReview}
                    />

                    {canManageProducts && (
                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                        <button
                          type="button"
                          onClick={() => handleEdit(product)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-semibold text-ink-soft transition hover:border-brand hover:text-brand"
                        >
                          <PencilIcon size={13} /> Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2 text-xs font-semibold text-ink-soft transition hover:border-danger hover:bg-danger-soft hover:text-danger"
                        >
                          <TrashIcon size={13} /> Supprimer
                        </button>
                      </div>
                    )}
                  </ProductCard>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
