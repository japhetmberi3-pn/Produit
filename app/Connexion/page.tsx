"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import AuthForm from "@/app/components/auth/AuthForm";
import Navbar from "@/app/components/Navbar";

/*
 * Page de connexion : cible des redirections "session expirée"
 * (router.push("/Connexion")) présentes dans plusieurs pages.
 */
export default function ConnexionPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-page text-ink">
      <Navbar />

      <main className="mx-auto flex max-w-7xl justify-center px-4 py-10 md:py-16">
        <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">Connexion</h1>
          <p className="mt-1 text-sm text-muted">
            Accédez à votre panier, vos favoris et vos commandes.
          </p>

          <div className="mt-6">
            <AuthForm onSuccess={() => router.push("/Produits")} />
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            <Link href="/" className="font-medium text-brand hover:underline">
              ← Retour à l&apos;accueil
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
