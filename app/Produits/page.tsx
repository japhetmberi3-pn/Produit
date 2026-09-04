"use client";

import {
FormEvent,
useCallback,
useEffect,
useState,
} from "react";
import { useRouter } from "next/navigation";

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
shop?: Shop | null;
}

interface ProductForm {
name: string;
description: string;
price: string;
stock: string;
}

interface User {
id: number;
name: string;
email?: string;
role?: string;
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

const API_URL =
process.env.NEXT_PUBLIC_API_URL ||
"http://127.0.0.1:8000/api";

export default function ProduitsPage() {
const router = useRouter();

const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");

const [user, setUser] = useState<User | null>(null);

const [form, setForm] = useState<ProductForm>({
name: "",
description: "",
price: "",
stock: "",
});

const [editingProduct, setEditingProduct] =
useState<Product | null>(null);

const [submitting, setSubmitting] = useState(false);

const [unreadNotifications, setUnreadNotifications] =
useState(0);

const [unreadMessages, setUnreadMessages] =
useState(0);

const [cartCount, setCartCount] = useState(0);

const forceLogout = useCallback(() => {
localStorage.removeItem("token");
localStorage.removeItem("user");
router.push("/Connexion");
}, [router]);

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
    | ApiResponse = await response.json();

  if (Array.isArray(data)) {
    setProducts(data);
  } else {
    setProducts(data.products || []);
  }
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

}, [forceLogout]);

