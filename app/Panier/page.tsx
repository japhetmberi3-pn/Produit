"use client";

import { useEffect, useState } from "react";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
}

interface CartItem {
  id: number;
  cart_id: number;
  product_id: number;
  quantity: number;
  product: Product;
}

interface CartResponse {
  cart: {
    id: number;
    user_id: number;
  };
  items: CartItem[];
}

interface ApiResponse {
  message?: string;
  item?: CartItem;
  order?: {
    id: number;
    user_id: number;
    status: string;
    items?: unknown[];
  };
  errors?: Record<string, string[]>;
}

export default function PanierPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [updatingItem, setUpdatingItem] = useState<number | null>(null);
  const [removingItem, setRemovingItem] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";

  // =========================
  // RÉCUPÉRER LE PANIER
  // =========================

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Vous devez être connecté.");
        return;
      }

      const response = await fetch(`${API_URL}/cart`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const text = await response.text();

      let data: CartResponse | ApiResponse = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Le serveur a retourné une réponse invalide."
        );
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        const errorData = data as ApiResponse;

        throw new Error(
          errorData.message ||
            "Impossible de récupérer le panier."
        );
      }

      const cartData = data as CartResponse;

      setItems(
        Array.isArray(cartData.items)
          ? cartData.items
          : []
      );
    } catch (err) {
      console.error("Erreur panier :", err);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHARGEMENT INITIAL
  // =========================

  useEffect(() => {
    fetchCart();
  }, []);

  // =========================
  // SÉLECTIONNER / DÉSÉLECTIONNER
  // =========================

  const toggleSelection = (itemId: number) => {
    setError("");
    setSuccess("");

    setSelectedItems((previous) => {
      if (previous.includes(itemId)) {
        return previous.filter(
          (id) => id !== itemId
        );
      }

      return [...previous, itemId];
    });
  };

  // =========================
  // SÉLECTIONNER TOUS
  // =========================

  const toggleSelectAll = () => {
    setError("");
    setSuccess("");

    if (
      selectedItems.length === items.length &&
      items.length > 0
    ) {
      setSelectedItems([]);
    } else {
      setSelectedItems(
        items.map((item) => item.id)
      );
    }
  };

  // =========================
  // MODIFIER LA QUANTITÉ
  // =========================

  const updateQuantity = async (
    item: CartItem,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      return;
    }

    if (newQuantity > item.product.stock) {
      setError(
        `Stock insuffisant. Il reste seulement ${item.product.stock} produit(s).`
      );
      return;
    }

    try {
      setUpdatingItem(item.id);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Vous devez être connecté.");
        return;
      }

      const response = await fetch(
        `${API_URL}/cart/items/${item.id}`,
        {
          method: "PATCH",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        }
      );

      const text = await response.text();

      let data: ApiResponse = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Le serveur a retourné une réponse invalide."
        );
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de modifier la quantité."
        );
      }

      if (!data.item) {
        throw new Error(
          "Laravel n'a pas retourné l'article modifié."
        );
      }

      setItems((previous) =>
        previous.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                quantity:
                  data.item!.quantity,
              }
            : currentItem
        )
      );
    } catch (err) {
      console.error(
        "Erreur quantité :",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Une erreur est survenue."
        );
      }
    } finally {
      setUpdatingItem(null);
    }
  };

  // =========================
  // SUPPRIMER UN ARTICLE
  // =========================

  const removeItem = async (
    itemId: number
  ) => {
    try {
      setRemovingItem(itemId);
      setError("");
      setSuccess("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Vous devez être connecté.");
        return;
      }

      const response = await fetch(
        `${API_URL}/cart/items/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const text = await response.text();

      let data: ApiResponse = {};

      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        throw new Error(
          "Le serveur a retourné une réponse invalide."
        );
      }

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de supprimer l'article."
        );
      }

      setItems((previous) =>
        previous.filter(
          (item) => item.id !== itemId
        )
      );

      setSelectedItems((previous) =>
        previous.filter(
          (id) => id !== itemId
        )
      );

      setSuccess(
        "Article supprimé du panier."
      );
    } catch (err) {
      console.error(
        "Erreur suppression :",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Une erreur est survenue."
        );
      }
    } finally {
      setRemovingItem(null);
    }
  };

  // =========================
  // ARTICLES SÉLECTIONNÉS
  // =========================

  const selectedCartItems =
    items.filter((item) =>
      selectedItems.includes(item.id)
    );

  // =========================
  // CALCUL DU TOTAL
  // =========================

  const itemsToBuy =
    selectedCartItems.length > 0
      ? selectedCartItems
      : items;

  const total = itemsToBuy.reduce(
    (sum, item) =>
      sum +
      Number(item.product.price) *
        item.quantity,
    0
  );

  // =========================
  // ACHETER
  // =========================

  const buySelectedItems = async () => {
    /*
     * Si des articles sont sélectionnés,
     * on achète uniquement ceux-là.
     *
     * Sinon, on achète tout le panier.
     */
    const productsToBuy =
      selectedCartItems.length > 0
        ? selectedCartItems
        : items;

    if (productsToBuy.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

    // =========================
    // VÉRIFIER LE STOCK
    // =========================

    const stockProblem =
      productsToBuy.find(
        (item) =>
          item.quantity >
          item.product.stock
      );

    if (stockProblem) {
      setError(
        `Stock insuffisant pour "${stockProblem.product.name}".`
      );
      return;
    }

    try {
      setBuying(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Vous devez être connecté."
        );
        return;
      }

      // =========================
      // CONSTRUIRE LA COMMANDE
      // =========================

      const orderItems =
        productsToBuy.map(
          (item) => ({
            product_id:
              item.product_id,
            quantity:
              item.quantity,
          })
        );

      console.log(
        "Commande envoyée à Laravel :",
        {
          items: orderItems,
        }
      );

      // =========================
      // ENVOYER À LARAVEL
      // =========================

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            items: orderItems,
          }),
        }
      );

      const text = await response.text();

      let data: ApiResponse = {};

      try {
        data = text
          ? JSON.parse(text)
          : {};
      } catch {
        throw new Error(
          "Le serveur a retourné une réponse invalide."
        );
      }

      console.log(
        "Réponse achat Laravel :",
        data
      );

      // =========================
      // TOKEN EXPIRÉ
      // =========================

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      // =========================
      // ERREURS DE VALIDATION
      // =========================

      if (
        response.status === 422 &&
        data.errors
      ) {
        const validationErrors =
          Object.values(data.errors)
            .flat()
            .join(" ");

        throw new Error(
          validationErrors ||
            "Les données envoyées sont invalides."
        );
      }

      // =========================
      // AUTRE ERREUR
      // =========================

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'effectuer l'achat."
        );
      }

      // =========================
      // VÉRIFIER LA COMMANDE
      // =========================

      if (!data.order) {
        throw new Error(
          "Laravel n'a pas retourné la commande créée."
        );
      }

      // =========================
      // ACHAT RÉUSSI
      // =========================

      setSelectedItems([]);

      setSuccess(
        `Achat effectué avec succès ! Commande #${data.order.id}.`
      );

      // =========================
      // ACTUALISER LE PANIER
      // =========================

      await fetchCart();
    } catch (err) {
      console.error(
        "Erreur achat :",
        err
      );

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Une erreur est survenue pendant l'achat."
        );
      }
    } finally {
      setBuying(false);
    }
  };

  // =========================
  // CHARGEMENT
  // =========================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-lg text-gray-400">
          Chargement du panier...
        </p>
      </main>
    );
  }

  // =========================
  // AFFICHAGE
  // =========================

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* TITRE */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <h1 className="text-3xl font-bold">
            🛒 Mon panier
          </h1>

          {items.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              disabled={buying}
              className="text-blue-400 transition hover:text-blue-300 disabled:opacity-50"
            >
              {selectedItems.length ===
                items.length
                ? "Tout désélectionner"
                : "Tout sélectionner"}
            </button>
          )}
        </div>

        {/* ERREUR */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-700 bg-red-900/40 p-4 text-red-200">
            {error}
          </div>
        )}

        {/* SUCCÈS */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-700 bg-green-900/40 p-4 text-green-200">
            {success}
          </div>
        )}

        {/* PANIER VIDE */}
        {items.length === 0 ? (
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-10 text-center">

            <div className="mb-4 text-5xl">
              🛒
            </div>

            <p className="text-lg text-gray-400">
              Votre panier est vide.
            </p>

            <button
              type="button"
              onClick={() =>
                (window.location.href =
                  "/Produits")
              }
              className="mt-6 rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
            >
              Voir les produits
            </button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ARTICLES */}
            {items.map((item) => {
              const isSelected =
                selectedItems.includes(
                  item.id
                );

              const isUpdating =
                updatingItem === item.id;

              const isRemoving =
                removingItem === item.id;

              const itemTotal =
                Number(
                  item.product.price
                ) * item.quantity;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border bg-gray-900 p-5 transition ${
                    isSelected
                      ? "border-blue-500"
                      : "border-gray-800"
                  }`}
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-center">

                    {/* CHECKBOX */}
                    <div>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          toggleSelection(
                            item.id
                          )
                        }
                        disabled={
                          buying ||
                          isRemoving
                        }
                        className="h-5 w-5 cursor-pointer"
                      />
                    </div>

                    {/* PRODUIT */}
                    <div className="flex-1">

                      <h2 className="text-xl font-semibold">
                        {item.product.name}
                      </h2>

                      {item.product
                        .description && (
                        <p className="mt-1 text-gray-400">
                          {
                            item.product
                              .description
                          }
                        </p>
                      )}

                      <p className="mt-2 font-semibold text-blue-400">
                        {Number(
                          item.product.price
                        ).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        FCFA
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Stock disponible :{" "}
                        {item.product.stock}
                      </p>
                    </div>

                    {/* QUANTITÉ */}
                    <div className="flex items-center gap-3">

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item,
                            item.quantity - 1
                          )
                        }
                        disabled={
                          item.quantity <=
                            1 ||
                          isUpdating ||
                          buying ||
                          isRemoving
                        }
                        className="h-9 w-9 rounded-lg bg-gray-800 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        −
                      </button>

                      <span className="w-8 text-center font-semibold">
                        {isUpdating
                          ? "..."
                          : item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          item.quantity >=
                            item.product
                              .stock ||
                          isUpdating ||
                          buying ||
                          isRemoving
                        }
                        className="h-9 w-9 rounded-lg bg-gray-800 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>

                    {/* SOUS-TOTAL */}
                    <div className="w-36 text-right">

                      <p className="text-sm text-gray-500">
                        Sous-total
                      </p>

                      <p className="font-bold">
                        {itemTotal.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        FCFA
                      </p>
                    </div>

                    {/* SUPPRIMER */}
                    <button
                      type="button"
                      onClick={() =>
                        removeItem(item.id)
                      }
                      disabled={
                        isRemoving ||
                        buying
                      }
                      className="rounded-lg px-3 py-2 text-red-400 transition hover:bg-red-900/20 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isRemoving
                        ? "Suppression..."
                        : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* RÉSUMÉ */}
            <div className="mt-8 rounded-xl border border-gray-800 bg-gray-900 p-6">

              <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                  <p className="text-gray-400">
                    Articles sélectionnés
                  </p>

                  <p className="text-lg font-semibold">
                    {selectedCartItems.length > 0
                      ? selectedCartItems.length
                      : items.length}
                  </p>
                </div>

                <div className="text-left sm:text-right">

                  <p className="text-gray-400">
                    Total
                  </p>

                  <p className="text-2xl font-bold text-blue-400">
                    {total.toLocaleString(
                      "fr-FR"
                    )}{" "}
                    FCFA
                  </p>
                </div>
              </div>

              {/* ACHETER */}
              <button
                type="button"
                onClick={buySelectedItems}
                disabled={
                  items.length === 0 ||
                  buying
                }
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
              >
                {buying
                  ? "Traitement de l'achat..."
                  : selectedCartItems.length > 0
                    ? `Acheter ${
                        selectedCartItems.length
                      } article${
                        selectedCartItems.length >
                        1
                          ? "s"
                          : ""
                      }`
                    : "Acheter tout le panier"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}