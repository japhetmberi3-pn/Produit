"use client";

import { type FormEvent, useState } from "react";

import { GoogleIcon } from "@/app/components/icons";
import { useAuth, type User } from "@/app/context/AuthContext";
import { apiFetch, errorMessage } from "@/lib/api";
import { API_URL } from "@/lib/config";

export type AuthMode = "login" | "register";

interface AuthResponse {
  token?: string;
  user?: User;
}

const inputClass =
  "w-full rounded-xl border border-line bg-surface px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-4 focus:ring-brand/15";

export default function AuthForm({
  initialMode = "login",
  onSuccess,
}: {
  initialMode?: AuthMode;
  onSuccess?: () => void;
}) {
  const { setUser } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"client" | "vendeur">("client");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const data = await apiFetch<AuthResponse>(
        mode === "login" ? "/login" : "/register",
        {
          method: "POST",
          auth: false,
          body:
            mode === "login"
              ? { email, password }
              : { name, email, password, role },
        }
      );

      if (data.token) localStorage.setItem("token", data.token);
      if (data.user) setUser(data.user);

      setPassword("");
      onSuccess?.();
    } catch (err) {
      setError(
        err instanceof TypeError
          ? "Impossible de contacter le serveur. Vérifiez que Laravel est lancé."
          : errorMessage(err, "Une erreur est survenue.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ONGLETS */}
      <div className="grid grid-cols-2 rounded-xl bg-surface-2 p-1" role="tablist">
        {(
          [
            { value: "login", label: "Connexion" },
            { value: "register", label: "Inscription" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={mode === tab.value}
            onClick={() => switchMode(tab.value)}
            className={`rounded-lg py-2 text-sm font-semibold transition ${
              mode === tab.value
                ? "bg-surface text-ink shadow-sm"
                : "text-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3.5">
        {mode === "register" && (
          <>
            <label className="text-sm font-medium text-ink-soft">
              Nom complet
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                className={`${inputClass} mt-1.5`}
                placeholder="Jean Dupont"
              />
            </label>

            <fieldset>
              <legend className="text-sm font-medium text-ink-soft">Je souhaite</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2" role="radiogroup">
                {(
                  [
                    { value: "client", label: "Acheter", hint: "Compte client" },
                    { value: "vendeur", label: "Vendre", hint: "Ouvrir une boutique" },
                  ] as const
                ).map((option) => {
                  const selected = role === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setRole(option.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition ${
                        selected
                          ? "border-brand bg-brand-soft"
                          : "border-line hover:border-muted"
                      }`}
                    >
                      <span className={`block text-sm font-semibold ${selected ? "text-brand" : "text-ink"}`}>
                        {option.label}
                      </span>
                      <span className="block text-xs text-muted">{option.hint}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        <label className="text-sm font-medium text-ink-soft">
          Adresse e-mail
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={`${inputClass} mt-1.5`}
            placeholder="vous@exemple.com"
          />
        </label>

        <label className="text-sm font-medium text-ink-soft">
          Mot de passe
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={`${inputClass} mt-1.5`}
            placeholder="••••••••"
          />
        </label>

        {error && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 rounded-xl bg-brand py-3 text-sm font-semibold text-on-brand transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading
            ? "Veuillez patienter..."
            : mode === "login"
            ? "Se connecter"
            : "Créer mon compte"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        ou
        <span className="h-px flex-1 bg-line" />
      </div>

      <a
        href={`${API_URL}/auth/google`}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-surface py-3 text-sm font-semibold text-ink transition hover:bg-surface-2"
      >
        <GoogleIcon /> Continuer avec Google
      </a>
    </div>
  );
}
