"use client";
import { API_URL } from "@/lib/config";

import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import AnimatedContainer from "@/app/components/AnimatedContainer";
import Navbar from "@/app/components/Navbar";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";

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
  rating?: number;
  average_rating?: number;
  reviews_count?: number;
  shop?: Shop | null;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
}

interface Conversation {
  id: number;
  unread_count?: number;
}

interface CartItem {
  id: number;
  quantity: number;
}

interface ApiObjectResponse {
  message?: string;
  product?: Product;
}

interface ApiResponse {
  message?: string;
  products?: Product[];
}

/*
 * =====================================================
 * AVIS
 * =====================================================
 */

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

interface ProductReviews {
  reviews: Review[];
  average: number;
  count: number;
}

/*
 * =====================================================
 * API
 * =====================================================
 */


/*
 * =====================================================
 * NOTE + FORMULAIRE D'AVIS
 * =====================================================
 */

function ProductRating({
  product,
  average,
  reviewCount,
  reviewProductId,
  reviewRating,
  reviewComment,
  reviewSending,
  reviewMessage,
  onOpenReview,
  onRatingChange,
  onCommentChange,
  onSubmitReview,
  onCancelReview,
}: {
  product: Product;
  average: number;
  reviewCount: number;
  reviewProductId: number | null;
  reviewRating: number;
  reviewComment: string;
  reviewSending: boolean;
  reviewMessage: string;
  onOpenReview: () => void;
  onRatingChange: (rating: number) => void;
  onCommentChange: (comment: string) => void;
  onSubmitReview: () => void;
  onCancelReview: () => void;
}) {
  const isOpen = reviewProductId === product.id;

  return (
    <div className="mt-4">

      {/* =================================================
          NOTE ACTUELLE
      ================================================== */}

      <div className="flex items-center gap-2">

        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-lg leading-none ${
                star <= Math.round(average)
                  ? "text-yellow-400"
                  : "text-zinc-700"
              }`}
            >
              ★
            </span>
          ))}
        </div>

        <span className="text-xs font-semibold text-zinc-400">
          {average.toFixed(1)}
        </span>

        <span className="text-xs text-zinc-600">
          ({reviewCount} avis)
        </span>

      </div>

      {/* =================================================
          BOUTON DONNER UNE NOTE
      ================================================== */}

      {!isOpen && (
        <button
          type="button"
          onClick={onOpenReview}
          className="mt-3 rounded-lg border border-yellow-400/20 bg-yellow-400/[0.04] px-3 py-2 text-xs font-bold text-yellow-400 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.08]"
        >
          ⭐ Donner une note
        </button>
      )}

      {/* =================================================
          FORMULAIRE D'AVIS
      ================================================== */}

      {isOpen && (
        <div className="mt-4 rounded-2xl border border-yellow-400/15 bg-yellow-400/[0.03] p-4">

          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Votre note
          </p>

          {/* ÉTOILES CLIQUABLES */}

          <div className="mt-3 flex items-center gap-1">

            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => onRatingChange(star)}
                disabled={reviewSending}
                className={`text-3xl leading-none transition hover:scale-110 ${
                  star <= reviewRating
                    ? "text-yellow-400"
                    : "text-zinc-700 hover:text-yellow-500"
                }`}
                aria-label={`Donner ${star} étoile${
                  star > 1 ? "s" : ""
                }`}
              >
                ★
              </button>
            ))}

            <span className="ml-2 text-sm font-bold text-yellow-400">
              {reviewRating}/5
            </span>

          </div>

          {/* COMMENTAIRE */}

          <div className="mt-4">

            <label
              htmlFor={`review-comment-${product.id}`}
              className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
            >
              Commentaire
            </label>

            <textarea
              id={`review-comment-${product.id}`}
              value={reviewComment}
              onChange={(event) =>
                onCommentChange(event.target.value)
              }
              maxLength={1000}
              rows={3}
              disabled={reviewSending}
              placeholder="Que pensez-vous de ce produit ?"
              className="w-full resize-none rounded-xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-yellow-400/40"
            />

            <div className="mt-1 text-right text-[10px] text-zinc-700">
              {reviewComment.length}/1000
            </div>

          </div>

          {/* MESSAGE */}

          {reviewMessage && (
            <div className="mt-3 rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-zinc-300">
              {reviewMessage}
            </div>
          )}

          {/* BOUTONS */}

          <div className="mt-4 flex gap-2">

            <button
              type="button"
              onClick={onSubmitReview}
              disabled={reviewSending}
              className="flex-1 rounded-xl bg-yellow-500 px-4 py-2.5 text-xs font-black text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reviewSending
                ? "Publication..."
                : "Publier mon avis"}
            </button>

            <button
              type="button"
              onClick={onCancelReview}
              disabled={reviewSending}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs font-bold text-zinc-400 transition hover:text-white"
            >
              Annuler
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

/*
 * =====================================================
 * PAGE PRODUITS
 * =====================================================
 */

export default function ProduitsPage() {
  const router = useRouter();

  /*
   * =====================================================
   * AUTHENTIFICATION GLOBALE
   * =====================================================
   */

  const { user } = useAuth();

  /*
   * =====================================================
   * PRODUITS
   * =====================================================
   */

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState<ProductForm>({
    name: "",
    description: "",
    price: "",
    stock: "",
  });

  const [editingProduct, setEditingProduct] =
    useState<Product | null>(null);

  const [submitting, setSubmitting] = useState(false);

  /*
   * =====================================================
   * PANIER
   *
   * Conservé ici car cartCount est utilisé dans
   * le contenu de cette page.
   * =====================================================
   */

  const [cartCount, setCartCount] = useState(0);

  /*
   * =====================================================
   * AVIS
   * =====================================================
   */

  const [productReviews, setProductReviews] =
    useState<Record<number, ProductReviews>>({});

  const [reviewProductId, setReviewProductId] =
    useState<number | null>(null);

  const [reviewRating, setReviewRating] = useState(5);

  const [reviewComment, setReviewComment] =
    useState("");

  const [reviewSending, setReviewSending] =
    useState(false);

  const [reviewMessage, setReviewMessage] =
    useState("");

  /*
   * =====================================================
   * FAVORIS
   * =====================================================
   */

  const [favoriteIds, setFavoriteIds] =
    useState<number[]>([]);

  /*
   * =====================================================
   * DÉCONNEXION
   * =====================================================
   */

  const forceLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/Connexion");
  }, [router]);

  /*
   * =====================================================
   * RÉCUPÉRER LES AVIS D'UN PRODUIT
   * =====================================================
   */

  const fetchProductReviews = useCallback(
    async (productId: number) => {
      try {
        const token = localStorage.getItem("token");

        if (!token) return;

        const response = await fetch(
          `${API_URL}/products/${productId}/reviews`,
          {
            method: "GET",
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
          console.error(
            `Impossible de récupérer les avis du produit ${productId}.`
          );

          return;
        }

        const data: ProductReviews =
          await response.json();

        setProductReviews((previous) => ({
          ...previous,
          [productId]: data,
        }));
      } catch (err) {
        console.error(
          `Erreur récupération avis produit ${productId} :`,
          err
        );
      }
    },
    [forceLogout]
  );

  /*
   * =====================================================
   * PRODUITS
   * =====================================================
   */

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/products`,
        {
          method: "GET",
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

      const data:
        | Product[]
        | ApiResponse =
        await response.json();

      const productList = Array.isArray(data)
        ? data
        : data.products || [];

      setProducts(productList);

      await Promise.all(
        productList.map((product) =>
          fetchProductReviews(product.id)
        )
      );
    } catch (err) {
      console.error(
        "Erreur récupération produits :",
        err
      );

      setError(
        "Impossible de récupérer les produits."
      );
    } finally {
      setLoading(false);
    }
  }, [
    forceLogout,
    fetchProductReviews,
  ]);

  /*
   * =====================================================
   * PANIER
   * =====================================================
   */

  const fetchCart = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_URL}/cart`,
        {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      if (Array.isArray(data)) {
        const total = data.reduce(
          (
            sum: number,
            item: CartItem
          ) =>
            sum +
            Number(item.quantity || 0),
          0
        );

        setCartCount(total);
        return;
      }

      if (Array.isArray(data.items)) {
        const total = data.items.reduce(
          (
            sum: number,
            item: CartItem
          ) =>
            sum +
            Number(item.quantity || 0),
          0
        );

        setCartCount(total);
        return;
      }

      setCartCount(0);
    } catch (err) {
      console.error(
        "Erreur panier :",
        err
      );
    }
  }, []);

  /*
   * =====================================================
   * FAVORIS
   * =====================================================
   */

  const loadFavorites = () => {
    const storedFavorites =
      localStorage.getItem(
        "shopx_favorites"
      );

    if (!storedFavorites) {
      setFavoriteIds([]);
      return;
    }

    try {
      const parsedFavorites: unknown =
        JSON.parse(storedFavorites);

      if (Array.isArray(parsedFavorites)) {
        const normalizedFavorites = Array.from(
          new Set(
            parsedFavorites
              .map((id) => Number(id))
              .filter((id) => Number.isInteger(id))
          )
        );

        setFavoriteIds(normalizedFavorites);
      } else {
        setFavoriteIds([]);
      }
    } catch (err) {
      console.error(
        "Erreur lecture favoris :",
        err
      );

      setFavoriteIds([]);
    }
  };

  const toggleFavorite = (
    productId: number
  ) => {
    setFavoriteIds((previous) => {
      const currentFavorites = Array.from(
        new Set(
          previous
            .map((id) => Number(id))
            .filter((id) => Number.isInteger(id))
        )
      );
      const alreadyFavorite =
        currentFavorites.includes(productId);

      const updatedFavorites =
        alreadyFavorite
          ? currentFavorites.filter(
              (id) =>
                id !== productId
            )
          : [
              ...currentFavorites,
              productId,
            ];

      return updatedFavorites;
    });
  };

  const favoritesInitialized = useRef(false);

  useEffect(() => {
    if (!favoritesInitialized.current) {
      return;
    }

    try {
      localStorage.setItem(
        "shopx_favorites",
        JSON.stringify(favoriteIds)
      );

      window.dispatchEvent(
        new Event("favoritesUpdated")
      );
    } catch (err) {
      console.error(
        "Erreur sauvegarde favoris :",
        err
      );
    }
  }, [favoriteIds]);

  /*
   * =====================================================
   * INITIALISATION
   * =====================================================
   */

  useEffect(() => {
    const storedToken =
      localStorage.getItem("token");

    if (!storedToken) {
      forceLogout();
      return;
    }

    loadFavorites();
    favoritesInitialized.current = true;

    fetchProducts();
    fetchCart();
  }, [
    forceLogout,
    fetchProducts,
    fetchCart,
  ]);

  /*
   * =====================================================
   * FORMULAIRE PRODUIT
   * =====================================================
   */

  const handleChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const {
      name,
      value,
    } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /*
   * =====================================================
   * CRÉER / MODIFIER PRODUIT
   * =====================================================
   */

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const isEditing =
        editingProduct !== null;

      const url = isEditing
        ? `${API_URL}/products/${editingProduct.id}`
        : `${API_URL}/products`;

      const method = isEditing
        ? "PUT"
        : "POST";

      const response = await fetch(
        url,
        {
          method,
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: form.name,
            description:
              form.description,
            price: Number(
              form.price
            ),
            stock: Number(
              form.stock
            ),
          }),
        }
      );

      const data: ApiObjectResponse =
        await response.json();

      if (response.status === 401) {
        forceLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Une erreur est survenue."
        );
      }

      setForm({
        name: "",
        description: "",
        price: "",
        stock: "",
      });

      setEditingProduct(null);

      await fetchProducts();
    } catch (err) {
      console.error(
        "Erreur création/modification produit :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setSubmitting(false);
    }
  };

  /*
   * =====================================================
   * MODIFIER
   * =====================================================
   */

  const handleEdit = (
    product: Product
  ) => {
    setEditingProduct(product);

    setForm({
      name: product.name,
      description:
        product.description || "",
      price: String(
        product.price
      ),
      stock: String(
        product.stock
      ),
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const cancelEdit = () => {
    setEditingProduct(null);

    setForm({
      name: "",
      description: "",
      price: "",
      stock: "",
    });
  };

  /*
   * =====================================================
   * SUPPRIMER
   * =====================================================
   */

  const handleDelete = async (
    productId: number
  ) => {
    const confirmation =
      window.confirm(
        "Voulez-vous vraiment supprimer ce produit ?"
      );

    if (!confirmation) return;

    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            Accept:
              "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data: ApiObjectResponse =
        await response.json();

      if (response.status === 401) {
        forceLogout();
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer le produit."
        );
      }

      setProducts(
        (previous) =>
          previous.filter(
            (product) =>
              product.id !==
              productId
          )
      );

      setProductReviews(
        (previous) => {
          const updated = {
            ...previous,
          };

          delete updated[
            productId
          ];

          return updated;
        }
      );

      setFavoriteIds(
        (previous) => {
          const updated =
            previous.filter(
              (id) =>
                id !== productId
            );

          localStorage.setItem(
            "shopx_favorites",
            JSON.stringify(
              updated
            )
          );

          window.dispatchEvent(
            new Event(
              "favoritesUpdated"
            )
          );

          return updated;
        }
      );
    } catch (err) {
      console.error(
        "Erreur suppression produit :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de supprimer le produit."
      );
    }
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

      const response = await fetch(
        `${API_URL}/cart`,
        {
          method: "POST",
          headers: {
            Accept:
              "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
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
        "Erreur ajout panier :",
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
   * PUBLIER UN AVIS
   * =====================================================
   */

  const submitReview = async () => {
    if (!reviewProductId) return;

    const productId =
      reviewProductId;

    try {
      setReviewSending(true);
      setReviewMessage("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        forceLogout();
        return;
      }

      const response = await fetch(
        `${API_URL}/products/${productId}/reviews`,
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
            rating: reviewRating,
            comment:
              reviewComment.trim() ||
              null,
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
        setReviewMessage(
          data.message ||
            "Impossible d'ajouter votre avis."
        );

        return;
      }

      await fetchProductReviews(
        productId
      );

      setReviewMessage(
        "✅ Votre avis a été ajouté avec succès."
      );

      setReviewComment("");
      setReviewRating(5);

      setTimeout(() => {
        setReviewProductId(null);
        setReviewMessage("");
      }, 1200);
    } catch (err) {
      console.error(
        "Erreur ajout avis :",
        err
      );

      setReviewMessage(
        "Une erreur est survenue lors de l'envoi."
      );
    } finally {
      setReviewSending(false);
    }
  };

  /*
   * =====================================================
   * RÔLES
   * =====================================================
   */

  const isAdmin =
    user?.role === "admin";

  const isSeller =
    user?.role === "vendeur" ||
    user?.role === "seller";

  const canManageProducts =
    isAdmin || isSeller;

  const availableProducts =
    products.filter(
      (product) =>
        product.stock > 0
    ).length;

  /*
   * =====================================================
   * AFFICHAGE
   * =====================================================
   */

  return (
    <main className="min-h-screen bg-[#020407] text-white">

      {/* =====================================================
          BACKGROUND ELECTRIC
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-[-15%] top-[-15%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.08] blur-[140px]" />

        <div className="absolute right-[-10%] top-[20%] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.06] blur-[140px]" />

        <div className="absolute bottom-[-15%] left-[30%] h-[500px] w-[500px] rounded-full bg-blue-500/[0.05] blur-[150px]" />

      </div>

      {/* =====================================================
          NAVIGATION SHOPX
          
          La navigation est maintenant centralisée dans
          app/components/Navbar.tsx
      ====================================================== */}

      <Navbar />

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <div className="relative overflow-hidden">

        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">

          {/* =================================================
              HERO
          ================================================== */}

          <AnimatedContainer>

            <section className="relative mb-10 overflow-hidden rounded-3xl border border-blue-400/10 bg-gradient-to-br from-blue-500/[0.07] via-[#05070b] to-cyan-400/[0.04] p-7 shadow-[0_0_50px_rgba(37,99,235,0.05)] md:p-10">

              <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-blue-500/[0.08] blur-[100px]" />

              <div className="pointer-events-none absolute bottom-[-100px] left-[30%] h-64 w-64 rounded-full bg-cyan-400/[0.05] blur-[100px]" />

              <div className="relative">

                <div className="mb-5 flex items-center gap-2">

                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_15px_rgba(37,99,235,0.9)]" />

                  <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                    SHOPX CATALOGUE
                  </span>

                </div>

                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">

                  <div>

                    <h1 className="max-w-3xl text-4xl font-black tracking-tight md:text-5xl">

                      Découvrez notre{" "}

                      <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                        collection
                      </span>

                    </h1>

                    <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-500 md:text-base">
                      Explorez les produits disponibles
                      sur ShopX et trouvez exactement ce
                      qu'il vous faut.
                    </p>

                  </div>

                  <div className="grid grid-cols-3 gap-2 sm:gap-3">

                    <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-4 sm:px-5">

                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Produits
                      </p>

                      <p className="mt-1 text-2xl font-black text-white">
                        {products.length}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.04] px-4 py-4 sm:px-5">

                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Disponibles
                      </p>

                      <p className="mt-1 text-2xl font-black text-blue-400">
                        {availableProducts}
                      </p>

                    </div>

                    <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.03] px-4 py-4 sm:px-5">

                      <p className="text-[9px] uppercase tracking-wider text-zinc-600">
                        Panier
                      </p>

                      <p className="mt-1 text-2xl font-black text-cyan-300">
                        {cartCount}
                      </p>

                    </div>

                  </div>

                </div>

              </div>

            </section>

          </AnimatedContainer>

          {/* =================================================
              ERREUR
          ================================================== */}

          {error && (
            <AnimatedContainer delay={0.1}>

              <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-400">
                {error}
              </div>

            </AnimatedContainer>
          )}

          {/* =================================================
              FORMULAIRE PRODUIT
          ================================================== */}

          {canManageProducts && (
            <AnimatedContainer delay={0.15}>

              <section className="mb-12 overflow-hidden rounded-3xl border border-blue-400/10 bg-[#05070a] shadow-[0_0_40px_rgba(37,99,235,0.04)]">

                <div className="border-b border-white/[0.07] bg-gradient-to-r from-blue-500/[0.06] to-cyan-400/[0.03] p-6 md:p-8">

                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                    <div>

                      <div className="flex items-center gap-3">

                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10 text-blue-400">
                          ✦
                        </div>

                        <h2 className="text-xl font-black">
                          {editingProduct
                            ? "Modifier le produit"
                            : "Ajouter un produit"}
                        </h2>

                      </div>

                      <p className="mt-2 text-xs text-zinc-600">
                        {isSeller
                          ? "Le produit sera automatiquement associé à votre boutique."
                          : "Ajoutez et gérez les produits de la plateforme."}
                      </p>

                    </div>

                    <span className="w-fit rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-300">
                      {isAdmin
                        ? "Administrateur"
                        : "Vendeur"}
                    </span>

                  </div>

                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid gap-5 p-6 md:grid-cols-2 md:p-8"
                >

                  <div>

                    <label
                      htmlFor="name"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Nom du produit
                    </label>

                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-400/50 focus:bg-blue-500/[0.02] focus:shadow-[0_0_25px_rgba(37,99,235,0.08)]"
                      placeholder="Ex : Nike Air Max"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="price"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Prix
                    </label>

                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-400/50 focus:bg-blue-500/[0.02]"
                      placeholder="Ex : 45000"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="stock"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Stock
                    </label>

                    <input
                      id="stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={handleChange}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-400/50 focus:bg-blue-500/[0.02]"
                      placeholder="Ex : 25"
                    />

                  </div>

                  <div>

                    <label
                      htmlFor="description"
                      className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-500"
                    >
                      Description
                    </label>

                    <input
                      id="description"
                      name="description"
                      type="text"
                      value={form.description}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-400/50 focus:bg-blue-500/[0.02]"
                      placeholder="Description courte"
                    />

                  </div>

                  <div className="flex flex-wrap gap-3 md:col-span-2">

                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-6 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.25)] transition hover:shadow-[0_0_40px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {submitting
                        ? "Enregistrement..."
                        : editingProduct
                        ? "Modifier le produit"
                        : "Ajouter le produit"}
                    </button>

                    {editingProduct && (
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-bold text-zinc-400 transition hover:border-blue-400/30 hover:text-white"
                      >
                        Annuler
                      </button>
                    )}

                  </div>

                </form>

              </section>

            </AnimatedContainer>
          )}

          {/* =================================================
              CHARGEMENT
          ================================================== */}

          {loading && (
            <AnimatedContainer delay={0.2}>

              <div className="flex min-h-[300px] items-center justify-center">

                <div className="text-center">

                  <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400 border-r-blue-400 shadow-[0_0_20px_rgba(37,99,235,0.2)]" />

                  <p className="text-sm text-zinc-600">
                    Chargement du catalogue...
                  </p>

                </div>

              </div>

            </AnimatedContainer>
          )}

          {/* =================================================
              AUCUN PRODUIT
          ================================================== */}

          {!loading &&
            products.length === 0 && (
              <AnimatedContainer delay={0.25}>

                <div className="rounded-3xl border border-white/10 bg-[#05070a] p-14 text-center">

                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/15 bg-blue-500/[0.05] text-2xl text-blue-400">
                    ◇
                  </div>

                  <h2 className="text-xl font-black">
                    Aucun produit disponible
                  </h2>

                  <p className="mt-2 text-sm text-zinc-600">
                    Les produits apparaîtront ici
                    lorsqu'ils seront disponibles.
                  </p>

                </div>

              </AnimatedContainer>
            )}

          {/* =================================================
              PRODUITS
          ================================================== */}

          {!loading &&
            products.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">

                {products.map(
                  (
                    product,
                    index
                  ) => {

                    const reviewData =
                      productReviews[
                        product.id
                      ];

                    const average = Number(
                      reviewData?.average ??
                        product.average_rating ??
                        product.rating ??
                        0
                    );

                    const reviewCount =
                      reviewData?.count ??
                      product.reviews_count ??
                      0;

                    return (
                      <AnimatedContainer
                        key={product.id}
                        delay={
                          0.25 +
                          index * 0.06
                        }
                      >

                        <article className="group relative overflow-hidden rounded-3xl border border-white/[0.08] bg-[#05070a] transition duration-300 hover:-translate-y-1 hover:border-blue-400/30 hover:shadow-[0_20px_60px_rgba(37,99,235,0.1)]">

                          {/* LIGNE ÉLECTRIQUE */}

                          <div className="absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-40 transition group-hover:opacity-100" />

                          {/* GLOW */}

                          <div className="pointer-events-none absolute -right-20 -top-20 h-44 w-44 rounded-full bg-blue-500/[0.06] blur-[75px] transition group-hover:bg-blue-500/[0.14]" />

                          {/* HEADER */}

                          <div className="relative border-b border-white/[0.06] p-6">

                            <div className="mb-5 flex items-start justify-between">

                              <div className="flex items-center gap-3">

                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-500/15 to-cyan-400/5 text-3xl text-blue-300 shadow-[0_0_25px_rgba(37,99,235,0.1)]">
                                  ◈
                                </div>

                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleFavorite(
                                      product.id
                                    )
                                  }
                                  aria-label={
                                    favoriteIds.includes(
                                      product.id
                                    )
                                      ? "Retirer des favoris"
                                      : "Ajouter aux favoris"
                                  }
                                  title={
                                    favoriteIds.includes(
                                      product.id
                                    )
                                      ? "Retirer des favoris"
                                      : "Ajouter aux favoris"
                                  }
                                  className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                                    favoriteIds.includes(
                                      product.id
                                    )
                                      ? "border-pink-400/40 bg-pink-500/15 text-pink-400 shadow-[0_0_25px_rgba(236,72,153,0.25)]"
                                      : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-pink-400/30 hover:bg-pink-500/10 hover:text-pink-400"
                                  }`}
                                >
                                  <span className="text-2xl leading-none">
                                    {favoriteIds.includes(
                                      product.id
                                    )
                                      ? "♥"
                                      : "♡"}
                                  </span>
                                </button>

                              </div>

                              <span
                                className={`rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-wider ${
                                  product.stock > 0
                                    ? "border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-400"
                                    : "border-red-400/20 bg-red-400/[0.06] text-red-400"
                                }`}
                              >
                                {product.stock > 0
                                  ? "Disponible"
                                  : "Rupture"}
                              </span>

                            </div>

                            <h2 className="line-clamp-1 text-xl font-black">
                              {product.name}
                            </h2>

                            <p className="mt-2 min-h-[42px] text-sm leading-6 text-zinc-600">
                              {product.description ||
                                "Aucune description disponible."}
                            </p>

                            {/* AVIS */}

                            <ProductRating
                              product={product}
                              average={average}
                              reviewCount={
                                reviewCount
                              }
                              reviewProductId={
                                reviewProductId
                              }
                              reviewRating={
                                reviewRating
                              }
                              reviewComment={
                                reviewComment
                              }
                              reviewSending={
                                reviewSending
                              }
                              reviewMessage={
                                reviewMessage
                              }
                              onOpenReview={() => {
                                setReviewProductId(
                                  product.id
                                );

                                setReviewRating(
                                  5
                                );

                                setReviewComment(
                                  ""
                                );

                                setReviewMessage(
                                  ""
                                );
                              }}
                              onRatingChange={
                                setReviewRating
                              }
                              onCommentChange={
                                setReviewComment
                              }
                              onSubmitReview={
                                submitReview
                              }
                              onCancelReview={() => {
                                setReviewProductId(
                                  null
                                );

                                setReviewRating(
                                  5
                                );

                                setReviewComment(
                                  ""
                                );

                                setReviewMessage(
                                  ""
                                );
                              }}
                            />

                          </div>

                          {/* =================================================
                              BOUTIQUE
                          ================================================== */}

                          <div className="p-6">

                            {product.shop ? (

                              <button
                                type="button"
                                onClick={() =>
                                  router.push(
                                    `/Boutique/${product.shop?.id}`
                                  )
                                }
                                className="group/shop w-full rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-blue-400/25 hover:bg-blue-500/[0.04]"
                              >

                                <div className="flex items-center gap-3">

                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/10 text-blue-300">
                                    ◇
                                  </div>

                                  <div className="min-w-0 flex-1">

                                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                                      Boutique
                                    </p>

                                    <p className="truncate text-sm font-bold text-blue-300">
                                      {
                                        product.shop.name
                                      }
                                    </p>

                                  </div>

                                  <span className="text-zinc-700 transition group-hover/shop:translate-x-1 group-hover/shop:text-blue-300">
                                    →
                                  </span>

                                </div>

                                {product.shop.description && (
                                  <p className="mt-3 line-clamp-2 text-xs leading-5 text-zinc-600">
                                    {
                                      product.shop
                                        .description
                                    }
                                  </p>
                                )}

                              </button>

                            ) : (

                              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">

                                <p className="text-xs text-zinc-600">
                                  ◇ Boutique non associée
                                </p>

                              </div>

                            )}

                            {/* PRIX / STOCK */}

                            <div className="mt-5 flex items-end justify-between">

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

                                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                                  Stock
                                </p>

                                <p
                                  className={`mt-1 text-lg font-black ${
                                    product.stock > 0
                                      ? "text-emerald-400"
                                      : "text-red-400"
                                  }`}
                                >
                                  {
                                    product.stock
                                  }
                                </p>

                              </div>

                            </div>

                            {/* BARRE STOCK */}

                            <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.05]">

                              <div
                                className={`h-full rounded-full ${
                                  product.stock > 0
                                    ? "bg-gradient-to-r from-blue-600 via-blue-400 to-cyan-300"
                                    : "bg-red-500"
                                }`}
                                style={{
                                  width:
                                    product.stock <=
                                    0
                                      ? "100%"
                                      : `${Math.min(
                                          product.stock *
                                            5,
                                          100
                                        )}%`,
                                }}
                              />

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
                                product.stock <=
                                0
                              }
                              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-5 py-3 text-sm font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.18)] transition hover:shadow-[0_0_35px_rgba(37,99,235,0.35)] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:bg-none disabled:text-zinc-600 disabled:shadow-none"
                            >

                              {product.stock > 0 ? (
                                <>
                                  <span>
                                    🛒
                                  </span>

                                  Ajouter au panier
                                </>
                              ) : (
                                "Rupture de stock"
                              )}

                            </button>

                            {/* ADMIN / VENDEUR */}

                            {canManageProducts && (
                              <div className="mt-3 grid grid-cols-2 gap-3">

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(
                                      product
                                    )
                                  }
                                  className="rounded-xl border border-blue-400/20 bg-blue-500/[0.04] px-4 py-2.5 text-xs font-bold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/[0.1]"
                                >
                                  Modifier
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      product.id
                                    )
                                  }
                                  className="rounded-xl border border-red-400/20 bg-red-400/[0.03] px-4 py-2.5 text-xs font-bold text-red-400 transition hover:border-red-400/40 hover:bg-red-400/[0.08]"
                                >
                                  Supprimer
                                </button>

                              </div>
                            )}

                          </div>

                        </article>

                      </AnimatedContainer>
                    );
                  }
                )}

              </div>
            )}

        </div>

      </div>

    </main>
  );
}