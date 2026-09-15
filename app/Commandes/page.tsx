"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
  id: number;
  name: string;
  description?: string | null;
  price: number | string;
  stock: number;
  user_id?: number;
  shop_id?: number | null;
}

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
  price: number | string;
  product?: Product | null;
}

interface OrderUser {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

interface Order {
  id: number;
  user_id: number;
  status: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];

  user?: OrderUser | null;

  recipient_name?: string | null;
  delivery_date?: string | null;
  delivery_time?: string | null;

  phone?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  address?: string | null;
  address_details?: string | null;

  latitude?: number | string | null;
  longitude?: number | string | null;

  delivery_note?: string | null;
}

interface StoredUser {
  id: number;
  name?: string;
  email?: string;
  role?: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api";

export default function CommandesPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const [currentUser, setCurrentUser] =
    useState<StoredUser | null>(null);

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  const [quantity, setQuantity] = useState(1);

  const [recipientName, setRecipientName] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");

  const [phone, setPhone] = useState("");

  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [address, setAddress] = useState("");
  const [addressDetails, setAddressDetails] = useState("");

  const [latitude, setLatitude] =
    useState<number | null>(null);

  const [longitude, setLongitude] =
    useState<number | null>(null);

  const [deliveryNote, setDeliveryNote] = useState("");

