"use client";

import { FormEvent, useEffect, useState } from "react";

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
      const token =
        localStorage.getItem("token");

      const storedUser =
        localStorage.getItem("user");

      console.log(
        "Utilisateur connecté :",
        storedUser
      );

      if (!token) {
        setError(
          "Vous devez être connecté."
        );
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${API_URL}/shop`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      console.log(
        "GET /api/shop - statut :",
        response.status
      );

      console.log(
        "GET /api/shop - réponse :",
        data
      );

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
      console.error(
        "Erreur boutique :",
        err
      );

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
      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Vous devez être connecté."
        );
        return;
      }

      const response = await fetch(
        `${API_URL}/shop`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: name.trim(),
            description:
              description.trim() || null,
          }),
        }
      );

      const data =
        await response.json();

      console.log(
        "POST /api/shop - statut :",
        response.status
      );

      console.log(
        "POST /api/shop - réponse :",
        data
      );

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
    const { name, value } =
      e.target;

    setProductForm(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
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
      const token =
        localStorage.getItem("token");

      const storedUser =
        localStorage.getItem("user");

      console.log(
        "========== AJOUT PRODUIT =========="
      );

      console.log(
        "Utilisateur :",
        storedUser
      );

      console.log(
        "Boutique actuelle :",
        shop
      );

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
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: productForm.name.trim(),
            description:
              productForm.description.trim() ||
              null,
            price: Number(
              productForm.price
            ),
            stock: Number(
              productForm.stock
            ),
          }),
        }
      );

      const data =
        await response.json();

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
          const errors = Object.values(
            data.errors
          )
            .flat()
            .map((message) =>
              String(message)
            )
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

      /*
       * Recharger la boutique pour
       * récupérer le nouveau produit.
       */
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
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-gray-400">
            Chargement de votre boutique...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        {/* TITRE */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-blue-500">
            Ma boutique
          </h1>

          <p className="mt-2 text-gray-400">
            Gérez votre boutique et ajoutez vos produits.
          </p>
        </div>

        {/* ERREUR BOUTIQUE */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* SUCCÈS BOUTIQUE */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
            {success}
          </div>
        )}

        {/* =========================
            PAS DE BOUTIQUE
           ========================= */}
        {!shop ? (
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8">

            <div className="mb-8">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 text-4xl">
                🏪
              </div>

              <h2 className="text-2xl font-bold">
                Créer ma boutique
              </h2>

              <p className="mt-2 text-gray-400">
                Créez votre boutique avant d'ajouter vos produits.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="name"
                  className="mb-2 block font-medium"
                >
                  Nom de la boutique
                </label>

                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) =>
                    setName(
                      e.target.value
                    )
                  }
                  placeholder="Ex : Japhet Shop"
                  required
                  className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="mb-2 block font-medium"
                >
                  Description
                </label>

                <textarea
                  id="description"
                  value={
                    description
                  }
                  onChange={(e) =>
                    setDescription(
                      e.target.value
                    )
                  }
                  placeholder="Présentez votre boutique..."
                  rows={5}
                  className="w-full resize-none rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating
                  ? "Création..."
                  : "Créer ma boutique"}
              </button>
            </form>
          </div>
        ) : (
          /* =========================
             BOUTIQUE EXISTANTE
             ========================= */
          <div className="space-y-8">

            {/* INFORMATIONS BOUTIQUE */}
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8">

              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 text-4xl">
                🏪
              </div>

              <h2 className="text-3xl font-bold">
                {shop.name}
              </h2>

              <p className="mt-4 text-gray-400">
                {shop.description ||
                  "Aucune description pour cette boutique."}
              </p>

              <div className="mt-8 border-t border-gray-800 pt-6">
                <p className="text-sm text-gray-500">
                  ID de la boutique
                </p>

                <p className="mt-1 font-semibold">
                  #{shop.id}
                </p>
              </div>
            </div>

            {/* =========================
                AJOUT PRODUIT
               ========================= */}
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8">

              <h2 className="mb-2 text-2xl font-bold">
                Ajouter un produit
              </h2>

              <p className="mb-6 text-sm text-gray-400">
                Le produit sera automatiquement associé à votre boutique.
              </p>

              {productError && (
                <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
                  {productError}
                </div>
              )}

              {productSuccess && (
                <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">
                  {productSuccess}
                </div>
              )}

              <form
                onSubmit={
                  handleProductSubmit
                }
                className="grid gap-6 md:grid-cols-2"
              >

                {/* NOM */}
                <div>
                  <label
                    htmlFor="product-name"
                    className="mb-2 block font-medium"
                  >
                    Nom du produit
                  </label>

                  <input
                    id="product-name"
                    name="name"
                    type="text"
                    value={
                      productForm.name
                    }
                    onChange={
                      handleProductChange
                    }
                    placeholder="Ex : Téléphone Samsung"
                    required
                    className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* PRIX */}
                <div>
                  <label
                    htmlFor="product-price"
                    className="mb-2 block font-medium"
                  >
                    Prix
                  </label>

                  <input
                    id="product-price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={
                      productForm.price
                    }
                    onChange={
                      handleProductChange
                    }
                    placeholder="Ex : 250000"
                    required
                    className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* STOCK */}
                <div>
                  <label
                    htmlFor="product-stock"
                    className="mb-2 block font-medium"
                  >
                    Stock
                  </label>

                  <input
                    id="product-stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={
                      productForm.stock
                    }
                    onChange={
                      handleProductChange
                    }
                    placeholder="Ex : 10"
                    required
                    className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* DESCRIPTION */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="product-description"
                    className="mb-2 block font-medium"
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
                    onChange={
                      handleProductChange
                    }
                    placeholder="Description du produit..."
                    className="w-full resize-none rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
                  />
                </div>

                {/* BOUTON */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={
                      creatingProduct
                    }
                    className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingProduct
                      ? "Ajout du produit..."
                      : "Ajouter le produit"}
                  </button>
                </div>

              </form>
            </div>

            {/* =========================
                MES PRODUITS
               ========================= */}
            <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8">

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <h2 className="text-2xl font-bold">
                    Mes produits
                  </h2>

                  <p className="mt-1 text-gray-400">
                    Produits présents dans votre boutique.
                  </p>
                </div>

                <span className="rounded-full bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-400">
                  {shop.products?.length ||
                    0}{" "}
                  produit
                  {(shop.products?.length ||
                    0) > 1
                    ? "s"
                    : ""}
                </span>
              </div>

              {!shop.products ||
              shop.products.length === 0 ? (
                <div className="rounded-xl border border-gray-800 bg-black p-8 text-center">
                  <p className="text-gray-400">
                    Aucun produit dans votre boutique pour le moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                  {shop.products.map(
                    (product) => (
                      <div
                        key={
                          product.id
                        }
                        className="rounded-xl border border-gray-800 bg-black p-5"
                      >

                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/20 text-2xl">
                          📦
                        </div>

                        <h3 className="text-xl font-bold">
                          {
                            product.name
                          }
                        </h3>

                        <p className="mt-2 text-sm text-gray-400">
                          {
                            product.description ||
                            "Aucune description."
                          }
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-4">

                          <div>
                            <p className="text-xs text-gray-500">
                              Prix
                            </p>

                            <p className="font-bold text-blue-400">
                              {Number(
                                product.price
                              ).toLocaleString(
                                "fr-FR"
                              )}{" "}
                              FCFA
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs text-gray-500">
                              Stock
                            </p>

                            <p
                              className={
                                product.stock >
                                0
                                  ? "font-semibold text-green-400"
                                  : "font-semibold text-red-400"
                              }
                            >
                              {
                                product.stock
                              }
                            </p>
                          </div>

                        </div>
                      </div>
                    )
                  )}

                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}