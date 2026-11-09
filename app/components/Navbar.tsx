"use client";
import { API_URL } from "@/lib/config";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";


interface Conversation {
  id: number;
  unread_count?: number;
}

interface CartItem {
  id: number;
  quantity: number;
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, token, logout } = useAuth();
  const { lightOn, toggleLight } = useTheme();

  const [menuOpen, setMenuOpen] = useState(false);

  const [unreadNotifications, setUnreadNotifications] =
    useState(0);

  const [unreadMessages, setUnreadMessages] =
    useState(0);

  const [cartCount, setCartCount] =
    useState(0);

  const [favoriteCount, setFavoriteCount] =
    useState(0);

  /*
   * =====================================================
   * FAVORIS
   * =====================================================
   */

  const updateFavoriteCount = () => {
    try {
      const storedFavorites =
        localStorage.getItem("shopx_favorites");

      if (!storedFavorites) {
        setFavoriteCount(0);
        return;
      }

      const parsed: number[] =
        JSON.parse(storedFavorites);

      setFavoriteCount(
        Array.isArray(parsed)
          ? parsed.length
          : 0
      );
    } catch {
      setFavoriteCount(0);
    }
  };

  /*
   * =====================================================
   * ÉCOUTER LES MODIFICATIONS DES FAVORIS
   * =====================================================
   */

  useEffect(() => {
    updateFavoriteCount();

    const handleStorage = () => {
      updateFavoriteCount();
    };

    const handleFavoritesUpdated = () => {
      updateFavoriteCount();
    };

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "favoritesUpdated",
      handleFavoritesUpdated
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "favoritesUpdated",
        handleFavoritesUpdated
      );
    };
  }, []);

  /*
   * =====================================================
   * DONNÉES NAVIGATION
   * =====================================================
   */

  useEffect(() => {
    if (!token) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      setCartCount(0);
      return;
    }

    const fetchNavigationData = async () => {
      /*
       * NOTIFICATIONS
       */

      try {
        const response = await fetch(
          `${API_URL}/notifications`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          setUnreadNotifications(
            Number(data.unread_count || 0)
          );
        }
      } catch (error) {
        console.error(
          "Erreur notifications :",
          error
        );
      }

      /*
       * MESSAGES
       */

      try {
        const response = await fetch(
          `${API_URL}/conversations`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data: Conversation[] =
            await response.json();

          const total =
            data.reduce(
              (sum, conversation) =>
                sum +
                Number(
                  conversation.unread_count || 0
                ),
              0
            );

          setUnreadMessages(total);
        }
      } catch (error) {
        console.error(
          "Erreur messages :",
          error
        );
      }

      /*
       * PANIER
       */

      try {
        const response = await fetch(
          `${API_URL}/cart`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();

          const items: CartItem[] =
            Array.isArray(data)
              ? data
              : data.items || [];

          const total =
            items.reduce(
              (sum, item) =>
                sum +
                Number(item.quantity || 0),
              0
            );

          setCartCount(total);
        }
      } catch (error) {
        console.error(
          "Erreur panier :",
          error
        );
      }
    };

    fetchNavigationData();
  }, [token, pathname]);

  /*
   * =====================================================
   * LIEN ACTIF
   * =====================================================
   */

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname.startsWith(href);
  };

  /*
   * =====================================================
   * DÉCONNEXION
   * =====================================================
   */

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/Connexion");
  };

  /*
   * =====================================================
   * FERMER MENU MOBILE
   * =====================================================
   */

  const closeMobileMenu = () => {
    setMenuOpen(false);
  };

  /*
   * =====================================================
   * BADGE
   * =====================================================
   */

  const Badge = ({
    count,
  }: {
    count: number;
  }) => {
    if (count <= 0) {
      return null;
    }

    return (
      <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-black text-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  /*
   * =====================================================
   * STYLE DES LIENS
   *
   * IMPORTANT :
   * La Navbar reste TOUJOURS sombre.
   * lightOn ne sert PAS à éclaircir la Navbar.
   * =====================================================
   */

  const desktopLinkClass = (
    href: string
  ) => {
    const active = isActive(href);

    if (active) {
      return "rounded-xl border border-blue-400/20 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-300 transition";
    }

    return "rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-500 transition hover:bg-white/[0.03] hover:text-white";
  };

  /*
   * =====================================================
   * NAVIGATION
   * =====================================================
   */

  return (
    <header className="sticky top-0 z-50 border-b border-blue-400/10 bg-[#020407]/95 backdrop-blur-2xl">

      <div className="mx-auto flex h-[70px] max-w-7xl items-center gap-4 px-4 md:px-8">

        {/* =================================================
            LOGO
        ================================================= */}

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
              SHOP
              <span className="text-blue-400">
                X
              </span>
            </span>

            <span className="block text-[8px] uppercase tracking-[0.35em] text-zinc-600">
              Digital Store
            </span>

          </div>
        </Link>

        {/* =================================================
            NAVIGATION DESKTOP
        ================================================= */}

        <nav className="hidden flex-1 items-center justify-center gap-1 xl:flex">

          <Link
            href="/"
            className={desktopLinkClass("/")}
          >
            Accueil
          </Link>

          <Link
            href="/Produits"
            className={desktopLinkClass(
              "/Produits"
            )}
          >
            Produits
          </Link>

          <Link
            href="/Boutique"
            className={desktopLinkClass(
              "/Boutique"
            )}
          >
            Boutiques
          </Link>

          <Link
            href="/Commandes"
            className={desktopLinkClass(
              "/Commandes"
            )}
          >
            Commandes
          </Link>

          {/* FAVORIS */}

          <Link
            href="/Favoris"
            className={`relative rounded-xl border px-4 py-2.5 text-sm font-bold transition ${
              isActive("/Favoris")
                ? "border-red-400/40 bg-red-500/15 text-red-400"
                : "border-red-400/20 bg-red-500/[0.05] text-red-300 hover:border-red-400/40 hover:bg-red-500/10"
            }`}
          >
            <span className="mr-1">
              ❤️
            </span>

            Favoris

            {favoriteCount > 0 && (
              <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[9px] font-black text-white">
                {favoriteCount}
              </span>
            )}
          </Link>

          {/* MESSAGES */}

          <Link
            href="/Messageries"
            className={desktopLinkClass(
              "/Messageries"
            )}
          >
            💬 Messages

            {unreadMessages > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white">
                {unreadMessages}
              </span>
            )}
          </Link>

        </nav>

        {/* =================================================
            ACTIONS
        ================================================= */}

        <div className="ml-auto flex items-center gap-2">

          {/* =================================================
              AMPOULE
              
              L'ampoule utilise lightOn.
              La Navbar, elle, reste sombre.
          ================================================= */}

          <button
            type="button"
            onClick={toggleLight}
            title={
              lightOn
                ? "Éteindre la lumière"
                : "Allumer la lumière"
            }
            aria-label={
              lightOn
                ? "Éteindre la lumière"
                : "Allumer la lumière"
            }
            className={`flex h-10 w-10 items-center justify-center rounded-xl border text-lg transition-all duration-500 ${
              lightOn
                ? "border-yellow-400/50 bg-yellow-400/15 text-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.25)]"
                : "border-white/10 bg-white/[0.03] text-zinc-500 hover:border-yellow-400/30 hover:bg-yellow-400/10 hover:text-yellow-300"
            }`}
          >
            💡
          </button>

          {/* =================================================
              PANIER
          ================================================= */}

          <Link
            href="/Panier"
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-blue-400/30 hover:bg-blue-500/10"
          >
            🛒

            <Badge count={cartCount} />
          </Link>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <Link
            href="/Notifications"
            className="relative hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] transition hover:border-blue-400/30 hover:bg-blue-500/10 sm:flex"
          >
            🔔

            <Badge
              count={unreadNotifications}
            />
          </Link>

          {/* =================================================
              COMPTE
          ================================================= */}

          <Link
            href="/Compte"
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-blue-400/30 hover:bg-blue-500/10"
          >

            <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 text-[10px] font-black text-black">

              {user?.profile_photo_url ? (
                <img
                  src={user.profile_photo_url}
                  alt={user.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                user?.name
                  ?.charAt(0)
                  .toUpperCase() || "?"
              )}

            </span>

            <span className="hidden text-sm font-semibold text-white md:block">
              Mon compte
            </span>

          </Link>

          {/* =================================================
              MENU MOBILE
          ================================================= */}

          <button
            type="button"
            onClick={() =>
              setMenuOpen(
                (previous) =>
                  !previous
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-xl text-white transition hover:border-blue-400/30 hover:bg-blue-500/10 xl:hidden"
            aria-label="Ouvrir le menu"
          >
            {menuOpen ? "✕" : "☰"}
          </button>

        </div>
      </div>

      {/* =====================================================
          MENU MOBILE
      ===================================================== */}

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#020407]/98 px-4 py-4 xl:hidden">

          <nav className="mx-auto flex max-w-7xl flex-col gap-2">

            <Link
              href="/"
              onClick={closeMobileMenu}
              className={desktopLinkClass("/")}
            >
              🏠 Accueil
            </Link>

            <Link
              href="/Produits"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Produits"
              )}
            >
              🛍️ Produits
            </Link>

            <Link
              href="/Boutique"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Boutique"
              )}
            >
              🏪 Boutiques
            </Link>

            <Link
              href="/Commandes"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Commandes"
              )}
            >
              📦 Commandes
            </Link>

            <Link
              href="/Favoris"
              onClick={closeMobileMenu}
              className="flex items-center justify-between rounded-xl border border-red-400/20 bg-red-500/[0.05] px-4 py-3 text-sm font-bold text-red-300"
            >
              <span>
                ❤️ Favoris
              </span>

              {favoriteCount > 0 && (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black text-white">
                  {favoriteCount}
                </span>
              )}
            </Link>

            <Link
              href="/Messageries"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Messageries"
              )}
            >
              💬 Messages

              {unreadMessages > 0 && (
                <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white">
                  {unreadMessages}
                </span>
              )}
            </Link>

            <Link
              href="/Panier"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Panier"
              )}
            >
              🛒 Panier

              {cartCount > 0 && (
                <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/Notifications"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Notifications"
              )}
            >
              🔔 Notifications

              {unreadNotifications > 0 && (
                <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-[9px] font-black text-white">
                  {unreadNotifications}
                </span>
              )}
            </Link>

            <Link
              href="/Compte"
              onClick={closeMobileMenu}
              className={desktopLinkClass(
                "/Compte"
              )}
            >
              👤 Mon compte
            </Link>

            {/* AMPOULE MOBILE */}

            <button
              type="button"
              onClick={toggleLight}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold transition ${
                lightOn
                  ? "border-yellow-400/50 bg-yellow-400/10 text-yellow-400"
                  : "border-white/10 bg-white/[0.03] text-zinc-400"
              }`}
            >
              <span>
                💡 Lumière
              </span>

              <span>
                {lightOn ? "ON" : "OFF"}
              </span>
            </button>

            {/* DÉCONNEXION */}

            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 rounded-xl border border-red-400/20 bg-red-500/[0.05] px-4 py-3 text-left text-sm font-bold text-red-400 transition hover:bg-red-500/10"
            >
              🚪 Déconnexion
            </button>

          </nav>
        </div>
      )}
    </header>
  );
}