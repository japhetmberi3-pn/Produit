"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, type ReactNode, useCallback, useEffect, useState } from "react";

import AuthModal, { OPEN_AUTH_EVENT } from "@/app/components/auth/AuthModal";
import type { AuthMode } from "@/app/components/auth/AuthForm";
import {
  BellIcon,
  CartIcon,
  CloseIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  LogoutIcon,
  MenuIcon,
  MessageIcon,
  MoonIcon,
  PackageIcon,
  SearchIcon,
  StoreIcon,
  SunIcon,
  UserIcon,
} from "@/app/components/icons";
import { useAuth } from "@/app/context/AuthContext";
import { useTheme } from "@/app/context/ThemeContext";
import { apiFetch, UnauthorizedError } from "@/lib/api";
import { CART_UPDATED_EVENT, useFavorites } from "@/lib/shop";

interface Conversation {
  id: number;
  unread_count?: number;
}

interface CartItem {
  id: number;
  quantity: number;
}

const NAV_LINKS = [
  { href: "/", label: "Accueil", icon: HomeIcon },
  { href: "/Produits", label: "Produits", icon: GridIcon },
  { href: "/Boutique", label: "Boutiques", icon: StoreIcon },
  { href: "/Commandes", label: "Mes commandes", icon: PackageIcon },
  { href: "/Messageries", label: "Messages", icon: MessageIcon },
] as const;

