"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import AnimatedContainer from "@/app/components/AnimatedContainer";
import ParallaxBackground from "@/app/components/ParallaxBackground";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface DashboardData {
  vendeur: {
    id: number;
    name: string;
    email: string;
  };

  produits: number;
  commandes: number;
  chiffre_affaires: number;

  ventes_mensuelles: {
    mois: string;
    ca: number;
  }[];

  commandes_mensuelles: {
    mois: string;
    commandes: number;
  }[];

  top_produits: {
    product_id: number;
    nom: string;
    quantite_vendue: number;
  }[];
}

export default function VendeurDashboard() {
  const [dashboard, setDashboard] =
    useState<DashboardData | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          setError("Vous devez être connecté.");
          return;
        }

        const response = await fetch(
          `${API_URL}/seller/dashboard`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Impossible de charger le dashboard vendeur."
          );
        }

        setDashboard(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Une erreur est survenue."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  /* =========================================================
     CHARGEMENT
  ========================================================= */

  if (loading) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-black text-white">
        <ParallaxBackground />

        {/* Lumière bleu électrique */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-180px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[#00A8FF]/20 blur-[150px]" />

          <div className="absolute -left-48 top-[20%] h-[600px] w-[600px] rounded-full bg-[#00B7FF]/15 blur-[140px]" />

          <div className="absolute -right-48 top-[35%] h-[600px] w-[600px] rounded-full bg-[#0066FF]/20 blur-[150px]" />

          <div className="absolute bottom-[-300px] left-1/2 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[#00A8FF]/15 blur-[170px]" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-[#00A8FF]" />

            <p className="mt-4 text-sm text-gray-400">
              Chargement du dashboard vendeur...
            </p>
          </div>
        </div>
      </main>
    );
  }

  /* =========================================================
     ERREUR
  ========================================================= */

  if (error) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-black text-white">
        <ParallaxBackground />

        {/* Lumière bleu électrique */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-180px] h-[700px] w-[1100px] -translate-x-1/2 rounded-full bg-[#00A8FF]/20 blur-[150px]" />

          <div className="absolute -left-48 top-[20%] h-[600px] w-[600px] rounded-full bg-[#00B7FF]/15 blur-[140px]" />

          <div className="absolute -right-48 top-[35%] h-[600px] w-[600px] rounded-full bg-[#0066FF]/20 blur-[150px]" />
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-zinc-950/65 p-8 text-center backdrop-blur-md">
            <div className="text-4xl">⚠️</div>

            <h1 className="mt-4 text-xl font-bold">
              Impossible de charger le dashboard
            </h1>

            <p className="mt-3 text-sm text-gray-500">
              {error}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  /* =========================================================
     DASHBOARD
  ========================================================= */

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      {/* =====================================================
          FOND PARALLAX DE L'ACCUEIL
      ===================================================== */}
      <ParallaxBackground />

      {/* =====================================================
          LUMIÈRE BLEU ÉLECTRIQUE SHOPX
      ===================================================== */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {/* Halo principal */}
        <div
          className="
            absolute left-1/2 top-[-180px]
            h-[700px] w-[1100px]
            -translate-x-1/2
            rounded-full
            bg-[#00A8FF]/20
            blur-[150px]
          "
        />

        {/* Halo gauche */}
        <div
          className="
            absolute -left-48 top-[20%]
            h-[600px] w-[600px]
            rounded-full
            bg-[#00B7FF]/15
            blur-[140px]
          "
        />

        {/* Halo droit */}
        <div
          className="
            absolute -right-48 top-[35%]
            h-[600px] w-[600px]
            rounded-full
            bg-[#0066FF]/20
            blur-[150px]
          "
        />

        {/* Halo inférieur */}
        <div
          className="
            absolute bottom-[-300px] left-1/2
            h-[700px] w-[1000px]
            -translate-x-1/2
            rounded-full
            bg-[#00A8FF]/15
            blur-[170px]
          "
        />

        {/* Lumière centrale */}
        <div
          className="
            absolute left-1/2 top-1/2
            h-[500px] w-[800px]
            -translate-x-1/2
            -translate-y-1/2
            rounded-full
            bg-[#00A8FF]/5
            blur-[120px]
          "
        />
      </div>

      {/* =====================================================
          CONTENU
      ===================================================== */}
      <div className="relative z-10 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">

          {/* =================================================
              HEADER
          ================================================= */}
          <AnimatedContainer>
            <div className="mb-10">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#00A8FF]">
                ShopX • Espace vendeur
              </p>

              <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                <div>
                  <h1 className="text-3xl font-black sm:text-4xl lg:text-5xl">
                    Dashboard Vendeur
                  </h1>

                  <p className="mt-3 text-gray-400">
                    Bienvenue,{" "}
                    <span className="font-semibold text-white">
                      {dashboard.vendeur.name}
                    </span>
                    .
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    {dashboard.vendeur.email}
                  </p>
                </div>

                <div className="rounded-xl border border-[#00A8FF]/25 bg-[#00A8FF]/10 px-5 py-3 shadow-[0_0_30px_rgba(0,168,255,0.08)] backdrop-blur-md">
                  <span className="text-xs uppercase tracking-wider text-gray-500">
                    Statut
                  </span>

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00A8FF] shadow-[0_0_10px_#00A8FF]" />

                    <span className="text-sm font-semibold text-[#00A8FF]">
                      Vendeur actif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedContainer>

          {/* =================================================
              CARTES STATISTIQUES
          ================================================= */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {/* Produits */}
            <AnimatedContainer delay={0.05}>
              <div
                className="
                  group rounded-2xl
                  border border-white/10
                  bg-zinc-950/55
                  p-6
                  backdrop-blur-md
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-[#00A8FF]/40
                  hover:bg-zinc-950/65
                  hover:shadow-[0_0_35px_rgba(0,168,255,0.08)]
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Mes produits
                    </p>

                    <p className="mt-3 text-4xl font-black text-white">
                      {dashboard.produits}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#00A8FF]/20 bg-[#00A8FF]/10 p-3 text-2xl">
                    📦
                  </div>
                </div>

                <p className="mt-5 text-xs text-gray-600">
                  Produits actuellement enregistrés
                </p>
              </div>
            </AnimatedContainer>

            {/* Commandes */}
            <AnimatedContainer delay={0.1}>
              <div
                className="
                  group rounded-2xl
                  border border-white/10
                  bg-zinc-950/55
                  p-6
                  backdrop-blur-md
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-[#00A8FF]/40
                  hover:bg-zinc-950/65
                  hover:shadow-[0_0_35px_rgba(0,168,255,0.08)]
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Commandes
                    </p>

                    <p className="mt-3 text-4xl font-black text-white">
                      {dashboard.commandes}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#00A8FF]/20 bg-[#00A8FF]/10 p-3 text-2xl">
                    🛒
                  </div>
                </div>

                <p className="mt-5 text-xs text-gray-600">
                  Commandes contenant vos produits
                </p>
              </div>
            </AnimatedContainer>

            {/* Chiffre d'affaires */}
            <AnimatedContainer delay={0.15}>
              <div
                className="
                  group rounded-2xl
                  border border-[#00A8FF]/25
                  bg-zinc-950/55
                  p-6
                  backdrop-blur-md
                  transition-all duration-300
                  hover:-translate-y-1
                  hover:border-[#00A8FF]/50
                  hover:bg-zinc-950/65
                  hover:shadow-[0_0_40px_rgba(0,168,255,0.12)]
                "
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-500">
                      Chiffre d'affaires
                    </p>

                    <p className="mt-3 text-3xl font-black text-[#00A8FF]">
                      {dashboard.chiffre_affaires.toLocaleString(
                        "fr-FR"
                      )}{" "}
                      FCFA
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#00A8FF]/20 bg-[#00A8FF]/10 p-3 text-2xl">
                    💰
                  </div>
                </div>

                <p className="mt-5 text-xs text-gray-600">
                  Chiffre d'affaires total
                </p>
              </div>
            </AnimatedContainer>
          </div>

          {/* =================================================
              GRAPHIQUES
          ================================================= */}
          <div className="mt-8 grid gap-6 lg:grid-cols-2">

            {/* Ventes */}
            <AnimatedContainer delay={0.2}>
              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-zinc-950/55
                  p-6
                  backdrop-blur-md
                  transition-all duration-300
                  hover:border-[#00A8FF]/25
                  hover:shadow-[0_0_35px_rgba(0,168,255,0.06)]
                "
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold">
                    Évolution des ventes
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Chiffre d'affaires des 6 derniers mois
                  </p>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <BarChart
                      data={dashboard.ventes_mensuelles}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />

                      <XAxis
                        dataKey="mois"
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border:
                            "1px solid rgba(0,168,255,0.2)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          `${Number(
                            value
                          ).toLocaleString(
                            "fr-FR"
                          )} FCFA`,
                          "CA",
                        ]}
                      />

                      <Bar
                        dataKey="ca"
                        fill="#00A8FF"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </AnimatedContainer>

            {/* Commandes */}
            <AnimatedContainer delay={0.25}>
              <div
                className="
                  rounded-2xl
                  border border-white/10
                  bg-zinc-950/55
                  p-6
                  backdrop-blur-md
                  transition-all duration-300
                  hover:border-[#00A8FF]/25
                  hover:shadow-[0_0_35px_rgba(0,168,255,0.06)]
                "
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold">
                    Évolution des commandes
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Nombre de commandes des 6 derniers mois
                  </p>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <LineChart
                      data={
                        dashboard.commandes_mensuelles
                      }
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.06)"
                      />

                      <XAxis
                        dataKey="mois"
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                      />

                      <YAxis
                        stroke="#71717a"
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />

                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#09090b",
                          border:
                            "1px solid rgba(0,168,255,0.2)",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                        formatter={(value) => [
                          value,
                          "Commandes",
                        ]}
                      />

                      <Line
                        type="monotone"
                        dataKey="commandes"
                        stroke="#00A8FF"
                        strokeWidth={3}
                        dot={{
                          r: 4,
                          fill: "#00A8FF",
                        }}
                        activeDot={{
                          r: 7,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </AnimatedContainer>
          </div>

          {/* =================================================
              TOP PRODUITS
          ================================================= */}
          <AnimatedContainer delay={0.3}>
            <div
              className="
                mt-8 rounded-2xl
                border border-white/10
                bg-zinc-950/55
                p-6
                backdrop-blur-md
                transition-all duration-300
                hover:border-[#00A8FF]/25
              "
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  🏆 Produits les plus vendus
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Vos 5 produits ayant enregistré le
                  plus de ventes
                </p>
              </div>

              {dashboard.top_produits.length === 0 ? (
                <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
                  <div className="text-4xl">
                    📦
                  </div>

                  <p className="mt-4 text-sm text-gray-500">
                    Vous n'avez pas encore enregistré
                    de ventes.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboard.top_produits.map(
                    (product, index) => (
                      <div
                        key={product.product_id}
                        className="
                          flex items-center
                          justify-between
                          rounded-xl
                          border border-white/5
                          bg-black/30
                          px-4 py-4
                          transition-all
                          hover:border-[#00A8FF]/25
                          hover:bg-[#00A8FF]/5
                        "
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className="
                              flex h-10 w-10
                              shrink-0
                              items-center
                              justify-center
                              rounded-full
                              border border-[#00A8FF]/20
                              bg-[#00A8FF]/10
                              font-bold
                              text-[#00A8FF]
                            "
                          >
                            {index + 1}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {product.nom}
                            </p>

                            <p className="mt-1 text-xs text-gray-600">
                              Produit #
                              {product.product_id}
                            </p>
                          </div>
                        </div>

                        <div className="ml-4 shrink-0 text-right">
                          <p className="font-bold text-[#00A8FF]">
                            {product.quantite_vendue}
                          </p>

                          <p className="text-xs text-gray-600">
                            vendu
                            {product.quantite_vendue >
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </AnimatedContainer>

          {/* =================================================
              INFORMATIONS VENDEUR
          ================================================= */}
          <AnimatedContainer delay={0.35}>
            <div
              className="
                mt-8 rounded-2xl
                border border-white/10
                bg-zinc-950/55
                p-6
                backdrop-blur-md
              "
            >
              <h2 className="text-xl font-bold">
                Informations vendeur
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div
                  className="
                    rounded-xl
                    border border-white/5
                    bg-black/30
                    p-4
                  "
                >
                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Nom
                  </p>

                  <p className="mt-2 font-semibold text-white">
                    {dashboard.vendeur.name}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border border-white/5
                    bg-black/30
                    p-4
                  "
                >
                  <p className="text-xs uppercase tracking-wider text-gray-600">
                    Email
                  </p>

                  <p className="mt-2 break-all font-semibold text-white">
                    {dashboard.vendeur.email}
                  </p>
                </div>
              </div>
            </div>
          </AnimatedContainer>

        </div>
      </div>
    </main>
  );
}