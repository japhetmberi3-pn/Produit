"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface Product {
  id: number;
  user_id: number;
  shop_id: number;
  name: string;
  description?: string | null;
  price: number;
  stock: number;
  created_at?: string;
  updated_at?: string;
}

interface Shop {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  products?: Product[];
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function MaBoutiquePage() {
  const [shop, setShop] = useState<Shop | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [productForm, setProductForm] =
    useState<ProductForm>({
      name: "",
      description: "",
      price: "",
      stock: "",
    });

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [creatingProduct, setCreatingProduct] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [productError, setProductError] =
    useState("");
  const [productSuccess, setProductSuccess] =
    useState("");

  /**
   * =========================
   * RÉCUPÉRER LA BOUTIQUE
   * =========================
   */
  const fetchShop = async () => {
    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      console.log("Utilisateur connecté :", storedUser);

      if (!token) {
        setError("Vous devez être connecté.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/shop`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      console.log(
        "GET /api/shop - statut :",
        response.status
      );

      console.log(
        "GET /api/shop - réponse :",
        data
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (response.status === 404) {
        setShop(null);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer votre boutique."
        );
      }

      setShop(data);
    } catch (err) {
      console.error("Erreur boutique :", err);

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer votre boutique."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShop();
  }, []);

  /**
   * =========================
   * CRÉER LA BOUTIQUE
   * =========================
   */
  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setCreating(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("Vous devez être connecté.");
        return;
      }

      const response = await fetch(`${API_URL}/shop`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
        }),
      });

      const data = await response.json();

      console.log(
        "POST /api/shop - statut :",
        response.status
      );

      console.log(
        "POST /api/shop - réponse :",
        data
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de créer la boutique."
        );
      }

      setShop(data.shop);

      setName("");
      setDescription("");

      setSuccess(
        "Votre boutique a été créée avec succès."
      );
    } catch (err) {
      console.error(
        "Erreur création boutique :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setCreating(false);
    }
  };

  /**
   * =========================
   * CHANGEMENT FORMULAIRE PRODUIT
   * =========================
   */
  const handleProductChange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setProductForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  /**
   * =========================
   * AJOUTER UN PRODUIT
   * =========================
   */
  const handleProductSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setProductError("");
    setProductSuccess("");
    setCreatingProduct(true);

    try {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      console.log(
        "========== AJOUT PRODUIT =========="
      );

      console.log("Utilisateur :", storedUser);
      console.log("Boutique actuelle :", shop);

      if (!token) {
        setProductError(
          "Vous devez être connecté."
        );
        return;
      }

      if (!shop) {
        setProductError(
          "Vous devez d'abord créer votre boutique."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/products`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: productForm.name.trim(),
            description:
              productForm.description.trim() || null,
            price: Number(productForm.price),
            stock: Number(productForm.stock),
          }),
        }
      );

      const data = await response.json();

      console.log(
        "POST /api/products - statut :",
        response.status
      );

      console.log(
        "POST /api/products - réponse :",
        data
      );

      if (response.status === 401) {
        setProductError(
          "Votre session a expiré. Reconnectez-vous."
        );
        return;
      }

      if (response.status === 403) {
        setProductError(
          data.message ||
            "Vous n'avez pas le droit d'ajouter un produit."
        );
        return;
      }

      if (response.status === 422) {
        if (data.errors) {
          const errors = Object.values(data.errors)
            .flat()
            .map((message) => String(message))
            .join(" ");

          setProductError(errors);
        } else {
          setProductError(
            data.message ||
              "Les données envoyées sont invalides."
          );
        }

        return;
      }

      if (!response.ok) {
        setProductError(
          data.message ||
            "Impossible d'ajouter le produit."
        );
        return;
      }

      setProductForm({
        name: "",
        description: "",
        price: "",
        stock: "",
      });

      setProductSuccess(
        "Produit ajouté à votre boutique avec succès."
      );

      await fetchShop();
    } catch (err) {
      console.error(
        "Erreur ajout produit :",
        err
      );

      setProductError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue."
      );
    } finally {
      setCreatingProduct(false);
    }
  };

  /**
   * =========================
   * CHARGEMENT
   * =========================
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <AnimatedContainer>
            <div className="text-center">
              <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-gray-800 border-t-blue-500" />

              <p className="text-gray-400">
                Chargement de votre boutique...
              </p>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    );
  }

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
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20">
              <span className="text-xl font-black">
                X
              </span>
            </div>

            <span className="text-2xl font-black">
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
              className="text-sm text-gray-400 transition hover:text-white"
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
              href="/MaBoutique"
              className="text-sm font-semibold text-blue-400"
            >
              Ma boutique
            </Link>

            <Link
              href="/Compte"
              className="text-sm text-gray-400 transition hover:text-white"
            >
              Mon compte
            </Link>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/Boutique"
              className="hidden rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:border-blue-500 hover:text-white sm:block"
            >
              Boutiques
            </Link>

            <Link
              href="/Produits"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold shadow-lg shadow-blue-600/20 transition hover:bg-blue-500"
            >
              Catalogue
            </Link>
          </div>
        </div>
      </nav>

      {/* =========================
          CONTENU
      ========================== */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* HEADER */}
        <AnimatedContainer>
          <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950/40 via-gray-950 to-violet-950/30 p-8 md:p-12">
            <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />

            <div className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

            <div className="relative">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-blue-400">
                <span>✦</span>
                Espace vendeur
              </div>

              <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                Ma{" "}
                <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent">
                  boutique
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400 md:text-lg">
                Gérez votre boutique, ajoutez vos produits et
                développez votre activité sur ShopX.
              </p>

              {shop && (
                <div className="mt-7 flex flex-wrap gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-3">
                    <span className="text-xs text-gray-500">
                      Produits
                    </span>

                    <p className="mt-1 text-xl font-bold">
                      {shop.products?.length || 0}
                    </p>
                  </div>

                  <div className="rounded-xl border border-green-500/20 bg-green-500/10 px-5 py-3">
                    <span className="text-xs text-green-500/70">
                      Statut
                    </span>

                    <p className="mt-1 text-sm font-bold text-green-400">
                      ● Active
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </AnimatedContainer>

        {/* ERREUR */}
        {error && (
          <AnimatedContainer delay={0.1}>
            <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
              <div className="flex items-start gap-3">
                <span className="text-xl">⚠️</span>

                <div>
                  <p className="font-semibold">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* SUCCÈS */}
        {success && (
          <AnimatedContainer delay={0.1}>
            <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-green-400">
              <div className="flex items-center gap-3">
                <span className="text-xl">✓</span>

                <p className="font-semibold">
                  {success}
                </p>
              </div>
            </div>
          </AnimatedContainer>
        )}

        {/* =========================
            PAS DE BOUTIQUE
        ========================== */}
        {!shop ? (
          <AnimatedContainer delay={0.2}>
            <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-gradient-to-b from-gray-950 to-black p-8 shadow-2xl md:p-10">
              <div className="mb-8">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 to-violet-500/10 text-4xl shadow-lg shadow-blue-500/10">
                  🏪
                </div>

                <div className="mb-2 text-sm font-bold uppercase tracking-widest text-blue-500">
                  Première étape
                </div>

                <h2 className="text-3xl font-bold">
                  Créer ma boutique
                </h2>

                <p className="mt-3 leading-7 text-gray-400">
                  Donnez un nom à votre boutique et présentez-la
                  à vos futurs clients.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Nom de la boutique
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    placeholder="Ex : Japhet Shop"
                    required
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    Description
                  </label>

                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) =>
                      setDescription(
                        e.target.value
                      )
                    }
                    placeholder="Présentez votre boutique..."
                    rows={5}
                    className="w-full resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-6 py-4 font-bold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creating
                    ? "Création de la boutique..."
                    : "Créer ma boutique →"}
                </button>
              </form>
            </div>
          </AnimatedContainer>
        ) : (
          <div className="space-y-8">
            {/* =========================
                INFOS BOUTIQUE
            ========================== */}
            <AnimatedContainer delay={0.2}>
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-gray-950 to-black p-8">
                <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-600/10 blur-3xl" />

                <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 text-4xl">
                      🏪
                    </div>

                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <span className="rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400">
                          ● Active
                        </span>

                        <span className="text-xs text-gray-500">
                          Boutique #{shop.id}
                        </span>
                      </div>

                      <h2 className="text-3xl font-black">
                        {shop.name}
                      </h2>

                      <p className="mt-2 max-w-xl text-gray-400">
                        {shop.description ||
                          "Aucune description pour cette boutique."}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/Boutique/${shop.id}`}
                    className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-3 text-center font-semibold text-blue-400 transition hover:bg-blue-500/20"
                  >
                    Voir ma boutique →
                  </Link>
                </div>
              </div>
            </AnimatedContainer>

            {/* =========================
                AJOUT PRODUIT
            ========================== */}
            <AnimatedContainer delay={0.3}>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-gray-950 to-black p-8">
                <div className="mb-8">
                  <div className="mb-3 text-sm font-bold uppercase tracking-widest text-blue-500">
                    Gestion des produits
                  </div>

                  <h2 className="text-3xl font-bold">
                    Ajouter un produit
                  </h2>

                  <p className="mt-2 text-gray-400">
                    Ajoutez un nouveau produit à votre boutique.
                  </p>
                </div>

                {productError && (
                  <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-red-400">
                    <div className="flex items-start gap-3">
                      <span>⚠️</span>

                      <p>{productError}</p>
                    </div>
                  </div>
                )}

                {productSuccess && (
                  <div className="mb-6 rounded-2xl border border-green-500/20 bg-green-500/10 p-5 text-green-400">
                    <div className="flex items-center gap-3">
                      <span>✓</span>

                      <p>{productSuccess}</p>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={handleProductSubmit}
                  className="grid gap-6 md:grid-cols-2"
                >
                  {/* NOM */}
                  <div>
                    <label
                      htmlFor="product-name"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Nom du produit
                    </label>

                    <input
                      id="product-name"
                      name="name"
                      type="text"
                      value={productForm.name}
                      onChange={handleProductChange}
                      placeholder="Ex : iPhone 15 Pro"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* PRIX */}
                  <div>
                    <label
                      htmlFor="product-price"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Prix
                    </label>

                    <div className="relative">
                      <input
                        id="product-price"
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={handleProductChange}
                        placeholder="250000"
                        required
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 pr-20 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                      />

                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                        FCFA
                      </span>
                    </div>
                  </div>

                  {/* STOCK */}
                  <div>
                    <label
                      htmlFor="product-stock"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Stock disponible
                    </label>

                    <input
                      id="product-stock"
                      name="stock"
                      type="number"
                      min="0"
                      value={productForm.stock}
                      onChange={handleProductChange}
                      placeholder="10"
                      required
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* DESCRIPTION */}
                  <div className="md:col-span-2">
                    <label
                      htmlFor="product-description"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Description
                    </label>

                    <textarea
                      id="product-description"
                      name="description"
                      rows={4}
                      value={
                        productForm.description
                      }
                      onChange={handleProductChange}
                      placeholder="Décrivez votre produit..."
                      className="w-full resize-none rounded-xl border border-white/10 bg-black/60 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                    />
                  </div>

                  {/* BOUTON */}
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={creatingProduct}
                      className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-4 font-bold shadow-xl shadow-blue-600/10 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {creatingProduct
                        ? "Ajout du produit..."
                        : "Ajouter le produit →"}
                    </button>
                  </div>
                </form>
              </div>
            </AnimatedContainer>

            {/* =========================
                MES PRODUITS
            ========================== */}
            <AnimatedContainer delay={0.4}>
              <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-gray-950 to-black p-8">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-widest text-blue-500">
                      Catalogue vendeur
                    </div>

                    <h2 className="mt-1 text-3xl font-bold">
                      Mes produits
                    </h2>

                    <p className="mt-2 text-gray-400">
                      Les produits actuellement présents dans votre boutique.
                    </p>
                  </div>

                  <div className="flex h-14 min-w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 text-lg font-bold text-blue-400">
                    {shop.products?.length || 0}
                  </div>
                </div>

                {!shop.products ||
                shop.products.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-black/50 p-10 text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                      📦
                    </div>

                    <h3 className="text-xl font-bold">
                      Aucun produit
                    </h3>

                    <p className="mt-2 text-gray-500">
                      Commencez par ajouter votre premier produit.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {shop.products.map(
                      (product, index) => (
                        <AnimatedContainer
                          key={product.id}
                          delay={
                            0.45 + index * 0.08
                          }
                        >
                          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-500/40 hover:shadow-xl hover:shadow-blue-500/5">
                            <div className="pointer-events-none absolute -right-16 -top-16 h-32 w-32 rounded-full bg-blue-600/10 blur-3xl transition group-hover:bg-blue-600/20" />

                            <div className="relative">
                              <div className="mb-5 flex items-start justify-between">
                                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10 text-2xl">
                                  📦
                                </div>

                                <span
                                  className={
                                    product.stock > 0
                                      ? "rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-400"
                                      : "rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400"
                                  }
                                >
                                  {product.stock > 0
                                    ? "En stock"
                                    : "Rupture"}
                                </span>
                              </div>

                              <h3 className="text-xl font-bold transition group-hover:text-blue-400">
                                {product.name}
                              </h3>

                              <p className="mt-2 min-h-[48px] text-sm leading-6 text-gray-500">
                                {product.description ||
                                  "Aucune description disponible."}
                              </p>

                              <div className="mt-6 grid grid-cols-2 gap-3">
                                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                                  <p className="text-xs text-gray-500">
                                    Prix
                                  </p>

                                  <p className="mt-1 font-bold text-blue-400">
                                    {Number(
                                      product.price
                                    ).toLocaleString(
                                      "fr-FR"
                                    )}{" "}
                                    FCFA
                                  </p>
                                </div>

                                <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
                                  <p className="text-xs text-gray-500">
                                    Stock
                                  </p>

                                  <p
                                    className={
                                      product.stock >
                                      0
                                        ? "mt-1 font-bold text-green-400"
                                        : "mt-1 font-bold text-red-400"
                                    }
                                  >
                                    {product.stock}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </AnimatedContainer>
                      )
                    )}
                  </div>
                )}
              </div>
            </AnimatedContainer>
          </div>
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

          <div className="flex flex-wrap gap-5">
            <Link
              href="/Produits"
              className="transition hover:text-blue-400"
            >
              Catalogue
            </Link>

            <Link
              href="/Boutique"
              className="transition hover:text-blue-400"
            >
              Boutiques
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