function CountBadge({ count, tone = "accent" }: { count: number; tone?: "accent" | "brand" }) {
  if (count <= 0) return null;

  return (
    <span
      className={`absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ring-2 ring-surface ${
        tone === "accent" ? "bg-accent text-on-accent" : "bg-brand text-on-brand"
      }`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function IconLink({
  href,
  label,
  count,
  children,
  className = "",
  tone,
}: {
  href: string;
  label: string;
  count: number;
  children: ReactNode;
  className?: string;
  tone?: "accent" | "brand";
}) {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count})` : label}
      title={label}
      className={`relative flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-2 hover:text-ink ${className}`}
    >
      {children}
      <CountBadge count={count} tone={tone} />
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();

  const { user, token, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { count: favoriteCount } = useFavorites();

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  const [counts, setCounts] = useState({ notifications: 0, messages: 0, cart: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  // Déconnecté : tous les compteurs valent 0.
  const unreadNotifications = token ? counts.notifications : 0;
  const unreadMessages = token ? counts.messages : 0;
  const cartCount = token ? counts.cart : 0;

  /* ===================== ÉVÉNEMENTS GLOBAUX ===================== */

  useEffect(() => {
    const onCartUpdated = () => setRefreshKey((key) => key + 1);
    const onOpenAuth = (event: Event) => {
      setAuthMode((event as CustomEvent<AuthMode>).detail ?? "login");
    };

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener(OPEN_AUTH_EVENT, onOpenAuth);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener(OPEN_AUTH_EVENT, onOpenAuth);
    };
  }, []);

  /* ===================== COMPTEURS ===================== */

  useEffect(() => {
    if (!token) return;

    // Annule les requêtes si la page change avant la réponse.
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      const [notifications, conversations, cart] = await Promise.allSettled([
        apiFetch<{ unread_count?: number }>("/notifications", { signal }),
        apiFetch<Conversation[]>("/conversations", { signal }),
        apiFetch<CartItem[] | { items?: CartItem[] }>("/cart", { signal }),
      ]);

      if (signal.aborted) return;

      const results = [notifications, conversations, cart];

      if (results.some((r) => r.status === "rejected" && r.reason instanceof UnauthorizedError)) {
        logout();
        return;
      }

      setCounts((previous) => {
        const next = { ...previous };

        if (notifications.status === "fulfilled") {
          next.notifications = Number(notifications.value?.unread_count || 0);
        }

        if (conversations.status === "fulfilled" && Array.isArray(conversations.value)) {
          next.messages = conversations.value.reduce(
            (sum, conversation) => sum + Number(conversation.unread_count || 0),
            0
          );
        }

        if (cart.status === "fulfilled") {
          const data = cart.value;
          const items = Array.isArray(data) ? data : data?.items || [];
          next.cart = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
        }

        return next;
      });

      results.forEach((result) => {
        if (result.status === "rejected" && !signal.aborted) {
          console.error("Erreur navigation :", result.reason);
        }
      });
    };

    load();

    return () => controller.abort();
  }, [token, pathname, refreshKey, logout]);

  /* ===================== ACTIONS ===================== */

  const closeAuth = useCallback(() => setAuthMode(null), []);

  const handleAuthSuccess = useCallback(() => {
    setAuthMode(null);
    router.push("/Produits");
  }, [router]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    const query = search.trim();

    setMenuOpen(false);
    router.push(query ? `/Produits?search=${encodeURIComponent(query)}` : "/Produits");
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const firstName = user?.name?.split(" ")[0];
  const isSeller = user?.role === "vendeur" || user?.role === "seller";

  const searchForm = (id: string) => (
    <form onSubmit={handleSearch} role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Rechercher un produit
      </label>
      <input
        id={id}
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Rechercher un produit, une marque..."
        className="h-11 w-full rounded-full border border-line bg-surface-2 pl-4 pr-12 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:bg-surface focus:ring-4 focus:ring-brand/15"
      />
      <button
        type="submit"
        aria-label="Lancer la recherche"
        className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-on-brand transition hover:bg-brand-hover"
      >
        <SearchIcon size={17} />
      </button>
    </form>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-line bg-surface/95 backdrop-blur-xl">
        {/* ===================== LIGNE PRINCIPALE ===================== */}
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-6 md:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-2 lg:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className="flex shrink-0 items-center gap-2"
            aria-label="ShopX — accueil"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-black text-on-brand">
              X
            </span>
            <span className="hidden text-xl font-extrabold tracking-tight text-ink sm:block">
              Shop<span className="text-brand">X</span>
            </span>
          </Link>

          <div className="hidden max-w-2xl flex-1 md:block">{searchForm("navbar-search")}</div>

          <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
              title={isDark ? "Mode clair" : "Mode sombre"}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft transition hover:bg-surface-2 hover:text-ink"
            >
              {isDark ? <SunIcon /> : <MoonIcon />}
            </button>

            <IconLink href="/Favoris" label="Favoris" count={favoriteCount} className="hidden sm:flex">
              <HeartIcon />
            </IconLink>

            {user && (
              <IconLink
                href="/Notifications"
                label="Notifications"
                count={unreadNotifications}
                tone="brand"
                className="hidden sm:flex"
              >
                <BellIcon />
              </IconLink>
            )}

            <IconLink href="/Panier" label="Panier" count={cartCount}>
              <CartIcon />
            </IconLink>

            {user ? (
              <Link
                href="/Compte"
                className="ml-1 flex items-center gap-2 rounded-full py-1 pl-1 pr-1 transition hover:bg-surface-2 md:pr-3"
                title="Mon compte"
              >
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-brand-soft text-sm font-bold text-brand">
                  {user.profile_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element -- URL externe fournie par l'API
                    <img src={user.profile_photo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    user.name?.charAt(0).toUpperCase() || <UserIcon size={16} />
                  )}
                </span>
                <span className="hidden text-left leading-tight md:block">
                  <span className="block text-[11px] text-muted">Bonjour,</span>
                  <span className="block max-w-[110px] truncate text-sm font-semibold text-ink">
                    {firstName || "Mon compte"}
                  </span>
                </span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setAuthMode("login")}
                className="ml-1 flex h-10 items-center gap-2 rounded-full bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-hover"
              >
                <UserIcon size={17} />
                <span className="hidden sm:inline">Se connecter</span>
              </button>
            )}
          </div>
        </div>

        {/* ===================== RECHERCHE MOBILE ===================== */}
        <div className="px-4 pb-3 md:hidden">{searchForm("navbar-search-mobile")}</div>

        {/* ===================== LIENS (DESKTOP) ===================== */}
        <nav aria-label="Navigation principale" className="hidden border-t border-line lg:block">
          <div className="mx-auto flex h-11 max-w-7xl items-center gap-1 px-6">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={`relative flex h-full items-center px-3 text-sm font-medium transition ${
                  isActive(href)
                    ? "text-brand after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {label}
                {href === "/Messageries" && unreadMessages > 0 && (
                  <span className="ml-1.5 rounded-full bg-brand px-1.5 text-[10px] font-bold text-on-brand">
                    {unreadMessages}
                  </span>
                )}
              </Link>
            ))}

            <div className="ml-auto flex items-center gap-1">
              {isSeller && (
                <Link
                  href="/Vendeur"
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-on-brand"
                >
                  Espace vendeur
                </Link>
              )}
              {user?.role === "admin" && (
                <Link
                  href="/Admin"
                  className="rounded-full bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand hover:text-on-brand"
                >
                  Administration
                </Link>
              )}
              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-danger-soft hover:text-danger"
                >
                  <LogoutIcon size={14} /> Déconnexion
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* ===================== MENU MOBILE ===================== */}
        {menuOpen && (
          <nav aria-label="Menu mobile" className="border-t border-line bg-surface lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col px-2 py-2">
              {[
                ...NAV_LINKS,
                { href: "/Favoris", label: "Favoris", icon: HeartIcon },
                { href: "/Panier", label: "Panier", icon: CartIcon },
                ...(user
                  ? [
                      { href: "/Notifications", label: "Notifications", icon: BellIcon },
                      { href: "/Compte", label: "Mon compte", icon: UserIcon },
                    ]
                  : []),
                ...(isSeller ? [{ href: "/Vendeur", label: "Espace vendeur", icon: StoreIcon }] : []),
                ...(user?.role === "admin" ? [{ href: "/Admin", label: "Administration", icon: GridIcon }] : []),
              ].map(({ href, label, icon: LinkIcon }) => {
                const badge =
                  href === "/Messageries"
                    ? unreadMessages
                    : href === "/Favoris"
                    ? favoriteCount
                    : href === "/Panier"
                    ? cartCount
                    : href === "/Notifications"
                    ? unreadNotifications
                    : 0;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                      isActive(href) ? "bg-brand-soft text-brand" : "text-ink-soft hover:bg-surface-2"
                    }`}
                  >
                    <LinkIcon size={18} />
                    <span className="flex-1">{label}</span>
                    {badge > 0 && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-on-accent">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}

              {user && (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-danger transition hover:bg-danger-soft"
                >
                  <LogoutIcon size={18} /> Déconnexion
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {authMode && <AuthModal mode={authMode} onClose={closeAuth} onSuccess={handleAuthSuccess} />}
    </>
  );
}
