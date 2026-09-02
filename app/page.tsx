"use client";

import {
    FormEvent,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

interface AuthResponse {
    message: string;
    user: User;
    token: string;
}

export default function AuthPage() {
    const router = useRouter();

    const [mode, setMode] = useState<
        "login" | "register"
    >("login");

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Vérifier si l'utilisateur est connecté
    const [isLoggedIn, setIsLoggedIn] =
        useState(false);

    useEffect(() => {
        const token =
            localStorage.getItem("token");

        setIsLoggedIn(!!token);
    }, []);

    // DÉCONNEXION
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setIsLoggedIn(false);
        setSuccess("Vous êtes déconnecté.");
        setError("");
    };

    const handleSubmit = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const endpoint =
                mode === "login"
                    ? "http://127.0.0.1:8000/api/login"
                    : "http://127.0.0.1:8000/api/register";

            const userData =
                mode === "login"
                    ? {
                          email: email.trim(),
                          password,
                      }
                    : {
                          name: name.trim(),
                          email: email.trim(),
                          password,
                      };

            const response = await fetch(
                endpoint,
                {
                    method: "POST",
                    headers: {
                        Accept:
                            "application/json",
                            "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        userData
                    ),
                }
            );

            const data =
                await response.json();

            if (!response.ok) {
                if (data.errors) {
                    const firstError =
                        Object.values(
                            data.errors
                        )[0];

                    if (
                        Array.isArray(
                            firstError
                        )
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
                        "Une erreur est survenue."
                );
            }

            const authData =
                data as AuthResponse;

            if (
                !authData.user ||
                !authData.token
            ) {
                throw new Error(
                    "Laravel n'a pas retourné l'utilisateur ou le token."
                );
            }

            // Sauvegarder le token Sanctum
            localStorage.setItem(
                "token",
                authData.token
            );

            // Sauvegarder l'utilisateur
            localStorage.setItem(
                "user",
                JSON.stringify(
                    authData.user
                )
            );

            // L'utilisateur est maintenant connecté
            setIsLoggedIn(true);

            if (mode === "login") {
                setSuccess(
                    "Connexion réussie !"
                );

                setEmail("");
                setPassword("");

                router.push("/Produits");
            } else {
                setSuccess(
                    "Compte créé avec succès !"
                );

                setName("");
                setEmail("");
                setPassword("");

                router.push("/Produits");
            }
        } catch (err) {
            console.error(
                "Erreur authentification :",
                err
            );

            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError(
                    "Impossible de contacter le serveur."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const changeMode = (
        newMode:
            | "login"
            | "register"
    ) => {
        setMode(newMode);
        setError("");
        setSuccess("");
    };

    return (
        <main className="min-h-screen bg-black text-white">

            {/* BARRE DU HAUT */}
            <div className="flex justify-end px-6 py-4">
                {isLoggedIn && (
                    <button
                        type="button"
                        onClick={
                            handleLogout
                        }
                        className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                    >
                        Déconnexion
                    </button>
                )}
            </div>

            <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">

                    {/* TITRE */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold">
                            ShopX
                        </h1>

                        <p className="mt-2 text-gray-400">
                            Bienvenue sur ShopX
                        </p>
                    </div>

                    {/* BOUTONS CONNEXION / INSCRIPTION */}
                    <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-gray-900 p-2">

                        <button
                            type="button"
                            onClick={() =>
                                changeMode(
                                    "login"
                                )
                            }
                            className={`rounded-lg px-4 py-3 font-semibold transition ${
                                mode ===
                                "login"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            Connexion
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                changeMode(
                                    "register"
                                )
                            }
                            className={`rounded-lg px-4 py-3 font-semibold transition ${
                                mode ===
                                "register"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                            }`}
                        >
                            Inscription
                        </button>
                    </div>

                    {/* FORMULAIRE */}
                    <form
                        onSubmit={
                            handleSubmit
                        }
                        className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl"
                    >
                        <h2 className="mb-6 text-2xl font-semibold">
                            {mode ===
                            "login"
                                ? "Connexion"
                                : "Inscription"}
                        </h2>

                        {/* ERREUR */}
                        {error && (
                            <div className="mb-5 rounded-lg border border-red-700 bg-red-900/30 px-4 py-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        {/* SUCCÈS */}
                        {success && (
                            <div className="mb-5 rounded-lg border border-green-700 bg-green-900/30 px-4 py-3 text-sm text-green-400">
                                {success}
                            </div>
                        )}

                        {/* NOM */}
                        {mode ===
                            "register" && (
                            <div className="mb-5">
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-medium text-gray-300"
                                >
                                    Nom
                                </label>

                                <input
                                    id="name"
                                    type="text"
                                    value={
                                        name
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setName(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Votre nom"
                                    autoComplete="name"
                                    required
                                    className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                                />
                            </div>
                        )}

                        {/* EMAIL */}
                        <div className="mb-5">
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-gray-300"
                            >
                                Adresse email
                            </label>

                            <input
                                id="email"
                                type="email"
                                value={
                                    email
                                }
                                onChange={(
                                    event
                                ) =>
                                    setEmail(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="japhet@example.com"
                                autoComplete="email"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

                        {/* MOT DE PASSE */}
                        <div className="mb-6">
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-gray-300"
                            >
                                Mot de passe
                            </label>

                            <input
                                id="password"
                                type="password"
                                value={
                                    password
                                }
                                onChange={(
                                    event
                                ) =>
                                    setPassword(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Votre mot de passe"
                                autoComplete={
                                    mode ===
                                    "login"
                                        ? "current-password"
                                        : "new-password"
                                }
                                minLength={8}
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

                        {/* BOUTON */}
                        <button
                            type="submit"
                            disabled={
                                loading
                            }
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Chargement..."
                                : mode ===
                                  "login"
                                ? "Se connecter"
                                : "Créer mon compte"}
                        </button>
                    </form>

                    {/* TEXTE EN BAS */}
                    <p className="mt-6 text-center text-sm text-gray-400">
                        {mode ===
                        "login"
                            ? "Vous n'avez pas encore de compte ? "
                            : "Vous avez déjà un compte ? "}

                        <button
                            type="button"
                            onClick={() =>
                                changeMode(
                                    mode ===
                                    "login"
                                        ? "register"
                                        : "login"
                                )
                            }
                            className="font-semibold text-blue-500 hover:text-blue-400"
                        >
                            {mode ===
                            "login"
                                ? "Inscrivez-vous"
                                : "Connectez-vous"}
                        </button>
                    </p>
                </div>
            </div>
        </main>
    );
}