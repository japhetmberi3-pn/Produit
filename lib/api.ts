import { API_URL } from "@/lib/config";

/** Token absent, expiré ou révoqué (HTTP 401). */
export class UnauthorizedError extends Error {
  constructor() {
    super("Votre session a expiré. Veuillez vous reconnecter.");
    this.name = "UnauthorizedError";
  }
}

/** Réponse HTTP en erreur ; `message` vient de Laravel quand il est fourni. */
export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
  /** false pour les routes publiques (connexion, inscription...). */
  auth?: boolean;
}

/**
 * Appel JSON vers l'API Laravel avec le token Bearer.
 * Lève UnauthorizedError (401) ou ApiError (autres erreurs HTTP).
 */
export async function apiFetch<T = unknown>(
  path: string,
  { method = "GET", body, signal, auth = true }: ApiOptions = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  if (auth && !token) {
    throw new UnauthorizedError();
  }

  const headers: Record<string, string> = { Accept: "application/json" };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    signal,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 401) {
    throw new UnauthorizedError();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const validationErrors =
      data?.errors && typeof data.errors === "object"
        ? Object.values(data.errors as Record<string, string[]>).flat().join(" ")
        : "";

    throw new ApiError(
      data?.message || validationErrors || `Erreur ${response.status}`,
      response.status
    );
  }

  return data as T;
}

export const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error && error.message ? error.message : fallback;
