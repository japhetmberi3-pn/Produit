"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";

import AnimatedContainer from "@/app/components/AnimatedContainer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface VenteMensuelle {
  mois: string;
  ca: number;
}

interface CommandeMensuelle {
  mois: string;
  commandes: number;
}

interface DashboardData {
  clients: number;
  vendeurs: number;
  admins: number;
  produits: number;
  commandes: number;
  chiffre_affaires: number;
  ventes_mensuelles: VenteMensuelle[];
  commandes_mensuelles: CommandeMensuelle[];
}

export default function AdminDashboardPage() {
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
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/admin/dashboard`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 403) {
            throw new Error(
              "Accès réservé aux administrateurs."
            );
          }

          if (response.status === 401) {
            throw new Error(
              "Votre session a expiré."
            );
          }

          throw new Error(
            "Impossible de récupérer les statistiques."
          );
        }

        const data: DashboardData =
          await response.json();

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

  /*
  |--------------------------------------------------------------------------
  | FORMATAGE DU CHIFFRE D'AFFAIRES
  |--------------------------------------------------------------------------
  */

  const formatCurrency = (value: number) => {
    return (
      new Intl.NumberFormat("fr-FR").format(value) +
      " FCFA"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | CHARGEMENT
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] text-white">
        <AnimatedContainer>
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />

            <p className="text-zinc-400">
              Chargement des statistiques...
            </p>
          </div>
        </AnimatedContainer>
      </main>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | ERREUR
  |--------------------------------------------------------------------------
  */

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#05070d] px-6 text-white">
        <AnimatedContainer>
          <div className="max-w-md rounded-2xl border border-red-500/20 bg-[#0b0f18] p-8 text-center shadow-2xl">
            <div className="mb-4 text-5xl">
              ⚠️
            </div>

            <h1 className="mb-2 text-xl font-bold">
              Impossible d'accéder au dashboard
            </h1>

            <p className="mb-6 text-sm text-zinc-400">
              {error}
            </p>

            <Link
              href="/"
              className="inline-flex rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold transition hover:bg-blue-500"
            >
              Retour à l'accueil
            </Link>
          </div>
        </AnimatedContainer>
      </main>
    );
  }

  if (!dashboard) {
    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | CARTES STATISTIQUES
  |--------------------------------------------------------------------------
  */

  const stats = [
    {
      title: "Clients",
      value: dashboard.clients,
      icon: "👥",
      description: "Clients inscrits",
    },
    {
      title: "Vendeurs",
      value: dashboard.vendeurs,
      icon: "🏪",
      description: "Vendeurs inscrits",
    },
    {
      title: "Administrateurs",
      value: dashboard.admins,
      icon: "🛡️",
      description: "Administrateurs",
    },
    {
      title: "Produits",
      value: dashboard.produits,
      icon: "📦",
      description: "Produits disponibles",
    },
    {
      title: "Commandes",
      value: dashboard.commandes,
      icon: "🛒",
      description: "Commandes enregistrées",
    },
    {
      title: "Chiffre d'affaires",
      value: formatCurrency(
        dashboard.chiffre_affaires
      ),
      icon: "💰",
      description: "Total des ventes",
    },
  ];

  return (
    <main className="min-h-screen bg-[#05070d] text-white">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="border-b border-white/5 bg-[#080b12]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <AnimatedContainer>
            <Link
              href="/"
              className="text-xl font-black tracking-tight"
            >
              <span className="text-blue-500">
                SHOP
              </span>

              <span className="text-white">
                X
              </span>
            </Link>
          </AnimatedContainer>

          <AnimatedContainer delay={0.1}>
            <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600/20">
                👤
              </div>

              <div className="hidden sm:block">
                <p className="text-sm font-semibold">
                  Admin ShopX
                </p>

                <p className="text-xs text-zinc-500">
                  Administrateur
                </p>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </header>

      {/* =====================================================
          CONTENU
      ===================================================== */}

      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* ===================================================
            TITRE
        =================================================== */}

        <AnimatedContainer delay={0.15}>
          <div className="mb-10">
            <p className="mb-2 text-sm font-medium text-blue-400">
              Administration
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard Admin
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Vue générale de l'activité de votre
              plateforme ShopX.
            </p>
          </div>
        </AnimatedContainer>

        {/* ===================================================
            CARTES STATISTIQUES
        =================================================== */}

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <AnimatedContainer
              key={stat.title}
              delay={0.2 + index * 0.08}
            >
              <div className="group h-full rounded-2xl border border-white/5 bg-[#0b0f18] p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-[#0d121d]">

                <div className="mb-6 flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-2xl transition duration-300 group-hover:scale-110">
                    {stat.icon}
                  </div>

                  <span className="text-xs font-medium text-zinc-600">
                    ShopX
                  </span>
                </div>

                <p className="text-sm text-zinc-500">
                  {stat.title}
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-white">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-zinc-600">
                  {stat.description}
                </p>
              </div>
            </AnimatedContainer>
          ))}
        </div>

        {/* ===================================================
            GRAPHIQUES
        =================================================== */}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">

          {/* =================================================
              CHIFFRE D'AFFAIRES
          ================================================= */}

          <AnimatedContainer delay={0.65}>
            <section className="rounded-2xl border border-white/5 bg-[#0b0f18] p-6">

              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  Chiffre d'affaires
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Évolution des ventes sur les 6 derniers mois.
                </p>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <BarChart
                    data={
                      dashboard.ventes_mensuelles
                    }
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#27272a"
                    />

                    <XAxis
                      dataKey="mois"
                      stroke="#71717a"
                    />

                    <YAxis
                      stroke="#71717a"
                      tickFormatter={(value) =>
                        `${value / 1000}k`
                      }
                    />

                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toLocaleString(
                          "fr-FR"
                        )} FCFA`
                      }
                      contentStyle={{
                        backgroundColor:
                          "#0b0f18",
                        border:
                          "1px solid #27272a",
                        borderRadius:
                          "12px",
                        color: "#fff",
                      }}
                    />

                    <Bar
                      dataKey="ca"
                      fill="#3b82f6"
                      radius={[
                        6,
                        6,
                        0,
                        0,
                      ]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </AnimatedContainer>

          {/* =================================================
              COMMANDES
          ================================================= */}

          <AnimatedContainer delay={0.75}>
            <section className="rounded-2xl border border-white/5 bg-[#0b0f18] p-6">

              <div className="mb-6">
                <h2 className="text-xl font-bold">
                  Commandes
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  Évolution des commandes sur les 6 derniers mois.
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
                      stroke="#27272a"
                    />

                    <XAxis
                      dataKey="mois"
                      stroke="#71717a"
                    />

                    <YAxis
                      stroke="#71717a"
                    />

                    <Tooltip
                      formatter={(value) =>
                        `${value} commande(s)`
                      }
                      contentStyle={{
                        backgroundColor:
                          "#0b0f18",
                        border:
                          "1px solid #27272a",
                        borderRadius:
                          "12px",
                        color: "#fff",
                      }}
                    />

                    <Line
                      type="monotone"
                      dataKey="commandes"
                      stroke="#60a5fa"
                      strokeWidth={3}
                      dot={{
                        r: 5,
                      }}
                      activeDot={{
                        r: 7,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </AnimatedContainer>
        </div>

        {/* ===================================================
            RÉSUMÉ
        =================================================== */}

        <AnimatedContainer delay={0.85}>
          <section className="mt-8 rounded-2xl border border-white/5 bg-[#0b0f18] p-6">

            <div className="mb-6">
              <h2 className="text-xl font-bold">
                Résumé ShopX
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Vue synthétique de votre plateforme.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-sm text-zinc-500">
                  Utilisateurs
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {dashboard.clients +
                    dashboard.vendeurs +
                    dashboard.admins}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Tous les comptes
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-sm text-zinc-500">
                  Catalogue
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {dashboard.produits}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Produits enregistrés
                </p>
              </div>

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5">
                <p className="text-sm text-zinc-500">
                  Ventes
                </p>

                <p className="mt-2 text-2xl font-bold">
                  {formatCurrency(
                    dashboard.chiffre_affaires
                  )}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  Chiffre d'affaires total
                </p>
              </div>

            </div>
          </section>
        </AnimatedContainer>
      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <AnimatedContainer delay={0.95}>
        <footer className="border-t border-white/5 px-6 py-8 text-center">
          <p className="text-xs text-zinc-600">
            © {new Date().getFullYear()} ShopX —
            Administration
          </p>
        </footer>
      </AnimatedContainer>
    </main>
  );
}