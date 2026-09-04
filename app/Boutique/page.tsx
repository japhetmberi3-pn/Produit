"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

interface Shop {
  id: number;
  user_id: number;
  name: string;
  description?: string | null;
  products?: Product[];
}

export default function BoutiquesPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "http://127.0.0.1:8000/api/shops",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("STATUT /api/shops :", response.status);
        console.log("RÉPONSE /api/shops :", data);

        if (!response.ok) {
          throw new Error(
            data.message ||
              `Erreur HTTP ${response.status}`
          );
        }

        if (!Array.isArray(data)) {
          throw new Error(
            "La réponse de Laravel n'est pas une liste de boutiques."
          );
        }

        setShops(data);
      } catch (err) {
        console.error("Erreur boutiques :", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Impossible de charger les boutiques.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">
        {/* En-tête */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-blue-500">
            Nos boutiques
          </h1>

          <p className="mt-2 text-gray-400">
            Découvrez les boutiques et leurs produits.
          </p>
        </div>

        {/* Chargement */}
        {loading && (
          <div className="flex justify-center py-20">
            <p className="text-gray-400">
              Chargement des boutiques...
            </p>
          </div>
        )}

        {/* Erreur */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-center text-red-400">
            <p className="font-semibold">
              {error}
            </p>

            <p className="mt-2 text-sm text-gray-400">
              Vérifie également la console du navigateur pour
              voir la réponse exacte de Laravel.
            </p>
          </div>
        )}

        {/* Aucune boutique */}
        {!loading && !error && shops.length === 0 && (
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-10 text-center">
            <h2 className="text-2xl font-semibold">
              Aucune boutique disponible
            </h2>

            <p className="mt-2 text-gray-400">
              Les boutiques apparaîtront ici lorsqu'elles seront créées.
            </p>
          </div>
        )}

        {/* Liste des boutiques */}
        {!loading && !error && shops.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <div
                key={shop.id}
                className="rounded-2xl border border-gray-800 bg-gray-950 p-6 transition hover:-translate-y-1 hover:border-blue-500"
              >
                {/* Icône boutique */}
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-3xl">
                  🏪
                </div>

                {/* Nom */}
                <h2 className="text-2xl font-bold">
                  {shop.name}
                </h2>

                {/* Description */}
                <p className="mt-3 min-h-[48px] text-gray-400">
                  {shop.description ||
                    "Aucune description disponible."}
                </p>

                {/* Nombre de produits */}
                <div className="mt-5 flex items-center justify-between border-t border-gray-800 pt-5">
                  <span className="text-sm text-gray-400">
                    {shop.products?.length || 0} produit
                    {(shop.products?.length || 0) > 1
                      ? "s"
                      : ""}
                  </span>

                  <Link
                    href={`/Boutiques/${shop.id}`}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-semibold transition hover:bg-blue-700"
                  >
                    Voir la boutique
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}