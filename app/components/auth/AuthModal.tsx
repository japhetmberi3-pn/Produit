"use client";

import { useEffect } from "react";

import AuthForm, { type AuthMode } from "@/app/components/auth/AuthForm";
import { CloseIcon } from "@/app/components/icons";

/** Ouvre la fenêtre de connexion depuis n'importe quelle page (écoutée par la Navbar). */
export const OPEN_AUTH_EVENT = "shopx:open-auth";

export function openAuthModal(mode: AuthMode = "login") {
  window.dispatchEvent(new CustomEvent<AuthMode>(OPEN_AUTH_EVENT, { detail: mode }));
}

export default function AuthModal({
  mode,
  onClose,
  onSuccess,
}: {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: () => void;
}) {
  // Fermeture avec Échap.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="max-h-[94vh] w-full overflow-y-auto rounded-t-3xl border border-line bg-surface p-6 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="auth-title" className="text-xl font-bold text-ink">
              Bienvenue sur ShopX
            </h2>
            <p className="mt-1 text-sm text-muted">
              Connectez-vous ou créez un compte en quelques secondes.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-full p-1.5 text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <CloseIcon />
          </button>
        </div>

        {/* key : réinitialise le formulaire si on rouvre dans un autre mode */}
        <AuthForm key={mode} initialMode={mode} onSuccess={onSuccess} />
      </div>
    </div>
  );
}