  const [gettingLocation, setGettingLocation] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);

  const [updatingOrderId, setUpdatingOrderId] =
    useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getToken = () => {
    if (typeof window === "undefined") {
      return null;
    }

    return localStorage.getItem("token");
  };

  const getStoredUser = (): StoredUser | null => {
    if (typeof window === "undefined") {
      return null;
    }

    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      console.error(
        "Impossible de lire l'utilisateur connecté."
      );

      return null;
    }
  };

  const isAdmin =
    currentUser?.role === "admin";

  const isSeller =
    currentUser?.role === "vendeur" ||
    currentUser?.role === "seller";

  const isClient =
    currentUser?.role === "client";

  const isManagementUser =
    isAdmin || isSeller;

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/");
  };

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

      console.log(
        "Produits reçus :",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer les produits."
        );
      }

      if (Array.isArray(data)) {
        setProducts(data);
      } else if (
        Array.isArray(data.products)
      ) {
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

      console.log(
        "Commandes reçues :",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Impossible de récupérer les commandes."
        );
      }

      if (Array.isArray(data)) {
        setOrders(data);
      } else if (
        Array.isArray(data.orders)
      ) {
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

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.push("/");
      return;
    }

    const user = getStoredUser();

    if (!user) {
      setError(
        "Impossible de récupérer les informations de votre compte."
      );
      setLoading(false);
      return;
    }

    setCurrentUser(user);

    const load = async () => {
      setLoading(true);

      if (user.role === "client") {
        await Promise.all([
          fetchProducts(),
          fetchOrders(),
        ]);
      } else {
        await fetchOrders();
      }

      setLoading(false);
    };

    load();
  }, []);

  const resetForm = () => {
    setQuantity(1);

    setRecipientName("");
    setDeliveryDate("");
    setDeliveryTime("");

    setPhone("");

    setCity("");
    setNeighborhood("");
    setAddress("");
    setAddressDetails("");

    setLatitude(null);
    setLongitude(null);

    setDeliveryNote("");
  };

  const openOrderModal = (
    product: Product
  ) => {
    setSelectedProduct(product);

    resetForm();

    setError("");
    setSuccess("");
  };

  const closeOrderModal = () => {
    if (buying) {
      return;
    }

    setSelectedProduct(null);

    resetForm();
  };

  const getCurrentLocation = () => {
    setError("");

    if (!navigator.geolocation) {
      setError(
        "La géolocalisation n'est pas disponible sur cet appareil."
      );

      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat =
          position.coords.latitude;

        const lng =
          position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        setGettingLocation(false);

        console.log(
          "📍 Position récupérée :",
          {
            latitude: lat,
            longitude: lng,
          }
        );
      },
      (geoError) => {
        console.error(
          "Erreur géolocalisation :",
          geoError
        );

        setGettingLocation(false);

        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError(
              "Vous avez refusé l'accès à votre position."
            );
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError(
              "Votre position n'est pas disponible."
            );
            break;

          case geoError.TIMEOUT:
            setError(
              "La récupération de votre position a pris trop de temps."
            );
            break;

          default:
            setError(
              "Impossible de récupérer votre position."
            );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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

    if (
      quantity >
      selectedProduct.stock
    ) {
      setError(
        `Stock insuffisant. Il reste ${selectedProduct.stock} produit(s).`
      );
      return;
    }

    if (!recipientName.trim()) {
      setError(
        "Veuillez renseigner le nom du destinataire."
      );
      return;
    }

    if (!deliveryDate) {
      setError(
        "Veuillez sélectionner une date de livraison."
      );
      return;
    }

    if (!deliveryTime) {
      setError(
        "Veuillez sélectionner un créneau de livraison."
      );
      return;
    }

    const deliveryStartTime =
      deliveryTime.split(" - ")[0];

    if (
      !/^\d{2}:\d{2}$/.test(
        deliveryStartTime
      )
    ) {
      setError(
        "Le créneau de livraison est invalide."
      );
      return;
    }

    if (!phone.trim()) {
      setError(
        "Veuillez renseigner votre numéro de téléphone."
      );
      return;
    }

    if (!city.trim()) {
      setError(
        "Veuillez renseigner la ville."
      );
      return;
    }

    if (!neighborhood.trim()) {
      setError(
        "Veuillez renseigner le quartier."
      );
      return;
    }

    if (!address.trim()) {
      setError(
        "Veuillez renseigner l'adresse."
      );
      return;
    }

    if (
      latitude === null ||
      longitude === null
    ) {
      setError(
        "Veuillez indiquer votre position GPS en utilisant votre position actuelle."
      );
      return;
    }

    setBuying(true);

    try {
      const orderData = {
        items: [
          {
            product_id:
              selectedProduct.id,
            quantity: quantity,
          },
        ],

        recipient_name:
          recipientName.trim(),

        phone:
          phone.trim(),

        city:
          city.trim(),

        neighborhood:
          neighborhood.trim(),

        address:
          address.trim(),

        address_details:
          addressDetails.trim() ||
          null,

        latitude,
        longitude,

        delivery_note:
          deliveryNote.trim() ||
          null,

        delivery_date:
          deliveryDate,

        delivery_time:
          deliveryStartTime,
      };

      console.log(
        "📦 DONNÉES COMMANDE SHOPX",
        orderData
      );

      const response =
        await fetch(
          `${API_URL}/orders`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body:
              JSON.stringify(
                orderData
              ),
          }
        );

      const data =
        await response.json();

      console.log(
        "📡 Status Laravel :",
        response.status
      );

      console.log(
        "📡 Réponse Laravel :",
        data
      );

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      if (!response.ok) {
        if (data.errors) {
          const firstError =
            Object.values(
              data.errors
            )[0];

          if (
            Array.isArray(
              firstError
            ) &&
            firstError.length > 0
          ) {
            throw new Error(
              String(
                firstError[0]
              )
            );
          }
        }

        throw new Error(
          data.message ||
            `Erreur Laravel ${response.status}`
        );
      }

      if (!data.order) {
        throw new Error(
          "Laravel n'a pas retourné la commande."
        );
      }

      setOrders(
        (currentOrders) => [
          data.order,
          ...currentOrders,
        ]
      );

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) =>
              product.id ===
              selectedProduct.id
                ? {
                    ...product,
                    stock:
                      product.stock -
                      quantity,
                  }
                : product
          )
      );

      setSuccess(
        `Commande #${data.order.id} créée avec succès ! Livraison prévue le ${new Date(
          deliveryDate
        ).toLocaleDateString(
          "fr-FR"
        )} entre ${deliveryTime}.`
      );

      setSelectedProduct(null);

      resetForm();

      await Promise.all([
        fetchOrders(),
        fetchProducts(),
      ]);
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

  /**
   * Modifier le statut d'une commande.
   */
  const updateOrderStatus = async (
    orderId: number,
    status: string
  ) => {
    const token = getToken();

    if (!token) {
      logout();
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingOrderId(orderId);

    try {
      const response =
        await fetch(
          `${API_URL}/orders/${orderId}/status`,
          {
            method: "PATCH",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
              status,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "📡 Modification statut :",
        data
      );

      if (
        response.status === 401
      ) {
        logout();
        return;
      }

      if (
        response.status === 403
      ) {
        throw new Error(
          data.message ||
            "Vous n'êtes pas autorisé à modifier cette commande."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Erreur Laravel ${response.status}`
        );
      }

      if (!data.order) {
        throw new Error(
          "Laravel n'a pas retourné la commande modifiée."
        );
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (currentOrder) =>
              currentOrder.id ===
              orderId
                ? data.order
                : currentOrder
          )
      );

      setSuccess(
        `Commande #${orderId} : ${getStatusLabel(
          status
        )}.`
      );
    } catch (err) {
      console.error(
        "Erreur modification statut :",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de modifier le statut de la commande."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getStatusLabel = (
    status: string
  ) => {
    switch (status) {
      case "pending":
        return "En attente";

      case "confirmed":
        return "Confirmée";

      case "preparing":
        return "En préparation";

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

  const getStatusClass = (
    status: string
  ) => {
    switch (status) {
      case "pending":
        return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

      case "confirmed":
        return "border-blue-400/20 bg-blue-400/10 text-blue-300";

      case "preparing":
        return "border-orange-400/20 bg-orange-400/10 text-orange-300";

      case "shipped":
        return "border-indigo-400/20 bg-indigo-400/10 text-indigo-300";

      case "delivered":
      case "completed":
        return "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";

      case "cancelled":
        return "border-red-400/20 bg-red-400/10 text-red-300";

      default:
        return "border-gray-700 bg-gray-800 text-gray-300";
    }
  };

  const calculateTotal = (
    order: Order
  ) => {
    if (
      !Array.isArray(
        order.items
      )
    ) {
      return 0;
    }

    return order.items.reduce(
      (
        total,
        item
      ) =>
        total +
        Number(item.price) *
          Number(
            item.quantity
          ),
      0
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#050509] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />

            <p className="text-sm text-gray-400">
              Chargement de votre espace...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#050509] text-white">

      {/* ===================================================== */}
      {/* LUEURS DE FOND */}
      {/* ===================================================== */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-blue-600/10 blur-3xl" />

        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

        {/* =================================================== */}
        {/* HEADER */}
        {/* =================================================== */}

        <header className="mb-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-300">

                <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.9)]" />

                {isAdmin
                  ? "ESPACE ADMIN SHOPX"
                  : isSeller
                  ? "ESPACE VENDEUR SHOPX"
                  : "ESPACE SHOPX"}
              </div>

              <h1 className="text-4xl font-black tracking-tight sm:text-5xl">

                {isManagementUser ? (
                  <>
                    Gestion des{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      commandes
                    </span>
                  </>
                ) : (
                  <>
                    Mes{" "}
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
                      commandes
                    </span>
                  </>
                )}

              </h1>

              <p className="mt-3 max-w-2xl text-gray-400">

                {isAdmin
                  ? "Consultez toutes les commandes ShopX et gérez leur statut."
                  : isSeller
                  ? "Consultez les commandes contenant vos produits et gérez leur statut."
                  : "Consultez vos commandes et préparez facilement vos informations de livraison."}

              </p>

            </div>

            <div className="flex gap-3">

              <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur">

                <p className="text-xs text-gray-500">
                  Commandes
                </p>

                <p className="mt-1 text-xl font-bold">
                  {orders.length}
                </p>

              </div>

              {isClient && (
                <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-5 py-3 backdrop-blur">

                  <p className="text-xs text-gray-500">
                    Produits
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {products.length}
                  </p>

                </div>
              )}

            </div>

          </div>
        </header>

        {/* =================================================== */}
        {/* ERREUR */}
        {/* =================================================== */}

        {error && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-red-300 shadow-lg shadow-red-950/10">

            <span className="text-xl">
              ⚠️
            </span>

            <div>

              <p className="font-semibold">
                Une erreur est survenue
              </p>

              <p className="mt-1 text-sm text-red-300/80">
                {error}
              </p>

            </div>

          </div>
        )}

        {/* =================================================== */}
        {/* SUCCÈS */}
        {/* =================================================== */}

        {success && (
          <div className="mb-7 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300 shadow-lg shadow-emerald-950/10">

            <span className="text-xl">
              ✓
            </span>

            <div>

              <p className="font-semibold">
                Opération réussie
              </p>

              <p className="mt-1 text-sm text-emerald-300/80">
                {success}
              </p>

            </div>

          </div>
        )}

        {/* =================================================== */}
        {/* PRODUITS — CLIENT UNIQUEMENT */}
        {/* =================================================== */}

        {isClient && (
          <section>

            <div className="mb-6">

              <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
                Catalogue
              </p>

              <h2 className="mt-1 text-2xl font-bold">
                Produits disponibles
              </h2>

            </div>

            {products.length === 0 ? (

              <div className="rounded-3xl border border-white/5 bg-white/[0.025] p-12 text-center backdrop-blur">

                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-3xl">
                  🛍️
                </div>

                <h3 className="text-xl font-bold">
                  Aucun produit disponible
                </h3>

                <p className="mx-auto mt-2 max-w-md text-gray-500">
                  Aucun produit n'est actuellement disponible dans le catalogue ShopX.
                </p>

              </div>

            ) : (

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

                {products.map(
                  (product) => (

                    <article
                      key={product.id}
                      className="group relative overflow-hidden rounded-3xl border border-white/[0.07] bg-[#0d0d14] p-5 shadow-2xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-blue-950/20"
                    >

                      <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl transition group-hover:bg-blue-500/20" />

                      <div className="mb-5 flex items-start justify-between">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-500/10 bg-gradient-to-br from-blue-500/15 to-violet-500/10 text-xl">
                          🛍️
                        </div>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-medium ${
                            product.stock > 0
                              ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                              : "border-red-400/20 bg-red-400/10 text-red-300"
                          }`}
                        >
                          {product.stock >
                          0
                            ? "Disponible"
                            : "Rupture"}
                        </span>

                      </div>

                      <h3 className="relative text-xl font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-2 min-h-[42px] text-sm leading-6 text-gray-500">
                        {product.description ||
                          "Découvrez ce produit dans le catalogue ShopX."}
                      </p>

                      <div className="my-6 flex items-end justify-between border-y border-white/[0.06] py-5">

                        <div>

                          <p className="text-xs uppercase tracking-wider text-gray-600">
                            Prix
                          </p>

                          <p className="mt-1 text-2xl font-black text-blue-400">

                            {Number(
                              product.price
                            ).toLocaleString(
                              "fr-FR"
                            )}{" "}

                            <span className="text-sm font-semibold text-blue-400/70">
                              FCFA
                            </span>

                          </p>

                        </div>

                        <div className="text-right">

                          <p className="text-xs uppercase tracking-wider text-gray-600">
                            Stock
                          </p>

                          <p
                            className={`mt-1 text-lg font-bold ${
                              product.stock >
                              0
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {product.stock}
                          </p>

                        </div>

                      </div>

                      <button
                        type="button"
                        disabled={
                          product.stock <=
                          0
                        }
                        onClick={() =>
                          openOrderModal(
                            product
                          )
                        }
                        className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold shadow-lg shadow-blue-950/30 transition duration-300 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-900/40 disabled:cursor-not-allowed disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 disabled:shadow-none"
                      >
                        {product.stock >
                        0
                          ? "Préparer la livraison →"
                          : "Rupture de stock"}
                      </button>

                    </article>
                  )
                )}

              </div>
            )}

          </section>
        )}

        {/* =================================================== */}
        {/* COMMANDES */}
        {/* =================================================== */}

        <section
          className={
            isClient
              ? "mt-16"
              : "mt-2"
          }
        >

          <div className="mb-6">

            <p className="text-sm font-medium uppercase tracking-[0.2em] text-violet-400">
              {isManagementUser
                ? "Administration"
                : "Historique"}
            </p>

            <h2 className="mt-1 text-2xl font-bold">

              {isManagementUser
                ? "Gestion des commandes"
                : "Mes commandes"}

            </h2>

          </div>

          {orders.length === 0 ? (

            <div className="rounded-3xl border border-white/5 bg-white/[0.025] p-12 text-center backdrop-blur">

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-3xl">
                📦
              </div>

              <h3 className="text-xl font-bold">
                Aucune commande
              </h3>

              <p className="mx-auto mt-2 max-w-md text-gray-500">

                {isAdmin
                  ? "Aucune commande n'est actuellement enregistrée."
                  : isSeller
                  ? "Aucune commande ne contient actuellement vos produits."
                  : "Vous n'avez encore effectué aucune commande."}

              </p>

            </div>

          ) : (

            <div className="space-y-5">

              {orders.map(
                (order) => (

                  <div
                    key={order.id}
                    className="group rounded-3xl border border-white/[0.07] bg-[#0d0d14] p-6 shadow-xl shadow-black/20 transition hover:border-blue-500/20"
                  >

                    {/* EN-TÊTE COMMANDE */}

                    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                      <div className="flex items-center gap-4">

                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-xl">
                          📦
                        </div>

                        <div>

                          <h3 className="text-lg font-bold">
                            Commande #{order.id}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">

                            {new Date(
                              order.created_at
                            ).toLocaleDateString(
                              "fr-FR",
                              {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              }
                            )}

                          </p>

                          {isManagementUser &&
                            order.user && (
                              <p className="mt-1 text-xs text-blue-300/70">

                                Client :{" "}
                                {order.user.name ||
                                  `Utilisateur #${order.user_id}`}

                              </p>
                            )}

                        </div>

                      </div>

                      <span
                        className={`w-fit rounded-full border px-4 py-2 text-xs font-bold ${getStatusClass(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(
                          order.status
                        )}
                      </span>

                    </div>

                    {/* ================================================= */}
                    {/* GESTION DU STATUT */}
                    {/* ================================================= */}

                    {isManagementUser && (
                      <div className="mb-6 rounded-2xl border border-indigo-500/15 bg-indigo-500/[0.05] p-5">

                        <div className="mb-4">

                          <p className="text-sm font-bold text-indigo-300">
                            ⚙️ Gestion du statut
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            {isAdmin
                              ? "Vous pouvez modifier le statut de cette commande."
                              : "Vous pouvez modifier le statut des commandes contenant vos produits."}
                          </p>

                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                          <select
                            value={
                              order.status
                            }
                            disabled={
                              updatingOrderId ===
                              order.id
                            }
                            onChange={(
                              event
                            ) =>
                              updateOrderStatus(
                                order.id,
                                event.target
                                  .value
                              )
                            }
                            className="w-full rounded-xl border border-white/[0.08] bg-[#11111a] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/10 sm:max-w-xs"
                          >

                            <option
                              value="pending"
                              className="bg-[#11111a]"
                            >
                              En attente
                            </option>

                            <option
                              value="confirmed"
                              className="bg-[#11111a]"
                            >
                              Confirmée
                            </option>

                            <option
                              value="preparing"
                              className="bg-[#11111a]"
                            >
                              En préparation
                            </option>

                            <option
                              value="shipped"
                              className="bg-[#11111a]"
                            >
                              Expédiée
                            </option>

                            <option
                              value="delivered"
                              className="bg-[#11111a]"
                            >
                              Livrée
                            </option>

                            <option
                              value="cancelled"
                              className="bg-[#11111a]"
                            >
                              Annulée
                            </option>

                          </select>

                          {updatingOrderId ===
                            order.id && (
                            <div className="flex items-center gap-2 text-sm text-indigo-300">

                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/20 border-t-indigo-400" />

                              Mise à jour...

                            </div>
                          )}

                        </div>

                      </div>
                    )}

                    {/* ARTICLES */}

                    <div className="space-y-3">

                      {order.items?.map(
                        (item) => (

                          <div
                            key={item.id}
                            className="rounded-2xl border border-white/[0.05] bg-black/20 p-4"
                          >

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                              <div>

                                <p className="font-semibold">
                                  {item.product?.name ||
                                    `Produit #${item.product_id}`}
                                </p>

                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">

                                  <span>
                                    Quantité :{" "}
                                    {
                                      item.quantity
                                    }
                                  </span>

                                  <span>
                                    Prix unitaire :{" "}
                                    {Number(
                                      item.price
                                    ).toLocaleString(
                                      "fr-FR"
                                    )}{" "}
                                    FCFA
                                  </span>

                                </div>

                              </div>

                              <p className="font-bold text-blue-400">

                                {(
                                  Number(
                                    item.price
                                  ) *
                                  Number(
                                    item.quantity
                                  )
                                ).toLocaleString(
                                  "fr-FR"
                                )}{" "}
                                FCFA

                              </p>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                    {/* LIVRAISON */}

                    {(order.delivery_date ||
                      order.address ||
                      (order.latitude !==
                        null &&
                        order.latitude !==
                          undefined)) && (

                      <div className="mt-5 rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/[0.08] to-violet-500/[0.05] p-5">

                        <div className="mb-4 flex items-center gap-3">

                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                            📍
                          </div>

                          <div>

                            <h4 className="font-bold text-blue-300">
                              Livraison
                            </h4>

                            <p className="text-xs text-gray-600">
                              Informations de livraison
                            </p>

                          </div>

                        </div>

                        <div className="grid gap-4 text-sm text-gray-300 sm:grid-cols-2">

                          {order.recipient_name && (
                            <div>

                              <p className="text-xs text-gray-600">
                                DESTINATAIRE
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  order.recipient_name
                                }
                              </p>

                            </div>
                          )}

                          {order.delivery_date && (
                            <div>

                              <p className="text-xs text-gray-600">
                                DATE DE LIVRAISON
                              </p>

                              <p className="mt-1 font-medium">

                                {new Date(
                                  order.delivery_date
                                ).toLocaleDateString(
                                  "fr-FR"
                                )}

                              </p>

                            </div>
                          )}

                          {order.delivery_time && (
                            <div>

                              <p className="text-xs text-gray-600">
                                CRÉNEAU
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  order.delivery_time
                                }
                              </p>

                            </div>
                          )}

                          {order.phone && (
                            <div>

                              <p className="text-xs text-gray-600">
                                TÉLÉPHONE
                              </p>

                              <p className="mt-1 font-medium">
                                {order.phone}
                              </p>

                            </div>
                          )}

                          {order.city && (
                            <div>

                              <p className="text-xs text-gray-600">
                                VILLE
                              </p>

                              <p className="mt-1 font-medium">
                                {order.city}
                              </p>

                            </div>
                          )}

                          {order.neighborhood && (
                            <div>

                              <p className="text-xs text-gray-600">
                                QUARTIER
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  order.neighborhood
                                }
                              </p>

                            </div>
                          )}

                          {order.address && (
                            <div className="sm:col-span-2">

                              <p className="text-xs text-gray-600">
                                ADRESSE
                              </p>

                              <p className="mt-1 font-medium">
                                {order.address}
                              </p>

                            </div>
                          )}

                          {order.address_details && (
                            <div className="sm:col-span-2">

                              <p className="text-xs text-gray-600">
                                COMPLÉMENT
                              </p>

                              <p className="mt-1 font-medium">
                                {
                                  order.address_details
                                }
                              </p>

                            </div>
                          )}

                        </div>

                        {/* GPS */}

                        {order.latitude !==
                          null &&
                          order.latitude !==
                            undefined &&
                          order.longitude !==
                            null &&
                          order.longitude !==
                            undefined && (

                            <div className="mt-5 rounded-xl border border-cyan-400/10 bg-cyan-400/[0.04] p-4">

                              <div className="flex items-center justify-between gap-4">

                                <div>

                                  <p className="text-xs text-gray-600">
                                    POSITION GPS
                                  </p>

                                  <p className="mt-1 text-sm text-cyan-300">

                                    {Number(
                                      order.latitude
                                    ).toFixed(
                                      6
                                    )}

                                    {" , "}

                                    {Number(
                                      order.longitude
                                    ).toFixed(
                                      6
                                    )}

                                  </p>

                                </div>

                                <span className="text-xl">
                                  🗺️
                                </span>

                              </div>

                            </div>
                          )}

                        {/* REMARQUE */}

                        {order.delivery_note && (
                          <div className="mt-4 border-t border-white/[0.06] pt-4">

                            <p className="text-xs text-gray-600">
                              REMARQUE
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                              {
                                order.delivery_note
                              }
                            </p>

                          </div>
                        )}

                      </div>
                    )}

                    {/* TOTAL */}

                    <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-5">

                      <span className="text-gray-500">
                        Total de la commande
                      </span>

                      <span className="text-2xl font-black text-blue-400">

                        {calculateTotal(
                          order
                        ).toLocaleString(
                          "fr-FR"
                        )}{" "}

                        <span className="text-sm font-semibold text-blue-400/70">
                          FCFA
                        </span>

                      </span>

                    </div>

                  </div>
                )
              )}

            </div>
          )}

        </section>

      </div>

      {/* ===================================================== */}
      {/* MODAL LIVRAISON */}
      {/* ===================================================== */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-black/80 px-4 py-8 backdrop-blur-md"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeOrderModal();
            }
          }}
        >

          <div className="mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b12] shadow-2xl shadow-black/70">

            {/* HEADER */}

            <div className="relative overflow-hidden border-b border-white/[0.06] px-6 py-6 sm:px-8">

              <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl" />

              <div className="relative flex items-start justify-between gap-4">

                <div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-300">

                    <span>
                      📦
                    </span>

                    LIVRAISON SHOPX

                  </div>

                  <h2 className="text-2xl font-black">
                    Préparer ma commande
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    Indiquez où et quand vous souhaitez recevoir votre commande.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeOrderModal
                  }
                  disabled={buying}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-gray-400 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                >
                  ✕
                </button>

              </div>

            </div>

            <div className="p-6 sm:p-8">

              {/* PRODUIT */}

              <div className="mb-7 flex items-center justify-between gap-4 rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/[0.08] to-violet-500/[0.05] p-4">

                <div className="flex items-center gap-4">

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                    🛍️
                  </div>

                  <div>

                    <p className="font-bold">
                      {
                        selectedProduct.name
                      }
                    </p>

                    <p className="mt-1 text-sm text-gray-500">

                      {Number(
                        selectedProduct.price
                      ).toLocaleString(
                        "fr-FR"
                      )}{" "}
                      FCFA / unité

                    </p>

                  </div>

                </div>

                <div className="text-right">

                  <p className="text-xs text-gray-600">
                    STOCK
                  </p>

                  <p className="font-bold text-emerald-400">
                    {
                      selectedProduct.stock
                    }
                  </p>

                </div>

              </div>

              <form
                onSubmit={
                  handleOrder
                }
                className="space-y-6"
              >

                {/* DESTINATAIRE */}

                <div>

                  <label
                    htmlFor="recipient_name"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    👤 Nom du destinataire
                  </label>

                  <input
                    id="recipient_name"
                    type="text"
                    value={
                      recipientName
                    }
                    onChange={(
                      event
                    ) =>
                      setRecipientName(
                        event.target
                          .value
                      )
                    }
                    placeholder="Nom complet"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:bg-blue-500/[0.04] focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

                {/* DATE + CRÉNEAU */}

                <div>

                  <div className="mb-3">

                    <p className="text-sm font-semibold text-gray-300">
                      🚚 Livraison
                    </p>

                    <p className="mt-1 text-xs text-gray-600">
                      Choisissez le jour et le créneau souhaités.
                    </p>

                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <label
                        htmlFor="delivery_date"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        Date
                      </label>

                      <input
                        id="delivery_date"
                        type="date"
                        value={
                          deliveryDate
                        }
                        min={
                          new Date()
                            .toISOString()
                            .split(
                              "T"
                            )[0]
                        }
                        onChange={(
                          event
                        ) =>
                          setDeliveryDate(
                            event.target
                              .value
                          )
                        }
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-white outline-none transition focus:border-blue-500/60 focus:bg-blue-500/[0.04] focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="delivery_time"
                        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500"
                      >
                        Créneau
                      </label>

                      <select
                        id="delivery_time"
                        value={
                          deliveryTime
                        }
                        onChange={(
                          event
                        ) =>
                          setDeliveryTime(
                            event.target
                              .value
                          )
                        }
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-white outline-none transition focus:border-blue-500/60 focus:bg-blue-500/[0.04] focus:ring-2 focus:ring-blue-500/10"
                      >

                        <option
                          value=""
                          className="bg-[#0b0b12]"
                        >
                          Choisir un créneau
                        </option>

                        <option
                          value="08:00 - 10:00"
                          className="bg-[#0b0b12]"
                        >
                          08:00 - 10:00
                        </option>

                        <option
                          value="10:00 - 12:00"
                          className="bg-[#0b0b12]"
                        >
                          10:00 - 12:00
                        </option>

                        <option
                          value="12:00 - 14:00"
                          className="bg-[#0b0b12]"
                        >
                          12:00 - 14:00
                        </option>

                        <option
                          value="14:00 - 16:00"
                          className="bg-[#0b0b12]"
                        >
                          14:00 - 16:00
                        </option>

                        <option
                          value="16:00 - 18:00"
                          className="bg-[#0b0b12]"
                        >
                          16:00 - 18:00
                        </option>

                      </select>

                    </div>

                  </div>

                </div>

                {/* TÉLÉPHONE */}

                <div>

                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    📞 Téléphone
                  </label>

                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(
                      event
                    ) =>
                      setPhone(
                        event.target
                          .value
                      )
                    }
                    placeholder="Ex : 06 123 45 67"
                    required
                    className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:bg-blue-500/[0.04] focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

                {/* LOCALISATION */}

                <div className="rounded-3xl border border-blue-500/15 bg-gradient-to-br from-blue-500/[0.06] to-violet-500/[0.04] p-5 sm:p-6">

                  <div className="mb-5">

                    <div className="flex items-center gap-3">

                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                        📍
                      </div>

                      <div>

                        <h3 className="font-bold">
                          Localisation de livraison
                        </h3>

                        <p className="text-xs text-gray-500">
                          Aidez le livreur à trouver précisément votre adresse.
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* VILLE + QUARTIER */}

                  <div className="grid gap-5 sm:grid-cols-2">

                    <div>

                      <label
                        htmlFor="city"
                        className="mb-2 block text-sm font-semibold text-gray-300"
                      >
                        Ville
                      </label>

                      <input
                        id="city"
                        type="text"
                        value={city}
                        onChange={(
                          event
                        ) =>
                          setCity(
                            event.target
                              .value
                          )
                        }
                        placeholder="Ex : Pointe-Noire"
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                    <div>

                      <label
                        htmlFor="neighborhood"
                        className="mb-2 block text-sm font-semibold text-gray-300"
                      >
                        Quartier
                      </label>

                      <input
                        id="neighborhood"
                        type="text"
                        value={
                          neighborhood
                        }
                        onChange={(
                          event
                        ) =>
                          setNeighborhood(
                            event.target
                              .value
                          )
                        }
                        placeholder="Ex : Loandjili"
                        required
                        className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                      />

                    </div>

                  </div>

                  {/* ADRESSE */}

                  <div className="mt-5">

                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Adresse
                    </label>

                    <input
                      id="address"
                      type="text"
                      value={address}
                      onChange={(
                        event
                      ) =>
                        setAddress(
                          event.target
                            .value
                        )
                      }
                      placeholder="Rue, avenue, numéro..."
                      required
                      className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  {/* COMPLÉMENT */}

                  <div className="mt-5">

                    <label
                      htmlFor="address_details"
                      className="mb-2 block text-sm font-semibold text-gray-300"
                    >
                      Complément d'adresse
                    </label>

                    <input
                      id="address_details"
                      type="text"
                      value={
                        addressDetails
                      }
                      onChange={(
                        event
                      ) =>
                        setAddressDetails(
                          event.target
                            .value
                        )
                      }
                      placeholder="Ex : portail noir, maison bleue..."
                      className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10"
                    />

                  </div>

                  {/* CARTE */}

                  <div className="mt-5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#08080d]">

                    <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden">

                      <div className="absolute inset-0 opacity-30">

                        <div className="absolute left-[10%] top-[25%] h-px w-[80%] rotate-12 bg-blue-400/30" />

                        <div className="absolute left-[15%] top-[60%] h-px w-[70%] -rotate-6 bg-cyan-400/20" />

                        <div className="absolute left-[40%] top-0 h-full w-px rotate-12 bg-blue-400/20" />

                        <div className="absolute left-[65%] top-0 h-full w-px -rotate-[20deg] bg-violet-400/20" />

                        <div className="absolute left-[25%] top-[45%] h-32 w-32 rounded-full border border-blue-400/10" />

                        <div className="absolute right-[15%] top-[15%] h-24 w-24 rounded-full border border-cyan-400/10" />

                      </div>

                      <div className="relative z-10 text-center">

                        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/10 text-2xl shadow-[0_0_35px_rgba(59,130,246,0.2)]">
                          📍
                        </div>

                        <p className="font-semibold text-gray-300">
                          Carte de localisation
                        </p>

                        <p className="mt-1 max-w-xs text-xs text-gray-600">
                          Votre position GPS sera enregistrée avec la commande.
                        </p>

                      </div>

                    </div>

                    <div className="border-t border-white/[0.06] p-4">

                      <button
                        type="button"
                        onClick={
                          getCurrentLocation
                        }
                        disabled={
                          gettingLocation
                        }
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 font-semibold text-blue-300 transition hover:bg-blue-500/15 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        {gettingLocation ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-400/20 border-t-blue-400" />

                            Localisation en cours...
                          </>
                        ) : (
                          <>
                            📍 Utiliser ma position actuelle
                          </>
                        )}

                      </button>

                    </div>

                  </div>

                  {/* COORDONNÉES */}

                  {latitude !==
                    null &&
                    longitude !==
                      null && (

                      <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">

                        <div className="flex items-center justify-between gap-4">

                          <div>

                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/60">
                              Position GPS détectée
                            </p>

                            <p className="mt-1 text-sm font-medium text-emerald-300">

                              {latitude.toFixed(
                                6
                              )}

                              {" , "}

                              {longitude.toFixed(
                                6
                              )}

                            </p>

                          </div>

                          <span className="text-xl">
                            ✓
                          </span>

                        </div>

                      </div>
                    )}

                </div>

                {/* REMARQUE */}

                <div>

                  <label
                    htmlFor="delivery_note"
                    className="mb-2 block text-sm font-semibold text-gray-300"
                  >
                    📝 Remarque pour la livraison
                  </label>

                  <textarea
                    id="delivery_note"
                    value={
                      deliveryNote
                    }
                    onChange={(
                      event
                    ) =>
                      setDeliveryNote(
                        event.target
                          .value
                      )
                    }
                    rows={4}
                    placeholder="Ex : Appelez-moi avant d'arriver..."
                    className="w-full resize-none rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-white outline-none transition placeholder:text-gray-700 focus:border-blue-500/60 focus:bg-blue-500/[0.04] focus:ring-2 focus:ring-blue-500/10"
                  />

                </div>

                {/* TOTAL */}

                <div className="rounded-2xl border border-blue-500/15 bg-gradient-to-r from-blue-500/10 to-violet-500/10 p-5">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-sm text-gray-500">
                        Total de la commande
                      </p>

                      <p className="mt-1 text-xs text-gray-600">

                        {quantity} ×{" "}

                        {Number(
                          selectedProduct.price
                        ).toLocaleString(
                          "fr-FR"
                        )}{" "}
                        FCFA

                      </p>

                    </div>

                    <p className="text-2xl font-black text-blue-400">

                      {(
                        Number(
                          selectedProduct.price
                        ) *
                        quantity
                      ).toLocaleString(
                        "fr-FR"
                      )}{" "}

                      <span className="text-sm">
                        FCFA
                      </span>

                    </p>

                  </div>

                </div>

                {/* INFORMATION */}

                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.04] p-4">

                  <div className="flex gap-3">

                    <span className="text-lg">
                      ℹ️
                    </span>

                    <div>

                      <p className="text-sm font-semibold text-amber-300">
                        Étape de préparation
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-200/60">
                        Vos informations de livraison seront enregistrées avec votre commande. Le paiement sera ajouté dans une étape séparée ultérieurement.
                      </p>

                    </div>

                  </div>

                </div>

                {/* BOUTONS */}

                <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">

                  <button
                    type="button"
                    onClick={
                      closeOrderModal
                    }
                    disabled={buying}
                    className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 font-semibold text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    disabled={buying}
                    className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold shadow-lg shadow-blue-950/30 transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {buying
                      ? "Enregistrement..."
                      : "Enregistrer la commande →"}

                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>
      )}

    </main>
  );
}