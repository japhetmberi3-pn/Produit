"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";

import AnimatedContainer from "@/app/components/AnimatedContainer";
import ParallaxBackground from "@/app/components/ParallaxBackground";
import Navbar from "@/app/components/Navbar";

import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";

interface AuthResponse {
  token?: string;
  user?: {
    id: number;
    name: string;
    email?: string;
    role?: string;
    profile_photo?: string | null;
    profile_photo_url?: string | null;
  };
  message?: string;
  errors?: Record<string, string[]>;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function HomePage() {
  const router = useRouter();

  // ================= CONTEXTS =================

  const { user: currentUser, setUser } = useAuth();
  const { lightOn } = useTheme();

  // ================= ÉTATS =================

  const [search, setSearch] = useState("");

  const [authMode, setAuthMode] =
    useState<"login" | "register">("login");

  const [showAuth, setShowAuth] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ================= RECHERCHE =================

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!search.trim()) {
      router.push("/Produits");
      return;
    }

    router.push(
      `/Produits?search=${encodeURIComponent(search.trim())}`
    );
  };

  // ================= AUTHENTIFICATION =================

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint =
        authMode === "login" ? "/login" : "/register";

      const body =
        authMode === "login"
          ? {
              email,
              password,
            }
          : {
              name,
              email,
              password,
            };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            Object.values(data.errors || {})
              .flat()
              .join(" ") ||
            "Une erreur est survenue."
        );

        return;
      }

      // ================= TOKEN =================

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      // ================= UTILISATEUR =================

      if (data.user) {
        setUser(data.user);
      }

      // ================= RESET =================

      setShowAuth(false);

      setName("");
      setEmail("");
      setPassword("");
      setError("");

      // ================= REDIRECTION =================

      router.push("/Produits");
    } catch {
      setError(
        "Impossible de contacter le serveur. Vérifie que Laravel est lancé."
      );
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE =================

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <ParallaxProvider>
      <main
        className={`relative min-h-screen overflow-hidden text-white transition-all duration-1000 ${
          lightOn ? "bg-[#020617]" : "bg-black"
        }`}
      >
        {/* =========================================================
            NAVBAR CENTRALISÉE
        ========================================================= */}

        <Navbar />

        {/* =========================================================
            PARALLAX BACKGROUND
        ========================================================= */}

        <ParallaxBackground />

        {/* =========================================================
            HERO
        ========================================================= */}

        <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 py-20">
          <AnimatedContainer>
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Bienvenue sur ShopX
              </p>

              <h1
                className={`text-5xl font-black leading-tight transition-all duration-700 sm:text-6xl lg:text-7xl ${
                  lightOn
                    ? "drop-shadow-[0_0_25px_rgba(59,130,246,0.18)]"
                    : ""
                }`}
              >
                Achetez.
                <br />
                Vendez.
                <br />
                <span className="text-blue-400">
                  Simplement.
                </span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400">
                Découvrez des produits, passez vos commandes et
                gérez votre activité depuis une seule plateforme.
              </p>

              {/* =====================================================
                  RECHERCHE
              ===================================================== */}

              <form
                onSubmit={handleSearch}
                className="mt-10 flex max-w-2xl flex-col gap-3 sm:flex-row"
              >
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un produit..."
                  className={`flex-1 rounded-xl border px-5 py-4 text-white outline-none transition-all duration-500 placeholder:text-gray-600 ${
                    lightOn
                      ? "border-blue-400/20 bg-slate-950/60 shadow-[0_0_30px_rgba(59,130,246,0.08)] focus:border-blue-400"
                      : "border-white/10 bg-zinc-950/80 focus:border-blue-500"
                  }`}
                />

                <button
                  type="submit"
                  className={`rounded-xl bg-blue-500 px-7 py-4 font-semibold text-white transition-all duration-300 hover:bg-blue-400 ${
                    lightOn
                      ? "shadow-[0_0_25px_rgba(59,130,246,0.35)]"
                      : ""
                  }`}
                >
                  Rechercher
                </button>
              </form>

              {/* =====================================================
                  BOUTONS HERO
              ===================================================== */}

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/Produits"
                  className={`rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all duration-300 hover:bg-gray-200 ${
                    lightOn
                      ? "shadow-[0_0_25px_rgba(255,255,255,0.15)]"
                      : ""
                  }`}
                >
                  Voir le catalogue
                </Link>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("register");
                      setShowAuth(true);
                      setError("");
                    }}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Créer un compte
                  </button>
                )}
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* =========================================================
            CATÉGORIES
        ========================================================= */}

        <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
          <AnimatedContainer>
            <div className="mb-12">
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                Explorer
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Découvrez nos catégories
              </h2>

              <p className="mt-4 max-w-2xl text-gray-500">
                Trouvez rapidement les produits qui correspondent
                à vos besoins.
              </p>
            </div>
          </AnimatedContainer>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Mode",
                description:
                  "Vêtements, chaussures et accessoires.",
                emoji: "👟",
              },
              {
                title: "Électronique",
                description:
                  "Téléphones, ordinateurs et accessoires.",
                emoji: "💻",
              },
              {
                title: "Maison",
                description:
                  "Produits et accessoires pour la maison.",
                emoji: "🏠",
              },
              {
                title: "Autres",
                description:
                  "Découvrez encore plus de produits.",
                emoji: "✨",
              },
            ].map((category, index) => (
              <AnimatedContainer
                key={category.title}
                delay={index * 0.08}
              >
                <Link
                  href="/Produits"
                  className={`group block rounded-2xl border p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
                    lightOn
                      ? "border-blue-400/15 bg-slate-950/45 shadow-[0_0_35px_rgba(59,130,246,0.06)] hover:border-blue-400/40 hover:bg-slate-900/60"
                      : "border-white/10 bg-zinc-950/60 hover:border-blue-500/40 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="text-4xl">
                    {category.emoji}
                  </div>

                  <h3 className="mt-6 text-xl font-bold text-white">
                    {category.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-gray-500">
                    {category.description}
                  </p>

                  <div className="mt-6 text-sm font-semibold text-blue-400 transition group-hover:text-blue-300">
                    Explorer →
                  </div>
                </Link>
              </AnimatedContainer>
            ))}
          </div>
        </section>

        {/* =========================================================
            CTA
        ========================================================= */}

        <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
          <AnimatedContainer>
            <div
              className={`overflow-hidden rounded-3xl border p-10 transition-all duration-700 sm:p-14 ${
                lightOn
                  ? "border-blue-400/25 bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.12)]"
                  : "border-blue-500/20 bg-blue-500/10"
              }`}
            >
              <div className="max-w-3xl">
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-400">
                  ShopX
                </p>

                <h2 className="mt-4 text-3xl font-black sm:text-5xl">
                  Prêt à commencer ?
                </h2>

                <p className="mt-5 max-w-2xl text-gray-400">
                  Explorez le catalogue ShopX et trouvez facilement
                  les produits dont vous avez besoin.
                </p>

                <Link
                  href="/Produits"
                  className={`mt-8 inline-flex rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-400 ${
                    lightOn
                      ? "shadow-[0_0_30px_rgba(59,130,246,0.35)]"
                      : ""
                  }`}
                >
                  Commencer maintenant
                </Link>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* =========================================================
            FOOTER
        ========================================================= */}

        <footer
          className={`relative z-10 border-t backdrop-blur-xl transition-all duration-700 ${
            lightOn
              ? "border-blue-400/15 bg-slate-950/65"
              : "border-white/10 bg-black/80"
          }`}
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
            {/* SHOPX */}
            <div>
              <Link
                href="/"
                className="text-2xl font-black text-white"
              >
                Shop<span className="text-blue-400">X</span>
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">
                Une plateforme simple et moderne pour acheter et
                vendre vos produits.
              </p>
            </div>

            {/* NAVIGATION */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Navigation
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Accueil
                </Link>

                <Link
                  href="/Produits"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Catalogue
                </Link>

                <Link
                  href="/Panier"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Panier
                </Link>

                <Link
                  href="/Favoris"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Favoris
                </Link>
              </div>
            </div>

            {/* SERVICE */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Service
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/Messageries"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  💬 Messagerie
                </Link>

                <Link
                  href="/Compte"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Mon compte
                </Link>

                <Link
                  href="/Reviews"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  ⭐ Avis & évaluations
                </Link>
              </div>
            </div>

            {/* COMPTE + DASHBOARDS */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
                Compte
              </h3>

              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/Compte"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  Mon compte
                </Link>

                <Link
                  href="/Messageries"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  💬 Messagerie
                </Link>

                {currentUser?.role === "admin" && (
                  <Link
                    href="/Admin"
                    className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                  >
                    🛡️ Dashboard Admin
                  </Link>
                )}

                {currentUser?.role === "vendeur" && (
                  <Link
                    href="/Vendeur"
                    className="text-sm font-semibold text-blue-400 transition hover:text-blue-300"
                  >
                    🛍️ Dashboard Vendeur
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                © {new Date().getFullYear()} ShopX. Tous droits
                réservés.
              </p>

              <p>Acheter et vendre simplement.</p>
            </div>
          </div>
        </footer>

        {/* =========================================================
            MODAL AUTHENTIFICATION
        ========================================================= */}

        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-7 shadow-2xl">
              {/* HEADER MODAL */}

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {authMode === "login"
                      ? "Connexion"
                      : "Créer un compte"}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {authMode === "login"
                      ? "Connectez-vous à votre compte ShopX."
                      : "Rejoignez ShopX dès maintenant."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="text-xl text-gray-500 transition hover:text-white"
                >
                  ×
                </button>
              </div>

              {/* FORMULAIRE */}

              <form
                onSubmit={handleAuth}
                className="mt-7 flex flex-col gap-4"
              >
                {/* NOM */}

                {authMode === "register" && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-300">
                      Nom
                    </label>

                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-500"
                      placeholder="Votre nom"
                    />
                  </div>
                )}

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="vous@example.com"
                  />
                </div>

                {/* MOT DE PASSE */}

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-300">
                    Mot de passe
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none focus:border-blue-500"
                    placeholder="••••••••"
                  />
                </div>

                {/* ERREUR */}

                {error && (
                  <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {/* BOUTON */}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-blue-500 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Chargement..."
                    : authMode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
                </button>
              </form>

              {/* GOOGLE */}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-white/10" />

                <span className="text-xs text-gray-600">
                  OU
                </span>

                <div className="h-px flex-1 bg-white/10" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full rounded-xl border border-white/10 bg-white/5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                Continuer avec Google
              </button>

              {/* CHANGEMENT LOGIN / REGISTER */}

              <div className="mt-6 text-center text-sm text-gray-500">
                {authMode === "login" ? (
                  <>
                    Pas encore de compte ?{" "}

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("register");
                        setError("");
                      }}
                      className="font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Inscrivez-vous
                    </button>
                  </>
                ) : (
                  <>
                    Déjà un compte ?{" "}

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode("login");
                        setError("");
                      }}
                      className="font-semibold text-blue-400 hover:text-blue-300"
                    >
                      Connectez-vous
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </ParallaxProvider>
  );
}