const fetchNotifications =
useCallback(async () => {
try {
const token =
localStorage.getItem("token");

    if (!token) {
      return;
    }

    const response = await fetch(
      `${API_URL}/notifications`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    setUnreadNotifications(
      data.unread_count || 0
    );
  } catch (err) {
    console.error(
      "Erreur notifications :",
      err
    );
  }
}, []);

const fetchMessages =
useCallback(async () => {
try {
const token =
localStorage.getItem("token");

    if (!token) {
      return;
    }

    const response = await fetch(
      `${API_URL}/conversations`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data: Conversation[] =
      await response.json();

    const totalUnread =
      data.reduce(
        (total, conversation) =>
          total +
          (conversation.unread_count || 0),
        0
      );

    setUnreadMessages(totalUnread);
  } catch (err) {
    console.error(
      "Erreur messages :",
      err
    );
  }
}, []);

const fetchCart =
useCallback(async () => {
try {
const token =
localStorage.getItem("token");

    if (!token) {
      return;
    }

    const response = await fetch(
      `${API_URL}/cart`,
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const data =
      await response.json();

    if (Array.isArray(data)) {
      const total =
        data.reduce(
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
      const total =
        data.items.reduce(
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

useEffect(() => {
const storedToken =
localStorage.getItem("token");

const storedUser =
  localStorage.getItem("user");

if (!storedToken) {
  forceLogout();
  return;
}

if (storedUser) {
  try {
    const parsedUser: User =
      JSON.parse(storedUser);

    setUser(parsedUser);
  } catch (err) {
    console.error(
      "Erreur lecture utilisateur :",
      err
    );
  }
}

fetchProducts();
fetchNotifications();
fetchMessages();
fetchCart();

}, [
forceLogout,
fetchProducts,
fetchNotifications,
fetchMessages,
fetchCart,
]);

const handleChange = (
e:
| React.ChangeEvent<HTMLInputElement>
| React.ChangeEvent<HTMLTextAreaElement>
) => {
const { name, value } = e.target;

setForm((previous) => ({
  ...previous,
  [name]: value,
}));

};

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
        Accept: "application/json",
        "Content-Type":
          "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        price: Number(form.price),
        stock: Number(form.stock),
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

const handleEdit = (
product: Product
) => {
setEditingProduct(product);

setForm({
  name: product.name,
  description:
    product.description || "",
  price: String(product.price),
  stock: String(product.stock),
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
``

};

const handleDelete = async (
productId: number
) => {
const confirmation =
window.confirm(
"Voulez-vous vraiment supprimer ce produit ?"
);

if (!confirmation) {
  return;
}

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
        Accept: "application/json",
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

  setProducts((previous) =>
    previous.filter(
      (product) =>
        product.id !== productId
    )
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
        Accept: "application/json",
        "Content-Type":
          "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        product_id: productId,
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

const isAdmin =
user?.role === "admin";

const isSeller =
user?.role === "vendeur" ||
user?.role === "seller";

const canManageProducts =
isAdmin || isSeller;

return ( <main className="min-h-screen bg-black px-6 py-10 text-white"> <div className="mx-auto max-w-7xl">

    {/* HEADER */}
    <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-4xl font-bold text-blue-500">
          Produits
        </h1>

        <p className="mt-2 text-gray-400">
          Découvrez les produits disponibles dans les différentes boutiques.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">

        <button
          onClick={() =>
            router.push("/Boutique")
          }
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
        >
          🏪 Boutiques
        </button>

        <button
          onClick={() =>
            router.push("/Panier")
          }
          className="relative rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 font-semibold transition hover:border-blue-500"
        >
          🛒 Panier

          {cartCount > 0 && (
            <span className="ml-2 rounded-full bg-blue-600 px-2 py-1 text-xs">
              {cartCount}
            </span>
          )}
        </button>

        <button
          onClick={() =>
            router.push(
              "/Notifications"
            )
          }
          className="relative rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 font-semibold transition hover:border-blue-500"
        >
          🔔 Notifications

          {unreadNotifications >
            0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-1 text-xs">
              {unreadNotifications}
            </span>
          )}
        </button>

        <button
          onClick={() =>
            router.push("/Messageries")
          }
          className="relative rounded-lg border border-gray-700 bg-gray-950 px-5 py-3 font-semibold transition hover:border-blue-500"
        >
          💬 Messages

          {unreadMessages > 0 && (
            <span className="ml-2 rounded-full bg-red-600 px-2 py-1 text-xs">
              {unreadMessages}
            </span>
          )}
        </button>

      </div>
    </div>

    {/* ERREUR */}
    {error && (
      <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-400">
        {error}
      </div>
    )}

    {/* FORMULAIRE ADMIN / VENDEUR */}
    {canManageProducts && (
      <div className="mb-12 rounded-2xl border border-gray-800 bg-gray-950 p-8">

        <h2 className="mb-2 text-2xl font-bold">
          {editingProduct
            ? "Modifier le produit"
            : "Ajouter un produit"}
        </h2>

        <p className="mb-6 text-sm text-gray-400">
          {isSeller
            ? "Le produit sera automatiquement associé à votre boutique."
            : "Ajoutez un produit à la plateforme."}
        </p>

        <form
          onSubmit={handleSubmit}
          className="grid gap-6 md:grid-cols-2"
        >

          <div>
            <label
              htmlFor="name"
              className="mb-2 block font-medium"
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
              className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="Nom du produit"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="mb-2 block font-medium"
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
              className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="Prix"
            />
          </div>

          <div>
            <label
              htmlFor="stock"
              className="mb-2 block font-medium"
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
              className="w-full rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="Stock"
            />
          </div>

          <div className="md:col-span-2">
            <label
              htmlFor="description"
              className="mb-2 block font-medium"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              className="w-full resize-none rounded-xl border border-gray-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
              placeholder="Description du produit"
            />
          </div>

          <div className="flex flex-wrap gap-3 md:col-span-2">

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="rounded-xl border border-gray-700 px-6 py-3 font-semibold transition hover:border-gray-500"
              >
                Annuler
              </button>
            )}

          </div>
        </form>
      </div>
    )}

    {/* CHARGEMENT */}
    {loading && (
      <div className="py-20 text-center">
        <p className="text-gray-400">
          Chargement des produits...
        </p>
      </div>
    )}

    {/* AUCUN PRODUIT */}
    {!loading &&
      products.length === 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-950 p-10 text-center">
          <h2 className="text-2xl font-semibold">
            Aucun produit disponible
          </h2>

          <p className="mt-2 text-gray-400">
            Les produits apparaîtront ici lorsqu'ils seront disponibles.
          </p>
        </div>
      )}

    {/* LISTE PRODUITS */}
    {!loading &&
      products.length > 0 && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-2xl border border-gray-800 bg-gray-950 p-6 transition hover:-translate-y-1 hover:border-blue-500"
            >

              {/* ICÔNE */}
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600/20 text-4xl">
                📦
              </div>

              {/* NOM */}
              <h2 className="text-2xl font-bold">
                {product.name}
              </h2>

              {/* DESCRIPTION */}
              <p className="mt-3 min-h-[48px] text-gray-400">
                {product.description ||
                  "Aucune description disponible."}
              </p>

              {/* BOUTIQUE */}
              {product.shop ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/Boutique/${product.shop?.id}`
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-blue-900/50 bg-blue-950/20 p-4 text-left transition hover:border-blue-500 hover:bg-blue-950/40"
                >
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Boutique
                  </p>

                  <p className="mt-1 text-lg font-semibold text-blue-400">
                    🏪{" "}
                    {product.shop.name}
                  </p>

                  {product.shop
                    .description && (
                    <p className="mt-1 text-sm text-gray-400">
                      {
                        product.shop
                          .description
                      }
                    </p>
                  )}

                  <p className="mt-3 text-sm text-blue-300">
                    Voir la boutique →
                  </p>
                </button>
              ) : (
                <div className="mt-5 rounded-xl border border-gray-800 bg-gray-900/50 p-4">
                  <p className="text-sm text-gray-500">
                    🏪 Boutique non associée
                  </p>
                </div>
              )}

              {/* PRIX / STOCK */}
              <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-5">

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

              {/* PANIER */}
              <div className="mt-6">

                {product.stock > 0 ? (
                  <button
                    onClick={() =>
                      addToCart(
                        product.id
                      )
                    }
                    className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                  >
                    🛒 Ajouter au panier
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full cursor-not-allowed rounded-xl bg-gray-800 px-5 py-3 font-semibold text-gray-500"
                  >
                    Rupture de stock
                  </button>
                )}

              </div>

              {/* MODIFICATION / SUPPRESSION */}
              {canManageProducts && (
                <div className="mt-3 flex gap-3">

                  <button
                    onClick={() =>
                      handleEdit(
                        product
                      )
                    }
                    className="flex-1 rounded-xl border border-blue-600 px-4 py-2 font-semibold text-blue-400 transition hover:bg-blue-600/10"
                  >
                    Modifier
                  </button>

                  <button
                    onClick={() =>
                      handleDelete(
                        product.id
                      )
                    }
                    className="flex-1 rounded-xl border border-red-600 px-4 py-2 font-semibold text-red-400 transition hover:bg-red-600/10"
                  >
                    Supprimer
                  </button>

                </div>
              )}

            </div>
          ))}
        </div>
      )}

  </div>
</main>
);
}