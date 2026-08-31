"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    name: string;
    email: string;
}

interface RegisterResponse {
    message: string;
    user: User;
    token: string;
}

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (
        event: FormEvent<HTMLFormElement>
    ) => {
        event.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {
            /*
             * Données envoyées à Laravel
             */
            const userData = {
                name: name.trim(),
                email: email.trim(),
                password: password,
            };

            console.log(
                "Données envoyées à Laravel :",
                userData
            );

            /*
             * Appel de l'API Laravel
             */
            const response = await fetch(
                "http://127.0.0.1:8000/api/register",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json",
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(userData),
                }
            );

            console.log(
                "Status Laravel :",
                response.status
            );

            const data = await response.json();

            console.log(
                "Réponse Laravel :",
                data
            );

            /*
             * Laravel retourne une erreur
             */
            if (!response.ok) {
                if (data.errors) {
                    const firstError = Object.values(
                        data.errors
                    )[0];

                    if (Array.isArray(firstError)) {
                        throw new Error(
                            String(firstError[0])
                        );
                    }
                }

                throw new Error(
                    data.message ||
                        "Impossible de créer le compte."
                );
            }

            /*
             * Vérifier que Laravel a bien créé
             * l'utilisateur et retourné le token
             */
            const registerData =
                data as RegisterResponse;

            if (
                !registerData.user ||
                !registerData.token
            ) {
                throw new Error(
                    "Laravel n'a pas retourné l'utilisateur ou le token."
                );
            }

            /*
             * Sauvegarder le token Sanctum
             */
            localStorage.setItem(
                "token",
                registerData.token
            );

            /*
             * Sauvegarder l'utilisateur connecté
             */
            localStorage.setItem(
                "user",
                JSON.stringify(registerData.user)
            );

            console.log(
                "Utilisateur créé :",
                registerData.user
            );

            console.log(
                "Token sauvegardé :",
                registerData.token
            );

            setSuccess(
                "Compte créé avec succès !"
            );

            /*
             * Nettoyer le formulaire
             */
            setName("");
            setEmail("");
            setPassword("");

            /*
             * IMPORTANT :
             * Redirection uniquement après que Laravel
             * ait confirmé la création du compte.
             */
            router.push("/Produits");
        } catch (err) {
            console.error(
                "Erreur inscription :",
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

    return (
        <main className="min-h-screen bg-black text-white">
            <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
                <div className="w-full max-w-md">

                    {/* TITRE */}
                    <div className="mb-8 text-center">
                        <h1 className="text-4xl font-bold">
                            ShopX
                        </h1>

                        <p className="mt-2 text-gray-400">
                            Créez votre compte
                        </p>
                    </div>

                    {/* FORMULAIRE */}
                    <form
                        onSubmit={handleRegister}
                        className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-2xl"
                    >
                        <h2 className="mb-6 text-2xl font-semibold">
                            Inscription
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
                                value={name}
                                onChange={(event) =>
                                    setName(
                                        event.target.value
                                    )
                                }
                                placeholder="Votre nom"
                                autoComplete="name"
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

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
                                value={email}
                                onChange={(event) =>
                                    setEmail(
                                        event.target.value
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
                                value={password}
                                onChange={(event) =>
                                    setPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Minimum 8 caractères"
                                autoComplete="new-password"
                                minLength={8}
                                required
                                className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white outline-none transition focus:border-blue-500"
                            />
                        </div>

                        {/* BOUTON */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading
                                ? "Création du compte..."
                                : "Créer mon compte"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
