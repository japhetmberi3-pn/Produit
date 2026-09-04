"use client";

import {
    FormEvent,
    useCallback,
    useEffect,
    useState,
} from "react";

import { useRouter } from "next/navigation";

interface Product {
    id: number;
    user_id: number;
    name: string;
    description: string | null;
    price: number;
    stock: number;
    created_at: string;
    updated_at: string;
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
    email: string;
    role?: string;
}

interface Conversation {
    id: number;
    user_id: number;
    admin_id: number;
    unread_count?: number;
}

interface ApiObjectResponse {
    message?: string;
    product?: Product;
    products?: Product[];
    unread_count?: number;
    errors?: Record<string, string[]>;
}

type ApiResponse =
    | ApiObjectResponse
    | Product[]
    | Record<string, never>;

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";

export default function ProductsPage() {
    const router = useRouter();

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [addingToCart, setAddingToCart] = useState<number | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [checkingAuth, setCheckingAuth] = useState(true);

    const [unreadCount, setUnreadCount] = useState(0);

    /*
     * COMPTEUR GLOBAL DES MESSAGES NON LUS
     */
    const [unreadMessagesCount, setUnreadMessagesCount] =
        useState(0);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [editingProduct, setEditingProduct] =
        useState<Product | null>(null);

    const [form, setForm] = useState<ProductForm>({
        name: "",
        description: "",
        price: "",
        stock: "",
    });

    /*
     * ALLER AUX MESSAGERIES
     */
    const pushMessageries = () => {
        router.push("/Messageries");
    };

    /*
     * ALLER AU PANIER
     */
    const pushPanier = () => {
        router.push("/Panier");
    };

    /*
     * RÉCUPÉRER LE TOKEN
     */
    const getToken = (): string | null => {
        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem("token");
    };

    /*
     * VÉRIFICATION DE L'AUTHENTIFICATION
     */
    useEffect(() => {
        const token = localStorage.getItem("token");

        if (!token) {
            router.replace("/");
            return;
        }

        setCheckingAuth(false);
    }, [router]);

    /*
     * DÉCONNEXION FORCÉE
     */
    const forceLogout = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
        }

        router.replace("/");
    }, [router]);

    /*
     * RÉCUPÉRER L'UTILISATEUR
     */
    useEffect(() => {
        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
            } catch (error) {
                console.error(
                    "Impossible de récupérer l'utilisateur :",
                    error
                );
            }
        }
    }, []);

    /*
     * RÉINITIALISER LE FORMULAIRE
     */
    const resetForm = () => {
        setForm({
            name: "",
            description: "",
            price: "",
            stock: "",
        });

        setEditingProduct(null);
    };

    /*
     * ALLER AUX NOTIFICATIONS
     */
    const handleNotifications = () => {
        router.push("/Notifications");
    };

    /*
     * LIRE UNE RÉPONSE DE L'API
     */
    const parseResponse = async (
        response: Response
    ): Promise<ApiResponse> => {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text) as ApiResponse;
        } catch {
            return {
                message: text,
            };
        }
    };

    /*
     * RÉCUPÉRER LES NOTIFICATIONS NON LUES
     */
    const fetchUnreadNotifications = useCallback(async () => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/notifications`,
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

            const data = await parseResponse(response);

            if (!response.ok) {
                const message =
                    !Array.isArray(data)
                        ? data.message
                        : undefined;

                throw new Error(
                    message ||
                        "Impossible de récupérer les notifications."
                );
            }

            if (!Array.isArray(data)) {
                setUnreadCount(
                    Number(data.unread_count) || 0
                );
            }
        } catch (err) {
            console.error(
                "Erreur récupération compteur notifications :",
                err
            );
        }
    }, [forceLogout]);

    /*
     * RÉCUPÉRER LE COMPTEUR DES MESSAGES NON LUS
     *
     * Laravel retourne unread_count pour chaque conversation.
     * On additionne tous les unread_count.
     */
    const fetchUnreadMessages = useCallback(async () => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        try {
            const response = await fetch(
                `${API_URL}/conversations`,
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
                    `Impossible de récupérer les conversations : ${response.status}`
                );
            }

            const data =
                await response.json();

            if (!Array.isArray(data)) {
                setUnreadMessagesCount(0);
                return;
            }

            const conversations =
                data as Conversation[];

            const totalUnread =
                conversations.reduce(
                    (
                        total: number,
                        conversation: Conversation
                    ) =>
                        total +
                        (Number(
                            conversation.unread_count
                        ) || 0),
                    0
                );

            setUnreadMessagesCount(
                totalUnread
            );
        } catch (err) {
            console.error(
                "Erreur récupération compteur messages :",
                err
            );
        }
    }, [forceLogout]);

    /*
     * RÉCUPÉRER LES PRODUITS
     *
     * ADMIN ET CLIENT PEUVENT VOIR LES PRODUITS.
     */
    const fetchProducts = useCallback(async () => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        setLoading(true);
        setError("");

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
                forceLogout();
                return;
            }

            const data = await parseResponse(response);

            console.log(
                "Produits reçus depuis Laravel :",
                data
            );

            if (!response.ok) {
                const message =
                    !Array.isArray(data)
                        ? data.message
                        : undefined;

                throw new Error(
                    message ||
                        "Impossible de récupérer les produits."
                );
            }

            if (Array.isArray(data)) {
                setProducts(data);
                return;
            }

            if (Array.isArray(data.products)) {
                setProducts(data.products);
                return;
            }

            setProducts([]);
        } catch (err) {
            console.error(
                "Erreur récupération produits :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setLoading(false);
        }
    }, [forceLogout]);

    /*
     * CHARGEMENT INITIAL
     */
    useEffect(() => {
        if (checkingAuth) {
            return;
        }

        fetchProducts();
        fetchUnreadNotifications();
        fetchUnreadMessages();
    }, [
        checkingAuth,
        fetchProducts,
        fetchUnreadNotifications,
        fetchUnreadMessages,
    ]);

    /*
     * MODIFICATION DU FORMULAIRE
     */
    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement
        >
    ) => {
        const { name, value } = event.target;

        setForm((currentForm) => ({
            ...currentForm,
            [name]: value,
        }));
    };

    /*
     * CRÉER OU MODIFIER UN PRODUIT
     */
    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        setError("");
        setSuccess("");
        setSaving(true);

        try {
            const productBeingEdited =
                editingProduct;

            const isEditing =
                productBeingEdited !== null;

            const url = isEditing
                ? `${API_URL}/products/${productBeingEdited.id}`
                : `${API_URL}/products`;

            const method = isEditing
                ? "PUT"
                : "POST";

            const name = form.name.trim();
            const description =
                form.description.trim();
            const priceValue =
                form.price.trim();
            const stockValue =
                form.stock.trim();

            /*
             * VALIDATION DU NOM
             */
            if (!name) {
                throw new Error(
                    "Le nom du produit est obligatoire."
                );
            }

            /*
             * VALIDATION DU PRIX
             */
            if (
                priceValue === "" ||
                !/^-?\d+(\.\d+)?$/.test(
                    priceValue
                )
            ) {
                throw new Error(
                    "Le prix doit être un nombre supérieur ou égal à 0."
                );
            }

            const price = Number(priceValue);

            if (
                !Number.isFinite(price) ||
                price < 0
            ) {
                throw new Error(
                    "Le prix doit être un nombre supérieur ou égal à 0."
                );
            }

            /*
             * VALIDATION DU STOCK
             */
            if (
                stockValue === "" ||
                !/^-?\d+$/.test(stockValue)
            ) {
                throw new Error(
                    "Le stock doit être un nombre entier supérieur ou égal à 0."
                );
            }

            const stock = Number(stockValue);

            if (
                !Number.isInteger(stock) ||
                stock < 0
            ) {
                throw new Error(
                    "Le stock doit être un nombre entier supérieur ou égal à 0."
                );
            }

            const response = await fetch(
                url,
                {
                    method,
                    headers: {
                        Accept:
                            "application/json",
                        "Content-Type":
                            "application/json",
                        Authorization:
                            `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name,
                        description:
                            description ||
                            null,
                        price,
                        stock,
                    }),
                }
            );

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data =
                await parseResponse(response);

            /*
             * ERREURS DE VALIDATION LARAVEL
             */
            if (
                response.status === 422 &&
                !Array.isArray(data) &&
                data.errors
            ) {
                const validationErrors =
                    Object.values(
                        data.errors
                    )
                        .flat()
                        .join(" ");

                throw new Error(
                    validationErrors ||
                        "Les données envoyées sont invalides."
                );
            }

            if (!response.ok) {
                const message =
                    !Array.isArray(data)
                        ? data.message
                        : undefined;

                throw new Error(
                    message ||
                        "Impossible d'enregistrer le produit."
                );
            }

            if (
                Array.isArray(data) ||
                !data.product
            ) {
                throw new Error(
                    "Laravel n'a pas retourné le produit."
                );
            }

            /*
             * MODIFICATION
             */
            if (isEditing) {
                setProducts(
                    (currentProducts) =>
                        currentProducts.map(
                            (product) =>
                                product.id ===
                                productBeingEdited.id
                                    ? data.product!
                                    : product
                        )
                );

                setSuccess(
                    "Produit modifié avec succès."
                );
            } else {
                /*
                 * CRÉATION
                 */
                setProducts(
                    (currentProducts) => [
                        data.product!,
                        ...currentProducts,
                    ]
                );

                setSuccess(
                    "Produit créé et enregistré dans la base de données."
                );
            }

            resetForm();
        } catch (err) {
            console.error(
                "Erreur enregistrement produit :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
     * MODIFIER UN PRODUIT
     */
    const handleEdit = (
        product: Product
    ) => {
        setEditingProduct(product);

        setForm({
            name: product.name,
            description:
                product.description ?? "",
            price: String(product.price),
            stock: String(product.stock),
        });

        setError("");
        setSuccess("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    /*
     * SUPPRIMER UN PRODUIT
     */
    const handleDelete = async (
        id: number
    ) => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        const confirmed =
            window.confirm(
                "Voulez-vous vraiment supprimer ce produit ?"
            );

        if (!confirmed) {
            return;
        }

        setError("");
        setSuccess("");
        setDeleting(id);

        try {
            const response =
                await fetch(
                    `${API_URL}/products/${id}`,
                    {
                        method: "DELETE",
                        headers: {
                            Accept:
                                "application/json",
                            Authorization:
                                `Bearer ${token}`,
                        },
                    }
                );

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data =
                await parseResponse(response);

            if (!response.ok) {
                const message =
                    !Array.isArray(data)
                        ? data.message
                        : undefined;

                throw new Error(
                    message ||
                        "Impossible de supprimer le produit."
                );
            }

            setProducts(
                (currentProducts) =>
                    currentProducts.filter(
                        (product) =>
                            product.id !== id
                    )
            );

            if (
                editingProduct?.id === id
            ) {
                resetForm();
            }

            setSuccess(
                "Produit supprimé avec succès."
            );
        } catch (err) {
            console.error(
                "Erreur suppression produit :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setDeleting(null);
        }
    };

    /*
     * AJOUTER UN PRODUIT AU PANIER
     */
    const handleAddToCart = async (
        product: Product
    ) => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        /*
         * PROTECTION CONTRE LA RUPTURE DE STOCK
         */
        if (product.stock <= 0) {
            setError(
                "Ce produit est en rupture de stock."
            );
            return;
        }

        setError("");
        setSuccess("");
        setAddingToCart(product.id);

        try {
            const response =
                await fetch(
                    `${API_URL}/cart`,
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
                            product_id:
                                product.id,
                            quantity: 1,
                        }),
                    }
                );

            if (response.status === 401) {
                forceLogout();
                return;
            }

            const data =
                await parseResponse(response);

            console.log(
                "Réponse ajout panier Laravel :",
                data
            );

            /*
             * ERREURS DE VALIDATION LARAVEL
             */
            if (
                response.status === 422 &&
                !Array.isArray(data) &&
                data.errors
            ) {
                const validationErrors =
                    Object.values(
                        data.errors
                    )
                        .flat()
                        .join(" ");

                throw new Error(
                    validationErrors ||
                        "Les données envoyées sont invalides."
                );
            }

            if (!response.ok) {
                const message =
                    !Array.isArray(data)
                        ? data.message
                        : undefined;

                throw new Error(
                    message ||
                        "Impossible d'ajouter le produit au panier."
                );
            }

            setSuccess(
                `"${product.name}" a été ajouté au panier.`
            );
        } catch (err) {
            console.error(
                "Erreur ajout panier :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setAddingToCart(null);
        }
    };

    /*
     * PENDANT LA VÉRIFICATION DU TOKEN
     */
    if (checkingAuth) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-black text-white">
                <p className="text-gray-400">
                    Vérification de la connexion...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-black px-6 py-10 text-white">
            <div className="mx-auto max-w-6xl">

                {/* TITRE + BOUTONS */}
                <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h1 className="text-4xl font-bold">
                            Mes produits
                        </h1>

                        <p className="mt-2 text-gray-400">
                            Gérez vos produits depuis cette page.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">

                        {/* PANIER */}
                        <button
                            type="button"
                            onClick={pushPanier}
                            className="relative flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                        >
                            🛒 Panier
                        </button>

                        {/* MESSAGERIES */}
                        <button
                            type="button"
                            onClick={pushMessageries}
                            className="relative flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                        >
                            <span>
                                💬
                            </span>

                            <span>
                                Messageries
                            </span>

                            {unreadMessagesCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow-lg">
                                    {unreadMessagesCount > 99
                                        ? "99+"
                                        : unreadMessagesCount}
                                </span>
                            )}
                        </button>

                        {/* NOTIFICATIONS */}
                        <button
                            type="button"
                            onClick={handleNotifications}
                            className="relative flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold transition hover:bg-blue-700"
                        >
                            <span className="text-xl">
                                🔔
                            </span>

                            <span>
                                Notifications
                            </span>

                            {unreadCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-600 px-1.5 text-xs font-bold text-white shadow-lg">
                                    {unreadCount > 99
                                        ? "99+"
                                        : unreadCount}
                                </span>
                            )}
                        </button>

                    </div>
                </div>

                {/* ERREUR */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-700 bg-red-900/30 p-4 text-red-400">
                        {error}
                    </div>
                )}

                {/* SUCCÈS */}
                {success && (
                    <div className="mb-6 rounded-xl border border-green-700 bg-green-900/30 p-4 text-green-400">
                        {success}
                    </div>
                )}

                {/* FORMULAIRE ADMIN UNIQUEMENT */}
                {user?.role === "admin" && (
                    <section className="mb-10 rounded-2xl border border-gray-800 bg-gray-900 p-6">

                        <h2 className="mb-6 text-2xl font-semibold">
                            {editingProduct
                                ? "Modifier le produit"
                                : "Ajouter un produit"}
                        </h2>

                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-5 md:grid-cols-2"
                        >

                            {/* NOM */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Nom du produit
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Ordinateur HP"
                                    required
                                    disabled={saving}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* PRIX */}
                            <div>
                                <label
                                    htmlFor="price"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Prix
                                </label>

                                <input
                                    id="price"
                                    name="price"
                                    type="text"
                                    inputMode="decimal"
                                    value={form.price}
                                    onChange={handleChange}
                                    placeholder="500000"
                                    required
                                    disabled={saving}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* STOCK */}
                            <div>
                                <label
                                    htmlFor="stock"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Stock
                                </label>

                                <input
                                    id="stock"
                                    name="stock"
                                    type="text"
                                    inputMode="numeric"
                                    value={form.stock}
                                    onChange={handleChange}
                                    placeholder="10"
                                    required
                                    disabled={saving}
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* DESCRIPTION */}
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="description"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Description
                                </label>

                                <textarea
                                    id="description"
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    placeholder="Description du produit..."
                                    rows={4}
                                    disabled={saving}
                                    className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>

                            {/* BOUTONS DU FORMULAIRE */}
                            <div className="flex gap-3 md:col-span-2">

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving
                                        ? "Enregistrement..."
                                        : editingProduct
                                          ? "Modifier le produit"
                                          : "Ajouter le produit"}
                                </button>

                                {editingProduct && (
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        disabled={saving}
                                        className="rounded-lg bg-gray-700 px-6 py-3 font-semibold transition hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Annuler
                                    </button>
                                )}

                            </div>

                        </form>
                    </section>
                )}

                {/* LISTE DES PRODUITS */}
                <section>

                    <div className="mb-5 flex items-center justify-between">

                        <h2 className="text-2xl font-semibold">
                            Liste des produits
                        </h2>

                        <span className="rounded-full bg-gray-800 px-4 py-2 text-sm text-gray-300">
                            {products.length} produit
                            {products.length > 1
                                ? "s"
                                : ""}
                        </span>

                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center text-gray-400">
                            Chargement des produits...
                        </div>
                    ) : products.length === 0 ? (
                        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-10 text-center">

                            <div className="mb-4 text-5xl">
                                🛍️
                            </div>

                            <h3 className="text-xl font-semibold">
                                Aucun produit
                            </h3>

                            <p className="mt-2 text-gray-400">
                                Vous n'avez encore créé aucun produit.
                            </p>

                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

                            {products.map(
                                (product) => (
                                    <article
                                        key={product.id}
                                        className="rounded-2xl border border-gray-800 bg-gray-900 p-6 shadow-xl"
                                    >

                                        {/* EN-TÊTE */}
                                        <div className="mb-5 flex items-start justify-between gap-4">

                                            <div>
                                                <h3 className="text-xl font-bold">
                                                    {product.name}
                                                </h3>

                                                <p className="mt-1 text-sm text-gray-500">
                                                    Produit #{product.id}
                                                </p>
                                            </div>

                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    product.stock > 0
                                                        ? "bg-green-900/40 text-green-400"
                                                        : "bg-red-900/40 text-red-400"
                                                }`}
                                            >
                                                {product.stock > 0
                                                    ? "En stock"
                                                    : "Rupture"}
                                            </span>

                                        </div>

                                        {/* DESCRIPTION */}
                                        <p className="mb-5 min-h-12 text-sm text-gray-400">
                                            {product.description ||
                                                "Aucune description."}
                                        </p>

                                        {/* PRIX + STOCK */}
                                        <div className="mb-6 flex items-center justify-between">

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

                                                <p className="text-lg font-semibold">
                                                    {product.stock}
                                                </p>
                                            </div>

                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex flex-col gap-3">

                                            {/* BOUTONS ADMIN */}
                                            {user?.role ===
                                                "admin" && (
                                                <div className="flex gap-3">

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleEdit(
                                                                product
                                                            )
                                                        }
                                                        disabled={
                                                            deleting !==
                                                                null ||
                                                            addingToCart !==
                                                                null
                                                        }
                                                        className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                                                        disabled={
                                                            deleting ===
                                                                product.id ||
                                                            addingToCart !==
                                                                null
                                                        }
                                                        className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {deleting ===
                                                        product.id
                                                            ? "Suppression..."
                                                            : "Supprimer"}
                                                    </button>

                                                </div>
                                            )}

                                            {/* AJOUTER AU PANIER */}
                                            {(user?.role ===
                                                "admin" ||
                                                user?.role ===
                                                    "client") && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleAddToCart(
                                                            product
                                                        )
                                                    }
                                                    disabled={
                                                        product.stock <=
                                                            0 ||
                                                        addingToCart ===
                                                            product.id ||
                                                        deleting !==
                                                            null
                                                    }
                                                    className="w-full rounded-lg bg-green-600 px-4 py-2 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {addingToCart ===
                                                    product.id
                                                        ? "Ajout au panier..."
                                                        : product.stock <=
                                                            0
                                                          ? "Rupture de stock"
                                                          : "🛒 Ajouter au panier"}
                                                </button>
                                            )}

                                        </div>

                                    </article>
                                )
                            )}

                        </div>
                    )}

                </section>
            </div>
        </main>
    );
}