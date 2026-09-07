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

const [role, setRole] = useState<
    "client" | "vendeur"
>("client");

const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [success, setSuccess] = useState("");

const [isLoggedIn, setIsLoggedIn] =
    useState(false);

useEffect(() => {
    const token =
        localStorage.getItem("token");

    setIsLoggedIn(!!token);
}, []);

// ==========================================
// DÉCONNEXION
// ==========================================
const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setIsLoggedIn(false);
    setSuccess("Vous êtes déconnecté.");
    setError("");
};

// ==========================================
// CONNEXION / INSCRIPTION
// ==========================================
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
                      role,
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

        // Sauvegarder le token
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

        setIsLoggedIn(true);

        // ==================================
        // CONNEXION
        // ==================================
        if (mode === "login") {
            setSuccess(
                "Connexion réussie !"
            );

            setEmail("");
            setPassword("");

            if (
                authData.user.role ===
                    "vendeur" ||
                authData.user.role ===
                    "seller"
            ) {
                router.push(
                    "/MaBoutique"
                );
            } else {
                router.push(
                    "/Produits"
                );
            }

            return;
        }

        // ==================================
        // INSCRIPTION
        // ==================================
        setSuccess(
            "Compte créé avec succès !"
        );

        setName("");
        setEmail("");
        setPassword("");
        setRole("client");

        if (
            authData.user.role ===
                "vendeur" ||
            authData.user.role ===
                "seller"
        ) {
            router.push(
                "/MaBoutique"
            );
        } else {
            router.push(
                "/Produits"
            );
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

// ==========================================
// CHANGER CONNEXION / INSCRIPTION
// ==========================================
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

                {/* CONNEXION / INSCRIPTION */}
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

                    {/* RÔLE */}
                    {mode ===
                        "register" && (
                        <div className="mb-5">
                            <label
                                htmlFor="role"
                                className="mb-2 block text-sm font-medium text-gray-300"
                            >
                                Type de compte
                            </label>

                            <select
                                id="role"
                                value={
                                    role
                                }
                                onChange={(
                                    event
                                ) =>
                                    setRole(
                                        event
                                            .target
                                            .value as
                                            | "client"
                                            | "vendeur"
                                    )
                                }
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            >
                                <option value="client">
                                    Client
                                </option>

                                <option value="vendeur">
                                    Vendeur
                                </option>
                            </select>
                        </div>
                    )}

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

                    {/* BOUTON PRINCIPAL */}
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

                    {/* GOOGLE */}
                    {mode ===
                        "login" && (
                        <>
                            <div className="my-6 flex items-center gap-3">
                                <div className="h-px flex-1 bg-gray-700" />

                                <span className="text-sm text-gray-500">
                                    OU
                                </span>

                                <div className="h-px flex-1 bg-gray-700" />
                            </div>

                            <a
                                href="http://127.0.0.1:8000/api/auth/google"
                                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-700 bg-white px-4 py-3 font-semibold text-gray-800 transition hover:bg-gray-100"
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path
                                        fill="#4285F4"
                                        d="M21.35 12.27c0-.68-.06-1.34-.17-1.97H12v3.73h5.22a4.46 4.46 0 0 1-1.94 2.93v2.44h3.14c1.84-1.69 2.93-4.18 2.93-7.13Z"
                                    />

                                    <path
                                        fill="#34A853"
                                        d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.44c-.87.58-1.98.92-3.31.92-2.54 0-4.7-1.72-5.47-4.04H3.29v2.52A9.75 9.75 0 0 0 12 21.75Z"
                                    />

                                    <path
                                        fill="#FBBC05"
                                        d="M6.53 13.84A5.86 5.86 0 0 1 6.22 12c0-.64.11-1.26.31-1.84V7.64H3.29A9.75 9.75 0 0 0 2.25 12c0 1.57.38 3.05 1.04 4.36l3.24-2.52Z"
                                    />

                                    <path
                                        fill="#EA4335"
                                        d="M12 6.12c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.14 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.71 5.39l3.24 2.52C7.3 7.84 9.46 6.12 12 6.12Z"
                                    />
                                </svg>

                                Continuer avec Google
                            </a>
                        </>
                    )}
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
