"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
}

interface Order {
    id: number;
    product_id: number;
    quantity: number;
    status: string;
    product?: Product;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function OrdersPage() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);

    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState("1");

    const [loading, setLoading] = useState(true);
    const [buying, setBuying] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getToken = () => localStorage.getItem("token");

    /*
     * Déconnexion forcée (token invalide/expiré)
     */
    const forceLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    }, [router]);

    /*
     * RÉCUPÉRER LES PRODUITS
     */
    const fetchProducts = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/products`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de récupérer les produits."
                );
            }

            setProducts(Array.isArray(data) ? data : data.products || []);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Impossible de récupérer les produits."
            );
        }
    }, [forceLogout]);

    /*
     * RÉCUPÉRER LES COMMANDES
     */
    const fetchOrders = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Impossible de récupérer les commandes."
                );
            }

            setOrders(Array.isArray(data) ? data : data.orders || []);
        } catch (err) {
            console.error("Erreur récupération commandes :", err);
        }
    }, [forceLogout]);

    /*
     * CHARGEMENT INITIAL
     */
    useEffect(() => {
        const token = getToken();

        if (!token) {
            router.push("/");
            return;
        }

        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchProducts(), fetchOrders()]);
            setLoading(false);
        };

        loadData();
    }, [router, fetchProducts, fetchOrders]);

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
        setQuantity("1");
        setError("");
        setSuccess("");
    };

    /*
     * CRÉER UNE COMMANDE
     */
    const handleOrder = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const token = getToken();

        setError("");
        setSuccess("");

        if (!token) {
            forceLogout();
            return;
        }

        if (!selectedProduct) {
            setError("Veuillez sélectionner un produit.");
            return;
        }

        const requestedQuantity = Number(quantity);

        if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
            setError("La quantité doit être un nombre entier supérieur à 0.");
            return;
        }

        if (requestedQuantity > selectedProduct.stock) {
            setError(
                `Stock insuffisant. Il reste seulement ${selectedProduct.stock} produit(s).`
            );
            return;
        }

        setBuying(true);

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    product_id: selectedProduct.id,
                    quantity: requestedQuantity,
                }),
            });

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const firstError = Object.values(data.errors)[0];
                    if (Array.isArray(firstError)) {
                        throw new Error(String(firstError[0]));
                    }
                }

                throw new Error(data.message || "Impossible d'effectuer l'achat.");
            }

            if (!data.order) {
                throw new Error("Laravel n'a pas retourné la commande créée.");
            }

            setOrders((currentOrders) => [data.order, ...currentOrders]);

            setProducts((currentProducts) =>
                currentProducts.map((product) =>
                    product.id === selectedProduct.id
                        ? { ...product, stock: product.stock - requestedQuantity }
                        : product
                )
            );

            setSuccess("Achat effectué avec succès !");
            setSelectedProduct(null);
            setQuantity("1");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue lors de l'achat."
            );
        } finally {
            setBuying(false);
        }
    };

    return (
        <main className="min-h-screen bg-black px-6 py-10 text-white">
            <div className="mx-auto max-w-6xl">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold">Commandes</h1>
                    <p className="mt-2 text-gray-400">
                        Choisissez un produit et effectuez votre achat.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 rounded-xl border border-red-700 bg-red-900/30 p-4 text-red-400">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 rounded-xl border border-green-700 bg-green-900/30 p-4 text-green-400">
                        {success}
                    </div>
                )}

                {loading ? (
                    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
                        Chargement...
                    </div>
                ) : products.length === 0 ? (
                    <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">
                        <div className="mb-4 text-5xl">🛍️</div>
                        <h2 className="text-xl font-semibold">
                            Aucun produit disponible
                        </h2>
                        <p className="mt-2 text-gray-400">
                            Aucun produit n'est actuellement disponible.
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <article
                                key={product.id}
                                className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl"
                            >
                                <h2 className="text-xl font-bold">{product.name}</h2>

                                <p className="mt-2 text-sm text-gray-400">
                                    {product.description || "Aucune description."}
                                </p>

                                <div className="my-5 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Prix</p>
                                        <p className="text-xl font-bold text-blue-400">
                                            {Number(product.price).toLocaleString("fr-FR")}{" "}
                                            FCFA
                                        </p>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Stock</p>
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
                                    onClick={() => handleSelectProduct(product)}
                                    className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-500"
                                >
                                    {product.stock > 0 ? "Acheter" : "Rupture de stock"}
                                </button>
                            </article>
                        ))}
                    </div>
                )}

                {selectedProduct && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
                        <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-7 shadow-2xl">
                            <h2 className="text-2xl font-bold">
                                Acheter {selectedProduct.name}
                            </h2>

                            <p className="mt-2 text-gray-400">
                                Prix unitaire :{" "}
                                {Number(selectedProduct.price).toLocaleString("fr-FR")}{" "}
                                FCFA
                            </p>

                            <p className="mt-1 text-sm text-gray-500">
                                Stock disponible : {selectedProduct.stock}
                            </p>

                            <form onSubmit={handleOrder} className="mt-6 space-y-5">
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
                                        onChange={(event) => setQuantity(event.target.value)}
                                        required
                                        className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500"
                                    />
                                </div>

                                <div className="rounded-lg bg-gray-800 p-4">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Total</span>
                                        <span className="font-bold text-blue-400">
                                            {(
                                                Number(selectedProduct.price) *
                                                Number(quantity || 0)
                                            ).toLocaleString("fr-FR")}{" "}
                                            FCFA
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedProduct(null)}
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
                                        {buying ? "Achat..." : "Confirmer"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {orders.length > 0 && (
                    <section className="mt-12">
                        <h2 className="mb-5 text-2xl font-semibold">Mes commandes</h2>

                        <div className="space-y-4">
                            {orders.map((order) => (
                                <div
                                    key={order.id}
                                    className="rounded-xl border border-gray-800 bg-gray-900 p-5"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                Commande #{order.id}
                                            </p>

                                            <p className="mt-1 text-sm text-gray-400">
                                                Produit :{" "}
                                                {order.product?.name || `#${order.product_id}`}
                                            </p>

                                            <p className="text-sm text-gray-400">
                                                Quantité : {order.quantity}
                                            </p>
                                        </div>

                                        <span className="rounded-full bg-green-900/40 px-3 py-1 text-sm font-semibold text-green-400">
                                            {order.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}