"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AnimatedContainer from "@/app/components/AnimatedContainer";

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

interface User {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export default function PanierPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [updatingItem, setUpdatingItem] =
    useState<number | null>(null);
  const [removingItem, setRemovingItem] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [user, setUser] = useState<User | null>(null);

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

      const response = await fetch(
        `${API_URL}/cart`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        setUser(null);
      }
    }

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
    if (newQuantity === 0) {
      await removeItem(item.id);
      return;
    }

    if (newQuantity < 0) {
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
        setError("Une erreur est survenue.");
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
        setError("Une erreur est survenue.");
      }
    } finally {
      setRemovingItem(null);
      setUpdatingItem(null);
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
    const productsToBuy =
      selectedCartItems.length > 0
        ? selectedCartItems
        : items;

    if (productsToBuy.length === 0) {
      setError("Votre panier est vide.");
      return;
    }

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

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

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

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible d'effectuer l'achat."
        );
      }

      if (!data.order) {
        throw new Error(
          "Laravel n'a pas retourné la commande créée."
        );
      }

      setSelectedItems([]);

      setSuccess(
        `Achat effectué avec succès ! Commande #${data.order.id}.`
      );

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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#020407] text-white">

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/[0.08] blur-[120px]" />

        <AnimatedContainer>

          <div className="relative text-center">

            <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-400 border-r-blue-400 shadow-[0_0_25px_rgba(37,99,235,0.3)]" />

            <p className="text-sm text-zinc-500">
              Chargement du panier...
            </p>

          </div>

        </AnimatedContainer>

      </main>
    );
  }

  // =========================
  // AFFICHAGE
  // =========================

  return (
    <main className="min-h-screen bg-[#020407] text-white">

      {/* =====================================================
          BACKGROUND ELECTRIC
      ====================================================== */}

      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">

        <div className="absolute left-[-15%] top-[-10%] h-[500px] w-[500px] rounded-full bg-blue-600/[0.08] blur-[140px]" />

        <div className="absolute right-[-10%] top-[30%] h-[450px] w-[450px] rounded-full bg-cyan-400/[0.05] blur-[140px]" />

        <div className="absolute bottom-[-15%] left-[30%] h-[450px] w-[450px] rounded-full bg-blue-500/[0.06] blur-[140px]" />

      </div>

      {/* =====================================================
          NAVIGATION SHOPX
      ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-blue-400/10 bg-[#020407]/95 backdrop-blur-2xl">

        <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-4 md:px-8">

          {/* LOGO */}

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3"
          >

            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-blue-400/40 bg-blue-500/10 shadow-[0_0_25px_rgba(37,99,235,0.2)]">

              <span className="text-lg font-black italic text-blue-400">
                X
              </span>

              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition duration-700 group-hover:translate-x-full" />

            </div>

            <div className="hidden sm:block">

              <span className="block text-lg font-black tracking-wider">
                SHOP
                <span className="text-blue-400">
                  X
                </span>
              </span>

              <span className="block text-[8px] uppercase tracking-[0.35em] text-zinc-600">
                Digital Store
              </span>

            </div>

          </Link>

          {/* NAVIGATION DESKTOP */}

          <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">

            <Link
              href="/"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-blue-500/5 hover:text-white"
            >
              Accueil
            </Link>

            <Link
              href="/Produits"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-blue-500/5 hover:text-white"
            >
              Produits
            </Link>

            <Link
              href="/Boutique"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-blue-500/5 hover:text-white"
            >
              Boutiques
            </Link>

            <Link
              href="/Commandes"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-blue-500/5 hover:text-white"
            >
              Commandes
            </Link>

            <Link
              href="/Messageries"
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-blue-500/5 hover:text-white"
            >
              Messages
            </Link>

            <Link
              href="/Panier"
              className="rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 shadow-[0_0_20px_rgba(37,99,235,0.1)]"
            >
              Panier
            </Link>

          </nav>

          {/* ACTIONS */}

          <div className="ml-auto flex items-center gap-2">

            {/* NOTIFICATIONS */}

            <Link
              href="/Notifications"
              className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-blue-400/40 hover:bg-blue-500/10 hover:text-blue-300 sm:flex"
              title="Notifications"
            >
              🔔
            </Link>

            {/* COMPTE */}

            <Link
              href="/Compte"
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-blue-400/30 hover:bg-blue-500/10"
            >

              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-[10px] font-black text-black shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                {user?.name
                  ?.charAt(0)
                  .toUpperCase() ?? "?"}
              </span>

              <span className="hidden text-sm font-semibold md:block">
                Mon compte
              </span>

            </Link>

          </div>

        </div>

        {/* NAVIGATION MOBILE */}

        <div className="border-t border-white/[0.04] xl:hidden">

          <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 py-2 md:px-8">

            <Link
              href="/"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Accueil
            </Link>

            <Link
              href="/Produits"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Produits
            </Link>

            <Link
              href="/Boutique"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Boutiques
            </Link>

            <Link
              href="/Commandes"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Commandes
            </Link>

            <Link
              href="/Messageries"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Messages
            </Link>

            <Link
              href="/Panier"
              className="shrink-0 rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-300"
            >
              Panier
            </Link>

            <Link
              href="/Notifications"
              className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500"
            >
              Notifications
            </Link>

          </nav>

        </div>

      </header>

      {/* =====================================================
          CONTENU
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">

        {/* =================================================
            TITRE
        ================================================== */}

        <AnimatedContainer>

          <section className="relative mb-8 overflow-hidden rounded-3xl border border-blue-400/10 bg-gradient-to-br from-blue-500/[0.07] via-[#05070a] to-cyan-400/[0.04] p-7 shadow-[0_0_50px_rgba(37,99,235,0.04)] md:p-9">

            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.08] blur-[100px]" />

            <div className="relative">

              <div className="mb-4 flex items-center gap-2">

                <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400 shadow-[0_0_14px_rgba(37,99,235,0.9)]" />

                <span className="text-xs font-black uppercase tracking-[0.3em] text-blue-400">
                  SHOPX CHECKOUT
                </span>

              </div>

              <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">

                <div>

                  <h1 className="text-4xl font-black tracking-tight md:text-5xl">

                    Mon{" "}

                    <span className="bg-gradient-to-r from-blue-300 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                      panier
                    </span>

                  </h1>

                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
                    Vérifiez vos articles, ajustez les
                    quantités et passez votre commande.
                  </p>

                </div>

                <div className="rounded-2xl border border-blue-400/15 bg-blue-500/[0.04] px-5 py-4">

                  <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                    Articles
                  </p>

                  <p className="mt-1 text-2xl font-black text-blue-300">
                    {items.length}
                  </p>

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

            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/[0.06] p-4 text-sm text-red-300 shadow-[0_0_25px_rgba(239,68,68,0.04)]">
              {error}
            </div>

          </AnimatedContainer>
        )}

        {/* =================================================
            SUCCÈS
        ================================================== */}

        {success && (
          <AnimatedContainer delay={0.1}>

            <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-sm text-emerald-300">
              {success}
            </div>

          </AnimatedContainer>
        )}

        {/* =================================================
            PANIER VIDE
        ================================================== */}

        {items.length === 0 ? (

          <AnimatedContainer delay={0.2}>

            <div className="rounded-3xl border border-white/[0.08] bg-[#05070a] p-14 text-center shadow-[0_0_40px_rgba(0,0,0,0.3)]">

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-400/20 bg-blue-500/[0.06] text-3xl shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                🛒
              </div>

              <h2 className="text-2xl font-black">
                Votre panier est vide
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
                Découvrez notre catalogue et ajoutez
                vos produits préférés à votre panier.
              </p>

              <Link
                href="/Produits"
                className="mt-7 inline-flex rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 px-7 py-3.5 text-sm font-black text-white shadow-[0_0_25px_rgba(37,99,235,0.2)] transition hover:shadow-[0_0_40px_rgba(37,99,235,0.35)]"
              >
                Voir les produits
              </Link>

            </div>

          </AnimatedContainer>

        ) : (

          <div className="space-y-5">

            {/* =================================================
                BARRE SÉLECTION
            ================================================== */}

            <AnimatedContainer delay={0.15}>

              <div className="flex flex-col gap-4 rounded-2xl border border-white/[0.07] bg-[#05070a] p-4 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-400/15 bg-blue-500/[0.06] text-blue-300">
                    ✓
                  </div>

                  <div>

                    <p className="text-sm font-bold">
                      Sélection des articles
                    </p>

                    <p className="text-xs text-zinc-600">
                      {selectedItems.length > 0
                        ? `${selectedItems.length} article(s) sélectionné(s)`
                        : "Tous les articles seront achetés"}
                    </p>

                  </div>

                </div>

                <button
                  type="button"
                  onClick={toggleSelectAll}
                  disabled={buying}
                  className="rounded-xl border border-blue-400/20 bg-blue-500/[0.04] px-4 py-2.5 text-xs font-bold text-blue-300 transition hover:border-blue-400/40 hover:bg-blue-500/[0.08] disabled:opacity-40"
                >
                  {selectedItems.length ===
                    items.length
                    ? "Tout désélectionner"
                    : "Tout sélectionner"}
                </button>

              </div>

            </AnimatedContainer>

            {/* =================================================
                ARTICLES
            ================================================== */}

            {items.map((item, index) => {

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
                <AnimatedContainer
                  key={item.id}
                  delay={
                    0.2 +
                    index * 0.07
                  }
                >

                  <article
                    className={`group relative overflow-hidden rounded-3xl border bg-[#05070a] transition duration-300 ${
                      isSelected
                        ? "border-blue-400/40 shadow-[0_0_35px_rgba(37,99,235,0.08)]"
                        : "border-white/[0.08] hover:border-blue-400/20"
                    }`}
                  >

                    {/* LIGNE ÉLECTRIQUE */}

                    <div
                      className={`absolute left-0 right-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent transition ${
                        isSelected
                          ? "opacity-100"
                          : "opacity-30 group-hover:opacity-80"
                      }`}
                    />

                    {/* GLOW */}

                    <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/[0.05] blur-[70px] transition group-hover:bg-blue-500/[0.1]" />

                    <div className="relative flex flex-col gap-5 p-5 md:flex-row md:items-center md:p-6">

                      {/* CHECKBOX */}

                      <div className="flex items-center">

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
                          className="h-5 w-5 cursor-pointer appearance-none rounded-md border border-white/20 bg-black transition checked:border-blue-400 checked:bg-blue-500 checked:shadow-[0_0_12px_rgba(37,99,235,0.5)] disabled:cursor-not-allowed disabled:opacity-40"
                        />

                      </div>

                      {/* ICÔNE PRODUIT */}

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-blue-400/15 bg-gradient-to-br from-blue-500/10 to-cyan-400/[0.03] text-2xl text-blue-300">
                        ◈
                      </div>

                      {/* PRODUIT */}

                      <div className="min-w-0 flex-1">

                        <h2 className="truncate text-xl font-black">
                          {item.product.name}
                        </h2>

                        {item.product
                          .description && (
                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-zinc-600">
                            {
                              item.product
                                .description
                            }
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-3">

                          <span className="text-sm font-black text-blue-300">
                            {Number(
                              item.product.price
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}
                            <span className="text-cyan-400">
                              FCFA
                            </span>
                          </span>

                          <span className="h-1 w-1 rounded-full bg-zinc-700" />

                          <span className="text-xs text-zinc-600">
                            Stock :{" "}
                            <span className="text-emerald-400">
                              {item.product.stock}
                            </span>
                          </span>

                        </div>

                      </div>

                      {/* QUANTITÉ */}

                      <div className="flex items-center rounded-xl border border-white/[0.07] bg-black/40 p-1">

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(
                              item,
                              item.quantity - 1
                            )
                          }
                          disabled={
                            isUpdating ||
                            buying ||
                            isRemoving
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-400 transition hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-30"
                          title={
                            item.quantity === 1
                              ? "Retirer l'article du panier"
                              : "Diminuer la quantité"
                          }
                        >
                          −
                        </button>

                        <span className="flex w-10 justify-center text-sm font-black text-white">
                          {isUpdating ||
                          isRemoving
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
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-lg text-zinc-400 transition hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          +
                        </button>

                      </div>

                      {/* SOUS-TOTAL */}

                      <div className="w-full md:w-36 md:text-right">

                        <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-600">
                          Sous-total
                        </p>

                        <p className="mt-1 text-lg font-black text-white">
                          {itemTotal.toLocaleString(
                            "fr-FR"
                          )}{" "}
                          <span className="text-xs font-bold text-cyan-400">
                            FCFA
                          </span>
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
                          buying ||
                          isUpdating
                        }
                        className="rounded-xl border border-red-400/10 bg-red-500/[0.03] px-3 py-2 text-sm text-red-400 transition hover:border-red-400/30 hover:bg-red-500/[0.08] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {isRemoving
                          ? "Suppression..."
                          : "🗑️"}
                      </button>

                    </div>

                  </article>

                </AnimatedContainer>
              );
            })}

            {/* =================================================
                RÉSUMÉ
            ================================================== */}

            <AnimatedContainer
              delay={
                0.2 +
                items.length * 0.07
              }
            >

              <section className="relative mt-8 overflow-hidden rounded-3xl border border-blue-400/15 bg-gradient-to-br from-blue-500/[0.07] via-[#05070a] to-cyan-400/[0.03] p-6 shadow-[0_0_50px_rgba(37,99,235,0.05)] md:p-8">

                <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/[0.07] blur-[100px]" />

                <div className="relative">

                  <div className="mb-7 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">

                    <div>

                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">
                        RÉCAPITULATIF
                      </p>

                      <p className="mt-2 text-sm text-zinc-500">
                        {selectedCartItems.length > 0
                          ? `${selectedCartItems.length} article(s) sélectionné(s)`
                          : "Tout le panier sera acheté"}
                      </p>

                    </div>

                    <div className="sm:text-right">

                      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        Total
                      </p>

                      <p className="mt-1 text-3xl font-black text-blue-300">
                        {total.toLocaleString(
                          "fr-FR"
                        )}{" "}
                        <span className="text-sm text-cyan-400">
                          FCFA
                        </span>
                      </p>

                    </div>

                  </div>

                  {/* BOUTON ACHAT */}

                  <button
                    type="button"
                    onClick={buySelectedItems}
                    disabled={
                      items.length === 0 ||
                      buying
                    }
                    className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 py-4 text-sm font-black text-white shadow-[0_0_30px_rgba(37,99,235,0.2)] transition hover:shadow-[0_0_45px_rgba(37,99,235,0.4)] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:bg-none disabled:text-zinc-500 disabled:shadow-none"
                  >

                    <span className="relative z-10">

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

                    </span>

                  </button>

                </div>

              </section>

            </AnimatedContainer>

          </div>
        )}

      </div>

    </main>
  );
}