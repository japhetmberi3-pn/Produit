"use client";

import Link from "next/link";

import { useAuth } from "@/app/context/AuthContext";

const columns = [
  {
    title: "Acheter",
    links: [
      { href: "/Produits", label: "Tous les produits" },
      { href: "/Boutique", label: "Boutiques" },
      { href: "/Favoris", label: "Mes favoris" },
      { href: "/Panier", label: "Mon panier" },
    ],
  },
  {
    title: "Mon compte",
    links: [
      { href: "/Compte", label: "Profil" },
      { href: "/Commandes", label: "Mes commandes" },
      { href: "/Notifications", label: "Notifications" },
      { href: "/Messageries", label: "Messagerie" },
    ],
  },
  {
    title: "Communauté",
    links: [
      { href: "/Reviews", label: "Avis clients" },
      { href: "/Recherche", label: "Recherche avancée" },
    ],
  },
];

export default function Footer() {
  const { user } = useAuth();
  const isSeller = user?.role === "vendeur" || user?.role === "seller";

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 md:px-6 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-ink">
            Shop<span className="text-brand">X</span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-6 text-muted">
            La marketplace pour découvrir des produits de boutiques indépendantes
            et vendre les vôtres simplement.
          </p>

          {isSeller ? (
            <Link
              href="/Vendeur"
              className="mt-5 inline-flex rounded-xl bg-brand-soft px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-on-brand"
            >
              Mon espace vendeur
            </Link>
          ) : user?.role === "admin" ? (
            <Link
              href="/Admin"
              className="mt-5 inline-flex rounded-xl bg-brand-soft px-4 py-2 text-sm font-semibold text-brand transition hover:bg-brand hover:text-on-brand"
            >
              Tableau de bord admin
            </Link>
          ) : null}
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-ink">{column.title}</h3>
            <ul className="mt-3 space-y-2.5">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted transition hover:text-brand">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between md:px-6">
          <p>© {new Date().getFullYear()} ShopX. Tous droits réservés.</p>
          <p>Prix affichés en FCFA.</p>
        </div>
      </div>
    </footer>
  );
}
