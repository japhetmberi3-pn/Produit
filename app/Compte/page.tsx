"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedContainer from "@/app/components/AnimatedContainer";

interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
}

export default function ComptePage() {
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!token || !storedUser) {
            router.push("/");
            return;
        }

        try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
        } catch (error) {
            console.error(
                "Erreur lecture utilisateur :",
                error
            );

            localStorage.removeItem("user");
            localStorage.removeItem("token");

            router.push("/");
        } finally {
            setLoading(false);
        }
    }, [router]);

    // =====================================================
    // DÉCONNEXION
    // =====================================================

    const handleLogout = async () => {
        const token = localStorage.getItem("token");

        setLoggingOut(true);

        try {
            if (token) {
                await fetch(
                    "http://127.0.0.1:8000/api/logout",
                    {
                        method: "POST",
                        headers: {
                            Accept: "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
            }
        } catch (error) {
            console.error(
                "Erreur déconnexion :",
                error
            );
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            router.push("/");
        }
    };

    // =====================================================
    // CHARGEMENT
    // =====================================================

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
                <AnimatedContainer>
                    <div className="text-center">
                        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-blue-500" />

                        <p className="text-sm text-gray-500">
                            Chargement de votre compte...
                        </p>
                    </div>
                </AnimatedContainer>
            </main>
        );
    }

    if (!user) {
        return null;
    }

    // =====================================================
    // PAGE COMPTE
    // =====================================================

    return (
        <main className="min-h-screen bg-[#05070d] text-white">

            {/* =================================================
                NAVIGATION
            ================================================= */}

            <nav className="fixed left-3 right-3 top-3 z-50 mx-auto max-w-7xl rounded-2xl border border-white/10 bg-[#090c13]/90 px-5 py-3 shadow-2xl backdrop-blur-xl">

                <div className="flex items-center justify-between gap-5">

                    {/* LOGO */}

                    <AnimatedContainer delay={0}>
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 font-black shadow-lg shadow-blue-600/20 transition duration-300 hover:scale-110">
                                X
                            </div>

                            <span className="text-xl font-black">
                                Shop
                                <span className="text-blue-500">
                                    X
                                </span>
                            </span>
                        </Link>
                    </AnimatedContainer>

                    {/* MENU */}

                    <div className="hidden items-center gap-7 md:flex">

                        <AnimatedContainer delay={0.1}>
                            <Link
                                href="/"
                                className="text-sm text-gray-400 transition hover:text-white"
                            >
                                Accueil
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.15}>
                            <Link
                                href="/Produits"
                                className="text-sm text-gray-400 transition hover:text-white"
                            >
                                Catalogue
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.2}>
                            <Link
                                href="/Panier"
                                className="text-sm text-gray-400 transition hover:text-white"
                            >
                                Panier
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.25}>
                            <Link
                                href="/Favoris"
                                className="text-sm text-gray-400 transition hover:text-white"
                            >
                                Favoris
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.3}>
                            <Link
                                href="/Compte"
                                className="text-sm font-semibold text-blue-400"
                            >
                                Mon compte
                            </Link>
                        </AnimatedContainer>

                    </div>

                    {/* DÉCONNEXION */}

                    <AnimatedContainer delay={0.35}>
                        <button
                            type="button"
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 hover:bg-red-500 disabled:opacity-50"
                        >
                            {loggingOut
                                ? "Déconnexion..."
                                : "Déconnexion"}
                        </button>
                    </AnimatedContainer>

                </div>
            </nav>

            {/* =================================================
                CONTENU
            ================================================= */}

            <section className="relative px-5 pb-20 pt-36">

                {/* GLOW */}

                <div className="pointer-events-none absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/10 blur-[130px]" />

                <div className="relative mx-auto max-w-5xl">

                    {/* TITRE */}

                    <AnimatedContainer delay={0.15}>
                        <div className="mb-10">

                            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-400">
                                Espace personnel
                            </p>

                            <h1 className="text-4xl font-black sm:text-5xl">
                                Mon compte
                            </h1>

                            <p className="mt-3 text-gray-500">
                                Gérez vos informations et
                                retrouvez votre espace ShopX.
                            </p>

                        </div>
                    </AnimatedContainer>

                    {/* =================================================
                        PROFIL
                    ================================================= */}

                    <div className="grid gap-6 lg:grid-cols-3">

                        {/* CARTE PROFIL */}

                        <AnimatedContainer delay={0.25}>
                            <div className="rounded-3xl border border-white/10 bg-[#0b0f18] p-7 transition duration-300 hover:-translate-y-1 hover:border-blue-500/30">

                                <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

                                    {/* AVATAR */}

                                    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-black shadow-xl shadow-blue-600/20 transition duration-500 hover:scale-105 hover:rotate-3">
                                        {user.name
                                            .charAt(0)
                                            .toUpperCase()}
                                    </div>

                                    <div>

                                        <div className="flex flex-wrap items-center gap-3">

                                            <h2 className="text-2xl font-black">
                                                {user.name}
                                            </h2>

                                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                                                En ligne
                                            </span>

                                        </div>

                                        <p className="mt-2 text-gray-500">
                                            {user.email}
                                        </p>

                                        <span className="mt-4 inline-flex rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold capitalize text-blue-400">
                                            {user.role ||
                                                "Client"}
                                        </span>

                                    </div>

                                </div>

                            </div>
                        </AnimatedContainer>

                        {/* ID UTILISATEUR */}

                        <AnimatedContainer delay={0.35}>
                            <div className="rounded-3xl border border-white/10 bg-[#0b0f18] p-7 transition duration-300 hover:-translate-y-1 hover:border-indigo-500/30">

                                <p className="text-xs font-semibold uppercase tracking-widest text-gray-600">
                                    Identifiant
                                </p>

                                <p className="mt-4 text-3xl font-black">
                                    #{user.id}
                                </p>

                                <p className="mt-2 text-sm text-gray-500">
                                    Identifiant de votre compte
                                    ShopX.
                                </p>

                            </div>
                        </AnimatedContainer>

                    </div>

                    {/* =================================================
                        INFORMATIONS
                    ================================================= */}

                    <AnimatedContainer delay={0.45}>
                        <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b0f18] p-7">

                            <div className="mb-7">

                                <h2 className="text-xl font-bold">
                                    Informations personnelles
                                </h2>

                                <p className="mt-1 text-sm text-gray-500">
                                    Informations associées à
                                    votre compte.
                                </p>

                            </div>

                            <div className="grid gap-5 sm:grid-cols-2">

                                {/* NOM */}

                                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Nom
                                    </p>

                                    <p className="mt-2 font-semibold">
                                        {user.name}
                                    </p>

                                </div>

                                {/* EMAIL */}

                                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Adresse email
                                    </p>

                                    <p className="mt-2 break-all font-semibold">
                                        {user.email}
                                    </p>

                                </div>

                                {/* ROLE */}

                                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Type de compte
                                    </p>

                                    <p className="mt-2 font-semibold capitalize">
                                        {user.role ||
                                            "Client"}
                                    </p>

                                </div>

                                {/* STATUT */}

                                <div className="rounded-2xl border border-white/5 bg-black/20 p-5 transition duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]">

                                    <p className="text-xs uppercase tracking-wider text-gray-600">
                                        Statut
                                    </p>

                                    <div className="mt-2 flex items-center gap-2">

                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />

                                        <span className="font-semibold text-emerald-400">
                                            Connecté
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>
                    </AnimatedContainer>

                    {/* =================================================
                        RACCOURCIS
                    ================================================= */}

                    <div className="mt-6 grid gap-4 sm:grid-cols-3">

                        <AnimatedContainer delay={0.55}>
                            <Link
                                href="/Produits"
                                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
                            >
                                <p className="text-sm font-semibold">
                                    Catalogue
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                    Découvrir les produits
                                </p>

                                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                                    →
                                </span>
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.65}>
                            <Link
                                href="/Panier"
                                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
                            >
                                <p className="text-sm font-semibold">
                                    Mon panier
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                    Voir mes articles
                                </p>

                                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                                    →
                                </span>
                            </Link>
                        </AnimatedContainer>

                        <AnimatedContainer delay={0.75}>
                            <Link
                                href="/Commandes"
                                className="group block rounded-2xl border border-white/10 bg-[#0b0f18] p-6 transition duration-300 hover:-translate-y-2 hover:border-blue-500/30"
                            >
                                <p className="text-sm font-semibold">
                                    Mes commandes
                                </p>

                                <p className="mt-2 text-xs text-gray-500">
                                    Consulter mes achats
                                </p>

                                <span className="mt-5 block text-blue-400 transition group-hover:translate-x-2">
                                    →
                                </span>
                            </Link>
                        </AnimatedContainer>

                    </div>

                </div>
            </section>

            {/* =================================================
                FOOTER
            ================================================= */}

            <AnimatedContainer delay={0.85}>
                <footer className="border-t border-white/5 bg-[#03050a] px-5 py-10">

                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-gray-600 sm:flex-row">

                        <div className="font-black text-white">
                            Shop
                            <span className="text-blue-500">
                                X
                            </span>
                        </div>

                        <p>
                            © 2026 ShopX. Tous droits réservés.
                        </p>

                    </div>

                </footer>
            </AnimatedContainer>

        </main>
    );
}
