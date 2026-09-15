"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL =
process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Product {
id: number;
name: string;
price: number;
}

interface User {
id: number;
name: string;
}

interface Review {
id: number;
rating: number;
comment: string | null;
created_at: string;
user: User;
}

interface ProductReviews {
reviews: Review[];
average: number;
count: number;
}

function Stars({ rating }: { rating: number }) {
return ( <div className="flex items-center gap-1">
{[1, 2, 3, 4, 5].map((star) => (
<span
key={star}
className={
star <= Math.round(rating)
? "text-yellow-400"
: "text-zinc-700"
}
>
★ </span>
))} </div>
);
}

export default function ReviewsPage() {
const [products, setProducts] = useState<Product[]>([]);
const [reviews, setReviews] = useState<Record<number, ProductReviews>>({});
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
const [rating, setRating] = useState(5);
const [hoveredRating, setHoveredRating] = useState<number | null>(null);
const [comment, setComment] = useState("");
const [sending, setSending] = useState(false);
const [message, setMessage] = useState("");

useEffect(() => {
loadProducts();
}, []);

async function loadProducts() {
try {
setLoading(true);
setError("");

  const token = localStorage.getItem("token");

  const response = await fetch(`${API_URL}/products`, {
    headers: {
      Accept: "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer les produits.");
  }

  const data = await response.json();

  const productList: Product[] = Array.isArray(data)
    ? data
    : data.products ?? data.data ?? [];

  setProducts(productList);

  await Promise.all(
    productList.map((product) => loadReviews(product.id))
  );
} catch (err) {
  console.error(err);
  setError("Impossible de charger les produits.");
} finally {
  setLoading(false);
}

}

async function loadReviews(productId: number) {
try {
const token = localStorage.getItem("token");

  const response = await fetch(
    `${API_URL}/products/${productId}/reviews`,
    {
      headers: {
        Accept: "application/json",
        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },
    }
  );

  if (!response.ok) {
    return;
  }

  const data: ProductReviews = await response.json();

  setReviews((previous) => ({
    ...previous,
    [productId]: data,
  }));
} catch (err) {
  console.error(
    `Erreur lors du chargement des avis du produit ${productId}`,
    err
  );
}

}

async function submitReview(productId: number) {
const token = localStorage.getItem("token");

if (!token) {
  setMessage("Vous devez être connecté pour laisser un avis.");
  return;
}

try {
  setSending(true);
  setMessage("");

  const response = await fetch(
    `${API_URL}/products/${productId}/reviews`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        rating,
        comment: comment.trim() || null,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    setMessage(
      data.message || "Impossible d'ajouter votre avis."
    );
    return;
  }

  setMessage("✅ Votre avis a été ajouté avec succès.");
  setComment("");
  setRating(5);
  setHoveredRating(null);

  await loadReviews(productId);
} catch (err) {
  console.error(err);
  setMessage("Une erreur est survenue.");
} finally {
  setSending(false);
}

}

return ( <main className="min-h-screen bg-black px-5 py-10 text-white"> <div className="mx-auto max-w-6xl">
{/* Retour */} <Link
       href="/"
       className="mb-8 inline-flex text-sm text-gray-400 transition hover:text-white"
     >
← Retour à l'accueil </Link>

    {/* En-tête */}
    <div className="mb-10">
      <div className="mb-3 text-5xl">⭐</div>

      <h1 className="text-4xl font-bold">
        Avis & évaluations
      </h1>

      <p className="mt-3 max-w-2xl text-gray-400">
        Consultez les avis des clients et partagez votre expérience
        sur les produits ShopX.
      </p>
    </div>

    {/* Chargement */}
    {loading && (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
        <div className="text-3xl">⏳</div>
        <p className="mt-3 text-gray-400">
          Chargement des produits...
        </p>
      </div>
    )}

    {/* Erreur */}
    {!loading && error && (
      <div className="rounded-2xl border border-red-900/50 bg-red-950/20 p-6 text-red-400">
        {error}
      </div>
    )}

    {/* Aucun produit */}
    {!loading && !error && products.length === 0 && (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-10 text-center">
        <div className="text-5xl">📦</div>

        <h2 className="mt-4 text-2xl font-semibold">
          Aucun produit
        </h2>

        <p className="mt-2 text-gray-400">
          Aucun produit n'est actuellement disponible.
        </p>
      </div>
    )}

    {/* Produits */}
    {!loading && products.length > 0 && (
      <div className="space-y-8">
        {products.map((product) => {
          const productReviews = reviews[product.id];

          return (
            <section
              key={product.id}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950"
            >
              {/* Produit */}
              <div className="border-b border-zinc-800 p-6">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {product.name}
                    </h2>

                    <p className="mt-2 text-lg font-semibold text-blue-400">
                      {Number(product.price).toLocaleString("fr-FR")} FCFA
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-black px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold">
                        {productReviews?.average?.toFixed(1) ?? "0.0"}
                      </span>

                      <Stars
                        rating={productReviews?.average ?? 0}
                      />
                    </div>

                    <p className="mt-1 text-sm text-gray-500">
                      {productReviews?.count ?? 0} avis
                    </p>
                  </div>
                </div>
              </div>

              {/* Avis existants */}
              <div className="p-6">
                <h3 className="mb-5 text-lg font-semibold">
                  Avis des clients
                </h3>

                {!productReviews ||
                productReviews.reviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-800 p-6 text-center">
                    <p className="text-gray-500">
                      Aucun avis pour ce produit.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {productReviews.reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-zinc-800 bg-black p-5"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="font-semibold">
                              {review.user?.name ?? "Client"}
                            </p>

                            <Stars rating={review.rating} />
                          </div>

                          <span className="text-xs text-gray-600">
                            {new Date(
                              review.created_at
                            ).toLocaleDateString("fr-FR")}
                          </span>
                        </div>

                        {review.comment && (
                          <p className="mt-4 leading-relaxed text-gray-400">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Bouton avis */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct(
                        selectedProduct === product.id
                          ? null
                          : product.id
                      );
                      setMessage("");
                    }}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-500"
                  >
                    ⭐ Donner mon avis
                  </button>
                </div>

                {/* Formulaire */}
                {selectedProduct === product.id && (
                  <div className="mt-6 rounded-2xl border border-zinc-800 bg-black p-6">
                    <h3 className="text-xl font-semibold">
                      Votre avis sur {product.name}
                    </h3>

                    {/* Note */}
                    <div className="mt-6">
                      <label className="mb-3 block text-sm font-medium text-gray-300">
                        Votre note
                      </label>

                      <div
                        className="flex gap-2"
                        onMouseLeave={() => setHoveredRating(null)}
                        aria-label={`Note sélectionnée : ${rating} sur 5`}
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoveredRating(star)}
                            disabled={sending}
                            className={`text-4xl transition ${
                              star <= (hoveredRating ?? rating)
                                ? "text-yellow-400"
                                : "text-zinc-700 hover:text-yellow-500"
                            }`}
                            aria-pressed={star === rating}
                            aria-label={`Donner ${star} étoile${
                              star > 1 ? "s" : ""
                            }`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Commentaire */}
                    <div className="mt-6">
                      <label
                        htmlFor={`comment-${product.id}`}
                        className="mb-2 block text-sm font-medium text-gray-300"
                      >
                        Votre commentaire
                      </label>

                      <textarea
                        id={`comment-${product.id}`}
                        value={comment}
                        onChange={(event) =>
                          setComment(event.target.value)
                        }
                        maxLength={1000}
                        rows={5}
                        placeholder="Partagez votre expérience avec ce produit..."
                        className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-blue-500"
                      />

                      <p className="mt-2 text-right text-xs text-gray-600">
                        {comment.length}/1000
                      </p>
                    </div>

                    {/* Message */}
                    {message && (
                      <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-gray-300">
                        {message}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() =>
                          submitReview(product.id)
                        }
                        disabled={sending}
                        className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {sending
                          ? "Envoi..."
                          : "Publier mon avis"}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(null);
                          setComment("");
                          setRating(5);
                          setHoveredRating(null);
                          setMessage("");
                        }}
                        className="rounded-xl border border-zinc-800 px-6 py-3 font-semibold text-gray-400 transition hover:border-zinc-700 hover:text-white"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    )}
  </div>
</main>

);
}
