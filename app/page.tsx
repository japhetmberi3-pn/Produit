"use client";
import { API_URL } from "@/lib/config";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ParallaxProvider } from "react-scroll-parallax";

import AnimatedContainer from "@/app/components/AnimatedContainer";
import ParallaxBackground from "@/app/components/ParallaxBackground";

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

interface Conversation {
  id: number;
  unread_count?: number;
}

interface CartItem {
  id: number;
  quantity: number;
}


/* =========================
   BADGE (défini hors du composant)
========================= */

function Badge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-black text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();

  const { user: currentUser, setUser } = useAuth();
  const { lightOn, toggleLight } = useTheme();

  /* =========================================================
     NAVIGATION
  ========================================================= */

  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  const updateFavoriteCount = () => {
    try {
      const storedFavorites = localStorage.getItem("shopx_favorites");

      if (!storedFavorites) {
        setFavoriteCount(0);
        return;
      }

      const parsed: number[] = JSON.parse(storedFavorites);

      setFavoriteCount(Array.isArray(parsed) ? parsed.length : 0);
    } catch {
      setFavoriteCount(0);
    }
  };

  useEffect(() => {
    updateFavoriteCount();

    const handleStorage = () => {
      updateFavoriteCount();
    };

    const handleFavoritesUpdated = () => {
      updateFavoriteCount();
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("favoritesUpdated", handleFavoritesUpdated);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      setCartCount(0);
      return;
    }

    const fetchNavigationData = async () => {
      /* NOTIFICATIONS */

      try {
        const response = await fetch(`${API_URL}/notifications`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          setUnreadNotifications(Number(data.unread_count || 0));
        }
      } catch (error) {
        console.error("Erreur notifications :", error);
      }

      /* MESSAGES */

      try {
        const response = await fetch(`${API_URL}/conversations`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: Conversation[] = await response.json();

          const total = data.reduce(
            (sum, conversation) =>
              sum + Number(conversation.unread_count || 0),
            0
          );

          setUnreadMessages(total);
        }
      } catch (error) {
        console.error("Erreur messages :", error);
      }

      /* PANIER */

      try {
        const response = await fetch(`${API_URL}/cart`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          const items: CartItem[] = Array.isArray(data)
            ? data
            : data.items || [];

          const total = items.reduce(
            (sum, item) => sum + Number(item.quantity || 0),
            0
          );

          setCartCount(total);
        }
      } catch (error) {
        console.error("Erreur panier :", error);
      }
    };

    fetchNavigationData();
  }, [currentUser, pathname]);

  /* =========================
     LIENS ACTIFS
  ========================= */

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  const desktopLinkClass = (href: string) => {
    const active = isActive(href);

    if (active) {
      return "rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition";
    }

    return "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.03] hover:text-white";
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setShowMobileMenu(false);

    router.push("/");
  };

  /* =========================================================
     HOME / AUTH
  ========================================================= */

  const [search, setSearch] = useState("");

  const [authMode, setAuthMode] = useState<"login" | "register">("login");

  const [showAuth, setShowAuth] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "vendeur">("client");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const openAuth = (mode: "login" | "register") => {
    setAuthMode(mode);
    setShowAuth(true);
    setError("");
    setShowMobileMenu(false);
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();

    if (!search.trim()) {
      router.push("/Produits");
      return;
    }

    router.push(`/Produits?search=${encodeURIComponent(search.trim())}`);
  };

  const handleAuth = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      const endpoint = authMode === "login" ? "/login" : "/register";

      const body =
        authMode === "login"
          ? { email, password }
          : { name, email, password, role };

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

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      if (data.user) {
        setUser(data.user);
      }

      setShowAuth(false);

      setName("");
      setEmail("");
      setPassword("");
      setRole("client");
      setError("");

      router.push("/Produits");
    } catch {
      setError(
        "Impossible de contacter le serveur. Vérifie que Laravel est lancé."
      );
    } finally {
      setLoading(false);
    }
  };

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
        {/* =====================================================
            NAVBAR
        ===================================================== */}

        <header className="sticky top-0 z-50 border-b border-blue-400/10 bg-[#020407]/95 backdrop-blur-2xl">
          <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
            {/* LOGO */}

            <Link
              href="/"
              onClick={closeMobileMenu}
              className="group flex shrink-0 items-center gap-3"
            >
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-blue-400/40 bg-blue-500/10 shadow-[0_0_25px_rgba(37,99,235,0.2)]">
                <span className="text-lg font-black italic text-blue-400">
                  X
                </span>

                <span className="pointer-events-none absolute inset-0 rounded-xl bg-blue-400/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              </div>

              <div className="hidden sm:block">
                <span className="block text-lg font-black tracking-wider text-white">
                  SHOP<span className="text-blue-400">X</span>
                </span>

                <span className="block text-[8px] uppercase tracking-[0.35em] text-zinc-600">
                  Digital Store
                </span>
              </div>
            </Link>

            {/* NAV DESKTOP */}

            <nav className="hidden items-center gap-1 lg:flex">
              <Link href="/" className={desktopLinkClass("/")}>
                Accueil
              </Link>

              <Link href="/Produits" className={desktopLinkClass("/Produits")}>
                Produits
              </Link>

              <Link href="/Boutique" className={desktopLinkClass("/Boutique")}>
                Boutiques
              </Link>

              <Link
                href="/Commandes"
                className={desktopLinkClass("/Commandes")}
              >
                Commandes
              </Link>

              <Link
                href="/Favoris"
                className={`relative ${desktopLinkClass("/Favoris")}`}
              >
                <span className="flex items-center gap-2">
                  <span>♡</span>
                  <span>Favoris</span>
                </span>

                <Badge count={favoriteCount} />
              </Link>

              <Link
                href="/Messageries"
                className={`relative ${desktopLinkClass("/Messageries")}`}
              >
                <span className="flex items-center gap-2">
                  <span>💬</span>
                  <span>Messages</span>
                </span>

                <Badge count={unreadMessages} />
              </Link>
            </nav>

            {/* ACTIONS */}

            <div className="hidden items-center gap-2 sm:flex">
              {/* LIGHT */}

              <button
                type="button"
                onClick={toggleLight}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-zinc-400 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                title={lightOn ? "Mode sombre" : "Mode lumière"}
              >
                {lightOn ? "☀️" : "🌙"}
              </button>

              {/* PANIER */}

              <Link
                href="/Panier"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-zinc-400 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                title="Panier"
              >
                🛒
                <Badge count={cartCount} />
              </Link>

              {/* NOTIFICATIONS */}

              <Link
                href="/Notifications"
                className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-sm text-zinc-400 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white sm:flex"
                title="Notifications"
              >
                🔔
                <Badge count={unreadNotifications} />
              </Link>

              {/* COMPTE / CONNEXION */}

              {currentUser ? (
                <Link
                  href="/Compte"
                  className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-zinc-400 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white"
                  title="Mon compte"
                >
                  {currentUser.profile_photo_url ? (
                    <img
                      src={currentUser.profile_photo_url}
                      alt="Profil"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-400">
                      {currentUser.name
                        ? currentUser.name.charAt(0).toUpperCase()
                        : "?"}
                    </span>
                  )}

                  <span className="hidden xl:block">
                    {currentUser.name || "Mon compte"}
                  </span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuth("login")}
                  className="flex h-10 items-center rounded-xl bg-blue-500 px-4 text-sm font-semibold text-white transition hover:bg-blue-400"
                >
                  Connexion
                </button>
              )}
            </div>

            {/* MOBILE BUTTON */}

            <button
              type="button"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-lg text-zinc-300 transition hover:border-blue-400/20 hover:bg-blue-500/10 hover:text-white lg:hidden"
              aria-label="Menu"
            >
              {showMobileMenu ? "✕" : "☰"}
            </button>
          </div>

          {/* =================================================
              MOBILE MENU
          ================================================= */}

          {showMobileMenu && (
            <div className="border-t border-blue-400/10 bg-[#020407]/98 px-4 py-5 backdrop-blur-2xl lg:hidden">
              <div className="mx-auto flex max-w-7xl flex-col gap-2">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className={desktopLinkClass("/")}
                >
                  Accueil
                </Link>

                <Link
                  href="/Produits"
                  onClick={closeMobileMenu}
                  className={desktopLinkClass("/Produits")}
                >
                  Produits
                </Link>

                <Link
                  href="/Boutique"
                  onClick={closeMobileMenu}
                  className={desktopLinkClass("/Boutique")}
                >
                  Boutiques
                </Link>

                <Link
                  href="/Commandes"
                  onClick={closeMobileMenu}
                  className={desktopLinkClass("/Commandes")}
                >
                  Commandes
                </Link>

                <Link
                  href="/Favoris"
                  onClick={closeMobileMenu}
                  className={`relative ${desktopLinkClass("/Favoris")}`}
                >
                  <span className="flex items-center justify-between">
                    <span>♡ Favoris</span>

                    {favoriteCount > 0 && (
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">
                        {favoriteCount > 99 ? "99+" : favoriteCount}
                      </span>
                    )}
                  </span>
                </Link>

                <Link
                  href="/Messageries"
                  onClick={closeMobileMenu}
                  className={`relative ${desktopLinkClass("/Messageries")}`}
                >
                  <span className="flex items-center justify-between">
                    <span>💬 Messages</span>

                    {unreadMessages > 0 && (
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">
                        {unreadMessages > 99 ? "99+" : unreadMessages}
                      </span>
                    )}
                  </span>
                </Link>

                <Link
                  href="/Panier"
                  onClick={closeMobileMenu}
                  className={`relative ${desktopLinkClass("/Panier")}`}
                >
                  <span className="flex items-center justify-between">
                    <span>🛒 Panier</span>

                    {cartCount > 0 && (
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">
                        {cartCount > 99 ? "99+" : cartCount}
                      </span>
                    )}
                  </span>
                </Link>

                <Link
                  href="/Notifications"
                  onClick={closeMobileMenu}
                  className={`relative ${desktopLinkClass("/Notifications")}`}
                >
                  <span className="flex items-center justify-between">
                    <span>🔔 Notifications</span>

                    {unreadNotifications > 0 && (
                      <span className="rounded-full bg-blue-500 px-2 py-1 text-[10px] font-bold text-white">
                        {unreadNotifications > 99
                          ? "99+"
                          : unreadNotifications}
                      </span>
                    )}
                  </span>
                </Link>

                {currentUser && (
                  <Link
                    href="/Compte"
                    onClick={closeMobileMenu}
                    className={desktopLinkClass("/Compte")}
                  >
                    👤 Mon compte
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => {
                    toggleLight();
                    closeMobileMenu();
                  }}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.03] hover:text-white"
                >
                  <span>{lightOn ? "☀️ Mode lumière" : "🌙 Mode sombre"}</span>

                  <span>{lightOn ? "Activé" : "Désactivé"}</span>
                </button>

                {currentUser ? (
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-2 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3 text-left text-sm font-semibold text-red-400 transition hover:bg-red-500/10"
                  >
                    🚪 Déconnexion
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openAuth("login")}
                    className="mt-2 rounded-xl bg-blue-500 px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    Connexion
                  </button>
                )}
              </div>
            </div>
          )}
        </header>

        {/* =====================================================
            BACKGROUND
        ===================================================== */}

        <ParallaxBackground />

        {/* =====================================================
            HERO
        ===================================================== */}

        <section className="relative z-10 mx-auto flex min-h-[75vh] max-w-7xl items-center px-6 py-20">
          <AnimatedContainer>
            <div className="max-w-3xl">
              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.3em] text-blue-400">
                Bienvenue sur ShopX
              </p>

              <h1
                className={`text-5xl font-black leading-tight transition-all duration-700 sm:text-6xl lg:text-7xl ${
                  lightOn ? "drop-shadow-[0_0_25px_rgba(59,130,246,0.18)]" : ""
                }`}
              >
                Achetez.
                <br />
                Vendez.
                <br />
                <span className="text-blue-400">Simplement.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-gray-400">
                Découvrez des produits, passez vos commandes et gérez votre
                activité depuis une seule plateforme.
              </p>

              {/* RECHERCHE */}

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
                    lightOn ? "shadow-[0_0_25px_rgba(59,130,246,0.35)]" : ""
                  }`}
                >
                  Rechercher
                </button>
              </form>

              {/* BUTTONS */}

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/Produits"
                  className={`rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all duration-300 hover:bg-gray-200 ${
                    lightOn ? "shadow-[0_0_25px_rgba(255,255,255,0.15)]" : ""
                  }`}
                >
                  Voir le catalogue
                </Link>

                {!currentUser && (
                  <button
                    type="button"
                    onClick={() => openAuth("register")}
                    className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
                  >
                    Créer un compte
                  </button>
                )}
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* =====================================================
            CATEGORIES
        ===================================================== */}

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
                Trouvez rapidement les produits qui correspondent à vos
                besoins.
              </p>
            </div>
          </AnimatedContainer>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                title: "Mode",
                description: "Vêtements, chaussures et accessoires.",
                emoji: "👟",
              },
              {
                title: "Électronique",
                description: "Téléphones, ordinateurs et accessoires.",
                emoji: "💻",
              },
              {
                title: "Maison",
                description: "Produits et accessoires pour la maison.",
                emoji: "🏠",
              },
              {
                title: "Autres",
                description: "Découvrez encore plus de produits.",
                emoji: "✨",
              },
            ].map((category, index) => (
              <AnimatedContainer key={category.title} delay={index * 0.08}>
                <Link
                  href="/Produits"
                  className={`group block rounded-2xl border p-7 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 ${
                    lightOn
                      ? "border-blue-400/15 bg-slate-950/45 shadow-[0_0_35px_rgba(59,130,246,0.06)] hover:border-blue-400/40 hover:bg-slate-900/60"
                      : "border-white/10 bg-zinc-950/60 hover:border-blue-500/40 hover:bg-zinc-900/70"
                  }`}
                >
                  <div className="text-4xl">{category.emoji}</div>

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

        {/* =====================================================
            CTA
        ===================================================== */}

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
                  Explorez le catalogue ShopX et trouvez facilement les
                  produits dont vous avez besoin.
                </p>

                <Link
                  href="/Produits"
                  className={`mt-8 inline-flex rounded-xl bg-blue-500 px-7 py-3 font-semibold text-white transition-all duration-300 hover:bg-blue-400 ${
                    lightOn ? "shadow-[0_0_30px_rgba(59,130,246,0.35)]" : ""
                  }`}
                >
                  Commencer maintenant
                </Link>
              </div>
            </div>
          </AnimatedContainer>
        </section>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <footer
          className={`relative z-10 border-t backdrop-blur-xl transition-all duration-700 ${
            lightOn
              ? "border-blue-400/15 bg-slate-950/65"
              : "border-white/10 bg-black/80"
          }`}
        >
          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Link href="/" className="text-2xl font-black text-white">
                Shop<span className="text-blue-400">X</span>
              </Link>

              <p className="mt-5 max-w-xs text-sm leading-7 text-gray-500">
                Une plateforme simple et moderne pour acheter et vendre vos
                produits.
              </p>
            </div>

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
                  href="/Reviews"
                  className="text-sm text-gray-500 transition hover:text-white"
                >
                  ⭐ Avis & évaluations
                </Link>
              </div>
            </div>

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
              <p>© {new Date().getFullYear()} ShopX. Tous droits réservés.</p>

              <p>Acheter et vendre simplement.</p>
            </div>
          </div>
        </footer>

        {/* =====================================================
            AUTH MODAL
        ===================================================== */}

        {showAuth && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md">
            <div className={`max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-2xl border p-6 backdrop-blur-xl transition-all duration-700 ${
                lightOn
                  ? "border-blue-400/25 bg-blue-500/10 shadow-[0_0_60px_rgba(59,130,246,0.12)]"
                  : "border-blue-500/20 bg-blue-500/10"
              }`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-white">
                    {authMode === "login" ? "Connexion" : "Créer un compte"}
                  </h2>

                  <p className="mt-1 text-xs text-gray-400">
                    {authMode === "login"
                      ? "Connectez-vous à votre compte ShopX."
                      : "Rejoignez ShopX dès maintenant."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAuth(false)}
                  className="text-xl leading-none text-gray-500 transition hover:text-white"
                  aria-label="Fermer"
                >
                  ×
                </button>
              </div>

              <form
                onSubmit={handleAuth}
                className="mt-5 flex flex-col gap-4"
              >
                {authMode === "register" && (
                  <>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      aria-label="Nom"
                      className="w-full rounded-lg border border-blue-400/20 bg-blue-500/10 px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-400"
                      placeholder="Votre nom"
                    />

                    <div
                      role="radiogroup"
                      aria-label="Type de compte"
                      className="grid grid-cols-2 gap-1 rounded-lg border border-blue-400/20 bg-blue-500/10 p-1"
                    >
                      {[
                        { value: "client" as const, label: "🛒 Client" },
                        { value: "vendeur" as const, label: "🛍️ Vendeur" },
                      ].map((option) => {
                        const selected = role === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setRole(option.value)}
                            className={`rounded-md py-2.5 text-sm font-semibold transition ${
                              selected
                                ? "bg-blue-500 text-white"
                                : "text-gray-400 hover:text-white"
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  aria-label="Email"
                  className="w-full rounded-lg border border-blue-400/20 bg-blue-500/10 px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-400"
                  placeholder="vous@example.com"
                />

                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  aria-label="Mot de passe"
                  className="w-full rounded-lg border border-blue-400/20 bg-blue-500/10 px-3.5 py-3 text-sm text-white outline-none placeholder:text-gray-500 focus:border-blue-400"
                  placeholder="Mot de passe"
                />

                {error && (
                  <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-2.5 text-xs text-red-400">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-lg bg-blue-500 py-3 text-sm font-semibold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Chargement..."
                    : authMode === "login"
                    ? "Se connecter"
                    : "Créer mon compte"}
                </button>
              </form>

              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-blue-400/20" />

                <span className="text-[10px] text-gray-500">OU</span>

                <div className="h-px flex-1 bg-blue-400/20" />
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full rounded-lg border border-blue-400/20 bg-blue-500/10 py-3 text-sm font-medium text-white transition hover:bg-blue-500/20"
              >
                Continuer avec Google
              </button>

              <div className="mt-5 text-center text-xs text-gray-400">
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