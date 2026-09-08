"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number | string;
  product?: Product | null;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  appointment_date?: string | null;
  appointment_time?: string | null;
  phone?: string | null;
  address?: string | null;
  message?: string | null;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function CommandesPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [quantity, setQuantity] = useState(1);

  // Informations du rendez-vous
  const [appointmentDate, setAppointmentDate] =
    useState("");

  const [appointmentTime, setAppointmentTime] =
    useState("");

  const [phone, setPhone] = useState("");

  const [address, setAddress] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /*
  |--------------------------------------------------------------------------
  | TOKEN
  |--------------------------------------------------------------------------
  */

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/");
  };

  /*
  |--------------------------------------------------------------------------
  | RÉCUPÉRER LES PRODUITS
  | GET /api/products
  |--------------------------------------------------------------------------
  */

  const fetchProducts = async () => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
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
        logout();
        return;
      }

      const data = await response.json();

      console.log("Produits reçus :", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer les produits."
        );
      }

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (Array.isArray(data.products)) {
        setProducts(data.products);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(
        "Erreur récupération produits :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les produits."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | RÉCUPÉRER LES COMMANDES
  | GET /api/orders
  |--------------------------------------------------------------------------
  */

  const fetchOrders = async () => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 401) {
        logout();
        return;
      }

      const data = await response.json();

      console.log("Commandes reçues :", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer les commandes."
        );
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (Array.isArray(data.orders)) {
        setOrders(data.orders);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error(
        "Erreur récupération commandes :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de récupérer les commandes."
      );
    }
  };

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT INITIAL
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/");
      return;
    }

    const load = async () => {
      setLoading(true);

      await Promise.all([
        fetchProducts(),
        fetchOrders(),
      ]);

      setLoading(false);
    };

    load();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | OUVRIR LE FORMULAIRE
  |--------------------------------------------------------------------------
  */

  const openOrderModal = (product: Product) => {
    setSelectedProduct(product);

    setQuantity(1);

    setAppointmentDate("");
    setAppointmentTime("");
    setPhone("");
    setAddress("");
    setMessage("");

    setError("");
    setSuccess("");
  };

  /*
  |--------------------------------------------------------------------------
  | FERMER LE FORMULAIRE
  |--------------------------------------------------------------------------
  */

  const closeOrderModal = () => {
    if (buying) {
      return;
    }

    setSelectedProduct(null);

    setQuantity(1);

    setAppointmentDate("");
    setAppointmentTime("");
    setPhone("");
    setAddress("");
    setMessage("");
  };

  /*
  |--------------------------------------------------------------------------
  | CRÉER LA COMMANDE
  | POST /api/orders
  |--------------------------------------------------------------------------
  */

  const handleOrder = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    if (!selectedProduct) {
      setError(
        "Veuillez sélectionner un produit."
      );
      return;
    }

    if (quantity < 1) {
      setError(
        "La quantité doit être supérieure à 0."
      );
      return;
    }

    if (quantity > selectedProduct.stock) {
      setError(
        `Stock insuffisant. Il reste ${selectedProduct.stock} produit(s).`
      );
      return;
    }

    if (!appointmentDate) {
      setError(
        "Veuillez sélectionner une date de rendez-vous."
      );
      return;
    }

    if (!appointmentTime) {
      setError(
        "Veuillez sélectionner une heure de rendez-vous."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Veuillez renseigner votre numéro de téléphone."
      );
      return;
    }

    if (!address.trim()) {
      setError(
        "Veuillez renseigner l'adresse."
      );
      return;
    }

    setBuying(true);

    try {
      /*
       * DONNÉES ENVOYÉES À LARAVEL
       */
      const orderData = {
        items: [
          {
            product_id: selectedProduct.id,
            quantity: quantity,
          },
        ],

        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        phone: phone.trim(),
        address: address.trim(),
        message: message.trim() || null,
      };

      console.log(
        "================================="
      );

      console.log(
        "📦 COMMANDE + RENDEZ-VOUS"
      );

      console.log(orderData);

      console.log(
        "================================="
      );

      const response = await fetch(
        `${API_URL}/orders`,
        {
          method: "POST",

          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(orderData),
        }
      );

      const data = await response.json();

      console.log(
        "📡 Status Laravel :",
        response.status
      );

      console.log(
        "📡 Réponse Laravel :",
        data
      );

      /*
       * TOKEN EXPIRÉ
       */

      if (response.status === 401) {
        logout();
        return;
      }

      /*
       * ERREUR LARAVEL
       */

      if (!response.ok) {

        if (data.errors) {
          const firstError =
            Object.values(data.errors)[0];

          if (
            Array.isArray(firstError) &&
            firstError.length > 0
          ) {
            throw new Error(
              String(firstError[0])
            );
          }
        }

        throw new Error(
          data.message ||
            `Erreur Laravel ${response.status}`
        );
      }

      /*
       * VÉRIFIER LA COMMANDE
       */

      if (!data.order) {
        throw new Error(
          "Laravel n'a pas retourné la commande."
        );
      }

      /*
       * AJOUTER LA COMMANDE
       */

      setOrders((currentOrders) => [
        data.order,
        ...currentOrders,
      ]);

      /*
       * METTRE À JOUR LE STOCK
       */

      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === selectedProduct.id
            ? {
                ...product,
                stock:
                  product.stock - quantity,
              }
            : product
        )
      );

      /*
       * MESSAGE DE SUCCÈS
       */

      setSuccess(
        `Commande #${data.order.id} créée avec succès ! Rendez-vous prévu le ${new Date(
          appointmentDate
        ).toLocaleDateString("fr-FR")} à ${appointmentTime}.`
      );

      /*
       * FERMER LE FORMULAIRE
       */

      setSelectedProduct(null);

      setQuantity(1);

      setAppointmentDate("");
      setAppointmentTime("");
      setPhone("");
      setAddress("");
      setMessage("");

    } catch (err) {

      console.error(
        "Erreur création commande :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de la création de la commande."
      );

    } finally {
      setBuying(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | STATUT
  |--------------------------------------------------------------------------
  */

  const getStatusLabel = (
    status: string
  ) => {
    switch (status) {

      case "pending":
        return "En attente";

      case "confirmed":
        return "Confirmée";

      case "shipped":
        return "Expédiée";

      case "delivered":
        return "Livrée";

      case "cancelled":
        return "Annulée";

      case "completed":
        return "Terminée";

      default:
        return status;
    }
  };

  /*
  |--------------------------------------------------------------------------
  | COULEUR STATUT
  |--------------------------------------------------------------------------
  */

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {

      case "pending":
        return "bg-yellow-500/20 text-yellow-400";

      case "confirmed":
        return "bg-blue-500/20 text-blue-400";

      case "shipped":
        return "bg-indigo-500/20 text-indigo-400";

      case "delivered":
      case "completed":
        return "bg-green-500/20 text-green-400";

      case "cancelled":
        return "bg-red-500/20 text-red-400";

      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  const calculateTotal = (
    order: Order
  ) => {

    if (!Array.isArray(order.items)) {
      return 0;
    }

    return order.items.reduce(
      (total, item) =>
        total +
        Number(item.price) *
          Number(item.quantity),
      0
    );
  };

  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">

        <div className="flex min-h-[60vh] items-center justify-center">

          <p className="text-lg text-gray-400">
            Chargement...
          </p>

        </div>

      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">

      <div className="mx-auto max-w-6xl">

        {/* TITRE */}

        <div className="mb-8">

          <h1 className="text-3xl font-bold text-blue-400">
            Commandes
          </h1>

          <p className="mt-2 text-gray-400">
            Choisissez un produit et prenez rendez-vous pour votre commande.
          </p>

        </div>

        {/* ERREUR */}

        {error && (

          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">

            {error}

          </div>

        )}

        {/* SUCCÈS */}

        {success && (

          <div className="mb-6 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-green-400">

            {success}

          </div>

        )}

        {/* PRODUITS */}

        <section>

          <h2 className="mb-5 text-2xl font-semibold">
            Produits disponibles
          </h2>

          {products.length === 0 ? (

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">

              <div className="mb-4 text-5xl">
                🛍️
              </div>

              <h3 className="text-xl font-semibold">
                Aucun produit disponible
              </h3>

              <p className="mt-2 text-gray-400">
                Aucun produit n'est actuellement disponible.
              </p>

            </div>

          ) : (

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {products.map((product) => (

                <article
                  key={product.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl transition hover:border-blue-500/40"
                >

                  <h3 className="text-xl font-bold">
                    {product.name}
                  </h3>

                  <p className="mt-2 min-h-[24px] text-sm text-gray-400">
                    {product.description ||
                      "Aucune description."}
                  </p>

                  <div className="my-5 flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Prix
                      </p>

                      <p className="text-xl font-bold text-blue-400">

                        {Number(
                          product.price
                        ).toLocaleString(
                          "fr-FR"
                        )}{" "}

                        FCFA

                      </p>

                    </div>

                    <div className="text-right">

                      <p className="text-sm text-gray-500">
                        Stock
                      </p>

                      <p
                        className={
                          product.stock > 0
                            ? "font-semibold text-green-400"
                            : "font-semibold text-red-400"
                        }
                      >
                        {product.stock}
                      </p>

                    </div>

                  </div>

                  <button
                    type="button"
                    disabled={product.stock <= 0}
                    onClick={() =>
                      openOrderModal(product)
                    }
                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                  >
                    {product.stock > 0
                      ? "Commander"
                      : "Rupture de stock"}
                  </button>

                </article>

              ))}

            </div>

          )}

        </section>

        {/* MES COMMANDES */}

        <section className="mt-12">

          <h2 className="mb-5 text-2xl font-semibold">
            Mes commandes
          </h2>

          {orders.length === 0 ? (

            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">

              <div className="mb-4 text-5xl">
                📦
              </div>

              <h3 className="text-xl font-semibold">
                Aucune commande
              </h3>

              <p className="mt-2 text-gray-400">
                Vous n'avez encore effectué aucune commande.
              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {orders.map((order) => (

                <div
                  key={order.id}
                  className="rounded-2xl border border-gray-800 bg-gray-900 p-6"
                >

                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                    <div>

                      <h3 className="text-xl font-semibold">
                        Commande #{order.id}
                      </h3>

                      <p className="mt-1 text-sm text-gray-400">

                        {new Date(
                          order.created_at
                        ).toLocaleDateString(
                          "fr-FR"
                        )}

                      </p>

                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-sm font-medium ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {getStatusLabel(
                        order.status
                      )}
                    </span>

                  </div>

                  <div className="space-y-3">

                    {order.items?.map((item) => (

                      <div
                        key={item.id}
                        className="flex flex-col gap-2 border-b border-gray-800 pb-3 sm:flex-row sm:items-center sm:justify-between"
                      >

                        <div>

                          <p className="font-medium">
                            {item.product?.name ||
                              `Produit #${item.product_id}`}
                          </p>

                          <p className="text-sm text-gray-400">
                            Quantité :{" "}
                            {item.quantity}
                          </p>

                          <p className="text-sm text-gray-500">

                            Prix unitaire :{" "}

                            {Number(
                              item.price
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}

                            FCFA

                          </p>

                        </div>

                        <p className="font-semibold text-blue-400">

                          {(
                            Number(item.price) *
                            Number(item.quantity)
                          ).toLocaleString(
                            "fr-FR"
                          )}{" "}

                          FCFA

                        </p>

                      </div>

                    ))}

                  </div>

                  {/* RENDEZ-VOUS */}

                  {order.appointment_date && (

                    <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                      <h4 className="mb-3 font-semibold text-blue-400">
                        📅 Rendez-vous
                      </h4>

                      <div className="grid gap-2 text-sm text-gray-300 md:grid-cols-2">

                        <p>
                          <span className="text-gray-500">
                            Date :
                          </span>{" "}
                          {new Date(
                            order.appointment_date
                          ).toLocaleDateString(
                            "fr-FR"
                          )}
                        </p>

                        <p>
                          <span className="text-gray-500">
                            Heure :
                          </span>{" "}
                          {order.appointment_time}
                        </p>

                        {order.phone && (

                          <p>
                            <span className="text-gray-500">
                              Téléphone :
                            </span>{" "}
                            {order.phone}
                          </p>

                        )}

                        {order.address && (

                          <p>
                            <span className="text-gray-500">
                              Adresse :
                            </span>{" "}
                            {order.address}
                          </p>

                        )}

                      </div>

                      {order.message && (

                        <p className="mt-3 text-sm text-gray-400">

                          <span className="text-gray-500">
                            Remarque :
                          </span>{" "}

                          {order.message}

                        </p>

                      )}

                    </div>

                  )}

                  <div className="mt-5 border-t border-gray-800 pt-5">

                    <span className="text-gray-400">
                      Total :
                    </span>{" "}

                    <span className="text-xl font-bold text-blue-400">

                      {calculateTotal(
                        order
                      ).toLocaleString(
                        "fr-FR"
                      )}{" "}

                      FCFA

                    </span>

                  </div>

                </div>

              ))}

            </div>

          )}

        </section>

      </div>

      {/* ========================================================= */}
      {/* FORMULAIRE DE COMMANDE + RENDEZ-VOUS */}
      {/* ========================================================= */}

      {selectedProduct && (

        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-8">

          <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-7 shadow-2xl">

            {/* HEADER */}

            <div className="mb-6">

              <h2 className="text-2xl font-bold text-blue-400">
                Passer une commande
              </h2>

              <p className="mt-2 text-gray-400">
                Complétez les informations de votre commande et de votre rendez-vous.
              </p>

            </div>

            {/* PRODUIT */}

            <div className="mb-6 rounded-xl border border-gray-800 bg-gray-800/50 p-4">

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="font-semibold">
                    {selectedProduct.name}
                  </p>

                  <p className="mt-1 text-sm text-gray-400">

                    Prix unitaire :{" "}

                    {Number(
                      selectedProduct.price
                    ).toLocaleString(
                      "fr-FR"
                    )}{" "}

                    FCFA

                  </p>

                </div>

                <p className="text-sm text-gray-400">

                  Stock :{" "}
                  {selectedProduct.stock}

                </p>

              </div>

            </div>

            <form
              onSubmit={handleOrder}
              className="space-y-5"
            >

              {/* QUANTITÉ */}

              <div>

                <label
                  htmlFor="quantity"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  Quantité
                </label>

                <input
                  id="quantity"
                  type="number"
                  min="1"
                  max={selectedProduct.stock}
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Number(event.target.value)
                    )
                  }
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* DATE */}

              <div>

                <label
                  htmlFor="appointment_date"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  📅 Date du rendez-vous
                </label>

                <input
                  id="appointment_date"
                  type="date"
                  value={appointmentDate}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(event) =>
                    setAppointmentDate(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* HEURE */}

              <div>

                <label
                  htmlFor="appointment_time"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  🕐 Heure du rendez-vous
                </label>

                <input
                  id="appointment_time"
                  type="time"
                  value={appointmentTime}
                  onChange={(event) =>
                    setAppointmentTime(
                      event.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* TÉLÉPHONE */}

              <div>

                <label
                  htmlFor="phone"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  📞 Téléphone
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(
                      event.target.value
                    )
                  }
                  placeholder="Ex : 06 123 45 67"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* ADRESSE */}

              <div>

                <label
                  htmlFor="address"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  📍 Adresse
                </label>

                <input
                  id="address"
                  type="text"
                  value={address}
                  onChange={(event) =>
                    setAddress(
                      event.target.value
                    )
                  }
                  placeholder="Votre adresse"
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* MESSAGE */}

              <div>

                <label
                  htmlFor="message"
                  className="mb-2 block text-sm font-medium text-gray-300"
                >
                  📝 Remarque
                </label>

                <textarea
                  id="message"
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="Une précision concernant votre commande ou le rendez-vous..."
                  className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                />

              </div>

              {/* TOTAL */}

              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">

                <div className="flex items-center justify-between">

                  <span className="text-gray-400">
                    Total
                  </span>

                  <span className="text-xl font-bold text-blue-400">

                    {(
                      Number(
                        selectedProduct.price
                      ) * quantity
                    ).toLocaleString(
                      "fr-FR"
                    )}{" "}

                    FCFA

                  </span>

                </div>

              </div>

              {/* BOUTONS */}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">

                <button
                  type="button"
                  onClick={closeOrderModal}
                  disabled={buying}
                  className="flex-1 rounded-lg bg-gray-700 px-4 py-3 font-semibold transition hover:bg-gray-600 disabled:opacity-50"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={buying}
                  className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {buying
                    ? "Création de la commande..."
                    : "Confirmer la commande"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </main>
  );
}