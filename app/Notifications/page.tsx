"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Notification {
    id: string;
    type: string;
    data: {
        type?: string;
        message?: string;
        product_id?: number;
        product_name?: string;
        quantity?: number;
    };
    read_at: string | null;
    created_at: string;
    updated_at?: string;
}

const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    "http://127.0.0.1:8000/api";

export default function NotificationsPage() {
    const router = useRouter();

    const [notifications, setNotifications] = useState<Notification[]>(
        []
    );

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(
        null
    );
    const [markingAll, setMarkingAll] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [userName, setUserName] = useState("");
    const [mobileMenu, setMobileMenu] = useState(false);

    /*
     * TOKEN
     */
    const getToken = () => {
        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem("token");
    };

    /*
     * UTILISATEUR CONNECTÉ
     */
    useEffect(() => {
        if (typeof window === "undefined") return;

        const storedUser = localStorage.getItem("user");

        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                setUserName(user?.name || "");
            } catch {
                setUserName("");
            }
        }
    }, []);

    /*
     * DÉCONNEXION
     */
    const forceLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/");
    }, [router]);

    const handleLogout = async () => {
        const token = getToken();

        try {
            if (token) {
                await fetch(`${API_URL}/logout`, {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                });
            }
        } catch (error) {
            console.error("Erreur logout :", error);
        } finally {
            forceLogout();
        }
    };

    /*
     * RÉCUPÉRER LES NOTIFICATIONS
     */
    const fetchNotifications = useCallback(async () => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        try {
            setLoading(true);
            setError("");

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

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            console.log(
                "Notifications reçues depuis Laravel :",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de récupérer les notifications."
                );
            }

            if (Array.isArray(data)) {
                setNotifications(data);
            } else if (Array.isArray(data.notifications)) {
                setNotifications(data.notifications);
            } else {
                setNotifications([]);
            }
        } catch (err) {
            console.error(
                "Erreur récupération notifications :",
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
     * CHARGEMENT AUTOMATIQUE
     */
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    /*
     * NOTIFICATIONS NON LUES
     */
    const unreadCount = notifications.filter(
        (notification) => notification.read_at === null
    ).length;

    /*
     * MARQUER UNE NOTIFICATION COMME LUE
     */
    const markAsRead = async (id: string) => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        try {
            setProcessingId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/notifications/${id}/read`,
                {
                    method: "PATCH",
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

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de marquer la notification comme lue."
                );
            }

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (notification) =>
                            notification.id === id
                                ? {
                                      ...notification,
                                      read_at:
                                          new Date().toISOString(),
                                  }
                                : notification
                    )
            );

            setSuccess("Notification marquée comme lue.");
        } catch (err) {
            console.error(
                "Erreur notification :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setProcessingId(null);
        }
    };

    /*
     * MARQUER TOUTES LES NOTIFICATIONS COMME LUES
     */
    const markAllAsRead = async () => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        if (unreadCount === 0) {
            return;
        }

        try {
            setMarkingAll(true);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/notifications/read-all`,
                {
                    method: "PATCH",
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

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de marquer toutes les notifications comme lues."
                );
            }

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.map(
                        (notification) => ({
                            ...notification,
                            read_at:
                                notification.read_at ??
                                new Date().toISOString(),
                        })
                    )
            );

            setSuccess(
                "Toutes les notifications ont été marquées comme lues."
            );
        } catch (err) {
            console.error(
                "Erreur marquage de toutes les notifications :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setMarkingAll(false);
        }
    };

    /*
     * SUPPRIMER UNE NOTIFICATION
     */
    const deleteNotification = async (id: string) => {
        const token = getToken();

        if (!token) {
            forceLogout();
            return;
        }

        const confirmed = window.confirm(
            "Voulez-vous vraiment supprimer cette notification ?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setProcessingId(id);
            setError("");
            setSuccess("");

            const response = await fetch(
                `${API_URL}/notifications/${id}`,
                {
                    method: "DELETE",
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

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de supprimer la notification."
                );
            }

            setNotifications(
                (currentNotifications) =>
                    currentNotifications.filter(
                        (notification) =>
                            notification.id !== id
                    )
            );

            setSuccess(
                "Notification supprimée avec succès."
            );
        } catch (err) {
            console.error(
                "Erreur suppression notification :",
                err
            );

            setError(
                err instanceof Error
                    ? err.message
                    : "Une erreur est survenue."
            );
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-black text-white">
            {/* ===================================================== */}
            {/* NAVIGATION */}
            {/* ===================================================== */}

            <header className="sticky top-0 z-50 border-b border-white/10 bg-black/80 backdrop-blur-xl">
                <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">

                    {/* LOGO */}
                    <button
                        onClick={() => router.push("/")}
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-lg shadow-blue-500/20 transition group-hover:scale-105">
                            <span className="text-lg font-black">
                                X
                            </span>
                        </div>

                        <div className="text-left">
                            <div className="text-xl font-black tracking-tight">
                                Shop
                                <span className="text-blue-500">
                                    X
                                </span>
                            </div>

                            <div className="hidden text-[9px] uppercase tracking-[0.3em] text-gray-500 sm:block">
                                Premium Store
                            </div>
                        </div>
                    </button>

                    {/* NAV DESKTOP */}
                    <nav className="hidden items-center gap-1 lg:flex">
                        <button
                            onClick={() => router.push("/")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Accueil
                        </button>

                        <button
                            onClick={() => router.push("/Produits")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Catalogue
                        </button>

                        <button
                            onClick={() => router.push("/Panier")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Panier
                        </button>

                        <button
                            onClick={() => router.push("/Commandes")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Commandes
                        </button>

                        <button
                            onClick={() => router.push("/Messageries")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            💬 Messagerie
                        </button>

                        <button
                            className="relative rounded-xl bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-400"
                        >
                            🔔 Notifications

                            {unreadCount > 0 && (
                                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-blue-500/30">
                                    {unreadCount > 9
                                        ? "9+"
                                        : unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => router.push("/Compte")}
                            className="rounded-xl px-4 py-2.5 text-sm font-medium text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                            Compte
                        </button>
                    </nav>

                    {/* ACTIONS */}
                    <div className="hidden items-center gap-3 lg:flex">
                        {userName && (
                            <button
                                onClick={() =>
                                    router.push("/Compte")
                                }
                                className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:border-blue-500/30 hover:bg-white/10"
                            >
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-600 text-xs font-bold">
                                    {userName
                                        .charAt(0)
                                        .toUpperCase()}
                                </div>

                                <span className="max-w-24 truncate text-sm text-gray-300">
                                    {userName}
                                </span>
                            </button>
                        )}

                        <button
                            onClick={handleLogout}
                            className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10"
                        >
                            Déconnexion
                        </button>
                    </div>

                    {/* MOBILE BUTTON */}
                    <button
                        onClick={() =>
                            setMobileMenu(!mobileMenu)
                        }
                        className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl lg:hidden"
                    >
                        {mobileMenu ? "✕" : "☰"}
                    </button>
                </div>

                {/* MENU MOBILE */}
                {mobileMenu && (
                    <div className="border-t border-white/10 bg-black/95 px-5 py-5 lg:hidden">
                        <div className="flex flex-col gap-2">

                            {[
                                ["Accueil", "/"],
                                ["Catalogue", "/Produits"],
                                ["Panier", "/Panier"],
                                ["Commandes", "/Commandes"],
                                ["💬 Messagerie", "/Messageries"],
                                ["🔔 Notifications", "/Notifications"],
                                ["Compte", "/Compte"],
                            ].map(([label, path]) => (
                                <button
                                    key={path}
                                    onClick={() => {
                                        setMobileMenu(false);
                                        router.push(path);
                                    }}
                                    className={`rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                                        path ===
                                        "/Notifications"
                                            ? "bg-blue-500/10 text-blue-400"
                                            : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                                >
                                    {label}
                                </button>
                            ))}

                            <div className="my-2 border-t border-white/10" />

                            <button
                                onClick={handleLogout}
                                className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-left text-sm font-semibold text-red-400"
                            >
                                Déconnexion
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* ===================================================== */}
            {/* CONTENU */}
            {/* ===================================================== */}

            <div className="relative overflow-hidden">
                {/* GLOW BACKGROUND */}
                <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
                <div className="pointer-events-none absolute -right-40 top-80 h-96 w-96 rounded-full bg-violet-600/10 blur-[120px]" />

                <div className="relative mx-auto max-w-6xl px-5 py-10 lg:px-8">

                    {/* HERO */}
                    <div className="mb-10">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 shadow-lg shadow-blue-400" />
                            Centre de notifications
                        </div>

                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
                                    Vos{" "}
                                    <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-violet-500 bg-clip-text text-transparent">
                                        notifications
                                    </span>
                                </h1>

                                <p className="mt-3 max-w-2xl text-gray-400">
                                    Retrouvez ici toutes les informations
                                    importantes concernant vos achats et
                                    votre compte ShopX.
                                </p>
                            </div>

                            {/* COMPTEUR */}
                            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-xl">
                                    🔔
                                </div>

                                <div>
                                    <p className="text-2xl font-black text-white">
                                        {unreadCount}
                                    </p>

                                    <p className="text-xs text-gray-500">
                                        non lue
                                        {unreadCount > 1
                                            ? "s"
                                            : ""}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ACTION BAR */}
                    <div className="mb-8 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-1 rounded-full bg-gradient-to-b from-blue-500 to-violet-500" />

                            <div>
                                <p className="text-sm font-semibold text-white">
                                    Centre de notification
                                </p>

                                <p className="text-xs text-gray-500">
                                    Gérez vos alertes ShopX
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={
                                unreadCount === 0 ||
                                markingAll
                            }
                            className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 px-5 py-3 text-sm font-bold shadow-lg shadow-blue-500/10 transition hover:-translate-y-0.5 hover:from-blue-500 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {markingAll
                                ? "Traitement..."
                                : "✓ Tout marquer comme lu"}
                        </button>
                    </div>

                    {/* ERREUR */}
                    {error && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-red-400">
                            <span className="text-xl">⚠️</span>

                            <div>
                                <p className="font-semibold">
                                    Une erreur est survenue
                                </p>

                                <p className="mt-1 text-sm text-red-400/80">
                                    {error}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* SUCCÈS */}
                    {success && (
                        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-500/20 bg-green-500/5 p-4 text-green-400">
                            <span className="text-xl">✓</span>

                            <div>
                                <p className="font-semibold">
                                    Opération réussie
                                </p>

                                <p className="mt-1 text-sm text-green-400/80">
                                    {success}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CHARGEMENT */}
                    {loading ? (
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-16 text-center">
                            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />

                            <h2 className="text-lg font-bold">
                                Chargement
                            </h2>

                            <p className="mt-2 text-sm text-gray-500">
                                Récupération de vos notifications...
                            </p>
                        </div>
                    ) : notifications.length === 0 ? (
                        /* AUCUNE NOTIFICATION */
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-12 text-center">
                            <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-blue-500/10 blur-[70px]" />

                            <div className="relative">
                                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10 text-4xl">
                                    🔔
                                </div>

                                <h2 className="text-2xl font-black">
                                    Aucune notification
                                </h2>

                                <p className="mx-auto mt-3 max-w-md text-gray-500">
                                    Vous êtes à jour. Les nouvelles
                                    notifications apparaîtront ici
                                    automatiquement.
                                </p>

                                <button
                                    onClick={() =>
                                        router.push(
                                            "/Produits"
                                        )
                                    }
                                    className="mt-7 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 py-3 text-sm font-bold shadow-lg shadow-blue-500/10 transition hover:-translate-y-0.5"
                                >
                                    Découvrir le catalogue →
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* LISTE */
                        <div className="space-y-4">
                            {notifications.map(
                                (notification) => {
                                    const isUnread =
                                        notification.read_at ===
                                        null;

                                    return (
                                        <div
                                            key={
                                                notification.id
                                            }
                                            className={`group relative overflow-hidden rounded-2xl border p-5 transition duration-300 hover:-translate-y-0.5 ${
                                                isUnread
                                                    ? "border-blue-500/30 bg-gradient-to-r from-blue-950/30 to-violet-950/20 shadow-lg shadow-blue-950/10"
                                                    : "border-white/10 bg-white/[0.025] hover:border-white/20"
                                            }`}
                                        >
                                            {/* INDICATEUR NON LUE */}
                                            {isUnread && (
                                                <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-violet-500" />
                                            )}

                                            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                                                {/* CONTENU */}
                                                <div className="flex min-w-0 gap-4">
                                                    <div
                                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
                                                            isUnread
                                                                ? "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/20"
                                                                : "bg-white/5 text-gray-500"
                                                        }`}
                                                    >
                                                        🔔
                                                    </div>

                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className="font-bold text-white">
                                                                {notification
                                                                    .data
                                                                    ?.message ||
                                                                    "Nouvelle notification"}
                                                            </h3>

                                                            {isUnread && (
                                                                <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-blue-400">
                                                                    Nouveau
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* PRODUIT */}
                                                        {notification
                                                            .data
                                                            ?.product_name && (
                                                            <div className="mt-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                                                                <p className="text-xs uppercase tracking-wider text-gray-600">
                                                                    Produit
                                                                </p>

                                                                <p className="mt-1 text-sm font-semibold text-gray-300">
                                                                    {
                                                                        notification
                                                                            .data
                                                                            .product_name
                                                                    }
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* QUANTITÉ */}
                                                        {notification
                                                            .data
                                                            ?.quantity !==
                                                            undefined && (
                                                            <p className="mt-3 text-sm text-gray-500">
                                                                Quantité :{" "}
                                                                <span className="font-semibold text-gray-300">
                                                                    {
                                                                        notification
                                                                            .data
                                                                            .quantity
                                                                    }
                                                                </span>
                                                            </p>
                                                        )}

                                                        {/* DATE */}
                                                        <p className="mt-3 text-xs text-gray-600">
                                                            {new Date(
                                                                notification.created_at
                                                            ).toLocaleString(
                                                                "fr-FR"
                                                            )}
                                                        </p>

                                                        {/* STATUT */}
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <span
                                                                className={`h-1.5 w-1.5 rounded-full ${
                                                                    isUnread
                                                                        ? "bg-blue-400 shadow-lg shadow-blue-400"
                                                                        : "bg-green-400"
                                                                }`}
                                                            />

                                                            <span
                                                                className={`text-xs font-semibold ${
                                                                    isUnread
                                                                        ? "text-blue-400"
                                                                        : "text-green-400"
                                                                }`}
                                                            >
                                                                {isUnread
                                                                    ? "Non lue"
                                                                    : "Lue"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ACTIONS */}
                                                <div className="flex shrink-0 gap-2 md:pt-1">
                                                    {isUnread && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                markAsRead(
                                                                    notification.id
                                                                )
                                                            }
                                                            disabled={
                                                                processingId ===
                                                                    notification.id ||
                                                                markingAll
                                                            }
                                                            className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-2.5 text-xs font-bold text-green-400 transition hover:border-green-500/40 hover:bg-green-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                        >
                                                            {processingId ===
                                                            notification.id
                                                                ? "..."
                                                                : "✓ Lu"}
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            deleteNotification(
                                                                notification.id
                                                            )
                                                        }
                                                        disabled={
                                                            processingId ===
                                                                notification.id ||
                                                            markingAll
                                                        }
                                                        className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-xs font-bold text-red-400 transition hover:border-red-500/40 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        {processingId ===
                                                        notification.id
                                                            ? "..."
                                                            : "Supprimer"}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}

                    {/* FOOTER NAVIGATION */}
                    <div className="mt-10 grid gap-3 sm:grid-cols-3">
                        <button
                            onClick={() =>
                                router.push("/Produits")
                            }
                            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-blue-500/20 hover:bg-blue-500/5"
                        >
                            <div className="mb-2 text-xl">
                                🛍️
                            </div>

                            <p className="font-bold">
                                Catalogue
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Découvrir les produits
                            </p>
                        </button>

                        <button
                            onClick={() =>
                                router.push("/Commandes")
                            }
                            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-blue-500/20 hover:bg-blue-500/5"
                        >
                            <div className="mb-2 text-xl">
                                📦
                            </div>

                            <p className="font-bold">
                                Mes commandes
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Suivre vos achats
                            </p>
                        </button>

                        <button
                            onClick={() =>
                                router.push("/Compte")
                            }
                            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-blue-500/20 hover:bg-blue-500/5"
                        >
                            <div className="mb-2 text-xl">
                                👤
                            </div>

                            <p className="font-bold">
                                Mon compte
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                                Gérer votre profil
                            </p>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}