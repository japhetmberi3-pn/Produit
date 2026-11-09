"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

import {
  CartIcon,
  CheckIcon,
  HeartIcon,
  StarIcon,
  StoreIcon,
} from "@/app/components/icons";
import { formatPrice, type Product } from "@/lib/shop";

/* =========================================================
   VISUEL (l'API ne fournit pas d'image produit)
========================================================= */

const hueFor = (product: Pick<Product, "id" | "name">) => {
  let hash = product.id * 37;

  for (const char of product.name) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360;
  }

  return hash;
};

export function ProductVisual({
  product,
  className = "",
}: {
  product: Pick<Product, "id" | "name">;
  className?: string;
}) {
  const initials = product.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`product-visual flex items-center justify-center ${className}`}
      style={{ "--h": hueFor(product) } as CSSProperties}
      aria-hidden="true"
    >
      <span className="text-5xl font-black tracking-tight opacity-80 sm:text-6xl">
        {initials || "?"}
      </span>
    </div>
  );
}

/* =========================================================
   NOTE
========================================================= */

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  const rounded = Math.round(value);

  return (
    <span className="flex items-center text-star" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          size={size}
          filled={star <= rounded}
          className={star <= rounded ? "" : "text-line"}
        />
      ))}
    </span>
  );
}

/* =========================================================
   CARTE PRODUIT
========================================================= */

export type AddToCartState = "idle" | "adding" | "added";

interface ProductCardProps {
  product: Product;
  average?: number;
  reviewCount?: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onAddToCart?: () => void;
  addState?: AddToCartState;
  /** Contenu additionnel en bas de carte (avis, actions vendeur...). */
  children?: ReactNode;
}

export default function ProductCard({
  product,
  average = 0,
  reviewCount = 0,
  isFavorite,
  onToggleFavorite,
  onAddToCart,
  addState = "idle",
  children,
}: ProductCardProps) {
  const inStock = product.stock > 0;
  const lowStock = inStock && product.stock <= 5;
  const productHref = `/Produits/${product.id}`;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-black/30">
      {/* VISUEL */}
      <div className="relative">
        <Link href={productHref} tabIndex={-1} aria-hidden="true">
          <ProductVisual
            product={product}
            className={`aspect-[4/3] transition duration-300 group-hover:scale-[1.02] ${
              inStock ? "" : "grayscale"
            }`}
          />
        </Link>

        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            !inStock
              ? "bg-danger-soft text-danger"
              : lowStock
              ? "bg-accent-soft text-accent"
              : "bg-success-soft text-success"
          }`}
        >
          {!inStock ? "Rupture" : lowStock ? `Plus que ${product.stock}` : "Disponible"}
        </span>

        <button
          type="button"
          onClick={onToggleFavorite}
          aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-pressed={isFavorite}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur transition hover:scale-110 ${
            isFavorite ? "text-rose-500" : "text-muted hover:text-rose-500"
          }`}
        >
          <HeartIcon size={18} filled={isFavorite} />
        </button>
      </div>

      {/* CONTENU */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.shop ? (
          <Link
            href={`/Boutique/${product.shop.id}`}
            className="flex w-fit items-center gap-1.5 text-xs font-medium text-muted transition hover:text-brand"
          >
            <StoreIcon size={14} />
            {product.shop.name}
          </Link>
        ) : (
          <span className="text-xs text-muted">Boutique non associée</span>
        )}

        <h3 className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          <Link href={productHref} className="hover:text-brand">
            {product.name}
          </Link>
        </h3>

        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        )}

        {reviewCount > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
            <Stars value={average} size={13} />
            <span className="font-semibold text-ink-soft">{average.toFixed(1)}</span>
            <span className="whitespace-nowrap text-muted">({reviewCount} avis)</span>
          </div>
        ) : (
          <p className="mt-2 text-xs text-muted">Pas encore d&apos;avis</p>
        )}

        <div className="mt-auto pt-4">
          <p className="text-lg font-bold tracking-tight text-ink sm:text-xl">
            {formatPrice(product.price)}
            <span className="ml-1 text-sm font-semibold text-muted">FCFA</span>
          </p>

          {onAddToCart && (
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!inStock || addState === "adding"}
              aria-label={
                !inStock
                  ? "Rupture de stock"
                  : addState === "added"
                  ? "Ajouté au panier"
                  : addState === "adding"
                  ? "Ajout au panier en cours"
                  : "Ajouter au panier"
              }
              className={`mt-3 flex w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2.5 text-xs font-semibold sm:gap-2 sm:px-4 sm:text-sm transition disabled:cursor-not-allowed ${
                !inStock
                  ? "bg-surface-2 text-muted"
                  : addState === "added"
                  ? "bg-success text-white"
                  : "bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-70"
              }`}
            >
              {!inStock ? (
                <span>
                  Rupture<span className="hidden sm:inline"> de stock</span>
                </span>
              ) : addState === "added" ? (
                <>
                  <CheckIcon size={16} />
                  <span>
                    Ajouté<span className="hidden sm:inline"> au panier</span>
                  </span>
                </>
              ) : (
                <>
                  <CartIcon size={16} />
                  {addState === "adding" ? (
                    "Ajout..."
                  ) : (
                    <span>
                      Ajouter<span className="hidden sm:inline"> au panier</span>
                    </span>
                  )}
                </>
              )}
            </button>
          )}
        </div>

        {children}
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface" aria-hidden="true">
      <div className="aspect-[4/3] animate-pulse bg-surface-2" />
      <div className="space-y-3 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-surface-2" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
        <div className="h-6 w-2/5 animate-pulse rounded bg-surface-2" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
