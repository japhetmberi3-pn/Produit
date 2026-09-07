"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AnimatedContainer from "@/app/components/AnimatedContainer";

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

export default function BoutiqueDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          setLoading(false);
          return;
        }

        const shopId = params.id;

        const response = await fetch(
          `http://127.0.0.1:8000/api/shops/${shopId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log("STATUT boutique :", response.status);
        console.log("RÉPONSE boutique :", data);

        if (!response.ok) {
          throw new Error(
            data.message || `Erreur HTTP ${response.status}`
          );
        }

        setShop(data);
      } catch (err) {
        console.error("Erreur boutique :", err);

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Impossible de charger la boutique.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="flex justify-center py-20">
          <AnimatedContainer>
            <p className="text-gray-400">
              Chargement de la boutique...
            </p>
          </AnimatedContainer>
        </div>
      </main>
    );
  }

  if (error || !shop) {
    return (
      <main className="min-h-screen bg-black px-6 py-10 text-white">
        <div className="mx-auto max-w-3xl">
          <AnimatedContainer>
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center">
              <h1 className="text-2xl font-bold text-red-400">
                Boutique introuvable
              </h1>

              <p className="mt-3 text-gray-400">
                {error || "Cette boutique n'existe pas."}
              </p>

              <button
                onClick={() => router.push("/Boutique")}
                className="mt-6 rounded-lg bg-blue-600 px-5 py-2 font-semibold transition hover:bg-blue-700"
              >
                Retour aux boutiques
              </button>
            </div>
          </AnimatedContainer>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-7xl">

        {/* Retour */}
        <AnimatedContainer>
          <button
            onClick={() => router.push("/Boutique")}
            className="mb-8 rounded-lg border border-gray-700 px-4 py-2 text-gray-300 transition hover:border-blue-500 hover:text-blue-400"
          >
            ← Retour aux boutiques
          </button>
        </AnimatedContainer>

        {/* Informations boutique */}
        <AnimatedContainer delay={0.1}>
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-blue-600/20 text-5xl">
                🏪
              </div>

              <div>
                <h1 className="text-4xl font-bold text-blue-500">
                  {shop.name}
                </h1>

                <p className="mt-3 text-gray-400">
                  {shop.description ||
                    "Aucune description disponible."}
                </p>

                <p className="mt-3 text-sm text-gray-500">
                  {shop.products?.length || 0} produit
                  {(shop.products?.length || 0) > 1 ? "s" : ""}
                </p>
              </div>
            </div>
          </div>
        </AnimatedContainer>

        {/* Produits */}
        <AnimatedContainer delay={0.2}>
          <div className="mt-10">
            <h2 className="mb-6 text-2xl font-bold">
              Produits de la boutique
            </h2>

            {!shop.products || shop.products.length === 0 ? (
              <AnimatedContainer delay={0.3}>
                <div className="rounded-2xl border border-gray-800 bg-gray-950 p-10 text-center">
                  <p className="text-gray-400">
                    Cette boutique ne contient aucun produit.
                  </p>
                </div>
              </AnimatedContainer>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {shop.products.map((product, index) => (
                  <AnimatedContainer
                    key={product.id}
                    delay={0.3 + index * 0.1}
                  >
                    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 transition hover:-translate-y-1 hover:border-blue-500">
                      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-3xl">
                        📦
                      </div>

                      <h3 className="text-xl font-bold">
                        {product.name}
                      </h3>

                      <p className="mt-3 text-2xl font-bold text-blue-500">
                        {product.price} FCFA
                      </p>

                      <p className="mt-2 text-sm text-gray-400">
                        Stock : {product.stock}
                      </p>
                    </div>
                  </AnimatedContainer>
                ))}
              </div>
            )}
          </div>
        </AnimatedContainer>
      </div>
    </main>
  );
}