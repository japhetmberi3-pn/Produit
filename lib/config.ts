/**
 * Base URL of the Laravel API.
 * Configured through NEXT_PUBLIC_API_URL (.env.local); restart `next dev` after changing it.
 * Port 8000 is already used by the assupro-crm-local Docker container.
 */
export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001/api"
).replace(/\/+$/, "");
