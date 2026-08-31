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

    const [notifications, setNotifications] = useState<
        Notification[]
    >([]);

    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(
        null
    );
    const [markingAll, setMarkingAll] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    /*
     * RÉCUPÉRER LE TOKEN
     */
    const getToken = () => {
        if (typeof window === "undefined") {
            return null;
        }

        return localStorage.getItem("token");
    };

    /*
     * DÉCONNEXION FORCÉE
     */
    const forceLogout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        router.push("/");
    }, [router]);

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

            /*
             * TOKEN EXPIRÉ OU INVALIDE
             */
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

            /*
             * Laravel peut retourner :
             *
             * [
             *     {...},
             *     {...}
             * ]
             *
             * OU :
             *
             * {
             *     notifications: [...]
             * }
             */
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
     * COMPTER LES NOTIFICATIONS NON LUES
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

            /*
             * TOKEN INVALIDE
             */
            if (response.status === 401) {
                forceLogout();
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            console.log(
                "Réponse Laravel - notification lue :",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de marquer la notification comme lue."
                );
            }

            /*
             * METTRE À JOUR L'INTERFACE
             */
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

            setSuccess(
                "Notification marquée comme lue."
            );
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

            /*
             * TOKEN INVALIDE
             */
            if (response.status === 401) {
                forceLogout();
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            console.log(
                "Réponse Laravel - toutes les notifications lues :",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de marquer toutes les notifications comme lues."
                );
            }

            /*
             * METTRE TOUTES LES NOTIFICATIONS À JOUR
             */
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

            /*
             * TOKEN INVALIDE
             */
            if (response.status === 401) {
                forceLogout();
                return;
            }

            const text = await response.text();
            const data = text ? JSON.parse(text) : {};

            console.log(
                "Réponse Laravel - suppression notification :",
                data
            );

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        "Impossible de supprimer la notification."
                );
            }

            /*
             * RETIRER LA NOTIFICATION DE L'INTERFACE
             */
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
        <main className="min-h-screen bg-black px-6 py-10 text-white">
            <div className="mx-auto max-w-4xl">

                {/* TITRE */}
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Notifications
                        </h1>

                        <p className="mt-2 text-gray-400">
                            Vous avez{" "}
                            <span className="font-semibold text-blue-400">
                                {unreadCount}
                            </span>{" "}
                            notification
                            {unreadCount > 1 ? "s" : ""} non lue
                            {unreadCount > 1 ? "s" : ""}.
                        </p>
                    </div>

                    {/* BOUTONS */}
                    <div className="flex gap-3">

                        {/* TOUT LIRE */}
                        <button
                            type="button"
                            onClick={markAllAsRead}
                            disabled={
                                unreadCount === 0 ||
                                markingAll
                            }
                            className="rounded-lg bg-green-600 px-4 py-2 font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {markingAll
                                ? "..."
                                : "✓ Tout lire"}
                        </button>

                        {/* RETOUR AUX PRODUITS */}
                        <button
                            type="button"
                            onClick={() =>
                                router.push("/Products")
                            }
                            className="rounded-lg bg-gray-700 px-4 py-2 font-semibold transition hover:bg-gray-600"
                        >
                            Produits
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

                {/* CHARGEMENT */}
                {loading ? (
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center text-gray-400">
                        Chargement des notifications...
                    </div>
                ) : notifications.length === 0 ? (
                    /* AUCUNE NOTIFICATION */
                    <div className="rounded-xl border border-gray-800 bg-gray-900 p-8 text-center">
                        <div className="mb-3 text-4xl">
                            🔔
                        </div>

                        <h2 className="text-xl font-semibold">
                            Aucune notification
                        </h2>

                        <p className="mt-2 text-gray-400">
                            Vous n'avez aucune notification pour le moment.
                        </p>
                    </div>
                ) : (
                    /* LISTE DES NOTIFICATIONS */
                    <div className="space-y-4">
                        {notifications.map(
                            (notification) => (
                                <div
                                    key={notification.id}
                                    className={`rounded-xl border p-5 transition ${
                                        notification.read_at ===
                                        null
                                            ? "border-blue-800 bg-blue-950/30"
                                            : "border-gray-800 bg-gray-900"
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-4">

                                        {/* CONTENU */}
                                        <div className="flex gap-4">
                                            <div
                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                                                    notification.read_at ===
                                                    null
                                                        ? "bg-blue-600"
                                                        : "bg-gray-700"
                                                }`}
                                            >
                                                🔔
                                            </div>

                                            <div>
                                                <p className="font-medium">
                                                    {notification
                                                        .data
                                                        ?.message ||
                                                        "Nouvelle notification"}
                                                </p>

                                                {notification
                                                    .data
                                                    ?.product_name && (
                                                    <p className="mt-1 text-sm text-gray-400">
                                                        Produit :{" "}
                                                        {
                                                            notification
                                                                .data
                                                                .product_name
                                                        }
                                                    </p>
                                                )}

                                                {notification
                                                    .data
                                                    ?.quantity !==
                                                    undefined && (
                                                    <p className="text-sm text-gray-400">
                                                        Quantité :{" "}
                                                        {
                                                            notification
                                                                .data
                                                                .quantity
                                                        }
                                                    </p>
                                                )}

                                                <p className="mt-2 text-xs text-gray-500">
                                                    {new Date(
                                                        notification.created_at
                                                    ).toLocaleString(
                                                        "fr-FR"
                                                    )}
                                                </p>

                                                {/* STATUT */}
                                                <p
                                                    className={`mt-2 text-xs font-semibold ${
                                                        notification.read_at ===
                                                        null
                                                            ? "text-blue-400"
                                                            : "text-green-400"
                                                    }`}
                                                >
                                                    {notification.read_at ===
                                                    null
                                                        ? "Non lue"
                                                        : "Lue"}
                                                </p>
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex shrink-0 gap-2">

                                            {/* MARQUER COMME LUE */}
                                            {notification.read_at ===
                                                null && (
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
                                                    className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {processingId ===
                                                    notification.id
                                                        ? "..."
                                                        : "Lu"}
                                                </button>
                                            )}

                                            {/* SUPPRIMER */}
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
                                                className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {processingId ===
                                                notification.id
                                                    ? "..."
                                                    : "Supprimer"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}