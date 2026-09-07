"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface MeResponse {
    user: User;
}

export default function GoogleCallbackPage() {
    const router = useRouter();

    const [error, setError] = useState("");

    useEffect(() => {
        const handleGoogleCallback = async () => {
            try {
                // ==========================================
                // 1. Vérifier s'il y a une erreur Google
                // ==========================================

                const params = new URLSearchParams(
                    window.location.search
                );

                const googleError = params.get("error");

                if (googleError) {
                    throw new Error(
                        "La connexion avec Google a échoué."
                    );
                }

                // ==========================================
                // 2. Récupérer le token envoyé par Laravel
                // ==========================================

                const hash = window.location.hash;

                if (!hash) {
                    throw new Error(
                        "Aucun token d'authentification n'a été reçu."
                    );
                }

                const hashParams = new URLSearchParams(
                    hash.substring(1)
                );

                const token = hashParams.get("token");

                if (!token) {
                    throw new Error(
                        "Le token Google est introuvable."
                    );
                }

                // ==========================================
                // 3. Sauvegarder le token
                // ==========================================

                localStorage.setItem("token", token);

                // ==========================================
                // 4. Récupérer l'utilisateur connecté
                // ==========================================

                const response = await fetch(
                    "http://127.0.0.1:8000/api/user",
                    {
                        method: "GET",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Impossible de récupérer votre compte."
                    );
                }

                const data =
                    (await response.json()) as MeResponse;

                if (!data.user) {
                    throw new Error(
                        "Les informations de l'utilisateur sont introuvables."
                    );
                }

                // ==========================================
                // 5. Sauvegarder l'utilisateur
                // ==========================================

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                // ==========================================
                // 6. Nettoyer le token de l'URL
                // ==========================================

                window.history.replaceState(
                    {},
                    document.title,
                    window.location.pathname
                );

                // ==========================================
                // 7. Rediriger selon le rôle
                // ==========================================

                if (
                    data.user.role === "vendeur" ||
                    data.user.role === "seller"
                ) {
                    router.replace("/MaBoutique");
                } else {
                    router.replace("/Produits");
                }
            } catch (err) {
                console.error(
                    "Erreur connexion Google :",
                    err
                );

                localStorage.removeItem("token");
                localStorage.removeItem("user");

                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError(
                        "Une erreur est survenue pendant la connexion Google."
                    );
                }
            }
        };

        handleGoogleCallback();
    }, [router]);

    // ==========================================
    // AFFICHAGE
    // ==========================================

    return (
        <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
            <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-8 text-center shadow-2xl">
                {error ? (
                    <>
                        <div className="mb-4 text-4xl">
                            ❌
                        </div>

                        <h1 className="mb-3 text-2xl font-bold">
                            Connexion impossible
                        </h1>

                        <p className="mb-6 text-gray-400">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={() =>
                                router.replace("/")
                            }
                            className="rounded-lg bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700"
                        >
                            Retour à la connexion
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mb-4 text-4xl">
                            🔐
                        </div>

                        <h1 className="mb-3 text-2xl font-bold">
                            Connexion en cours...
                        </h1>

                        <p className="text-gray-400">
                            Nous finalisons votre connexion à ShopX.
                        </p>
                    </>
                )}
            </div>
        </main>
    );
}