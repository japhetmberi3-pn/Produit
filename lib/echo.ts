import { API_URL } from "@/lib/config";
import Echo from "laravel-echo";
import Pusher from "pusher-js";

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

if (typeof window !== "undefined") {
  window.Pusher = Pusher;
}

const echo =
  typeof window !== "undefined"
    ? new Echo({
        broadcaster: "reverb",
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
        wsPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT),
        wssPort: Number(process.env.NEXT_PUBLIC_REVERB_PORT),
        forceTLS: false,
        enabledTransports: ["ws", "wss"],

        // Le token est relu à chaque autorisation de canal (headersProvider),
        // pour suivre les connexions / déconnexions sans recharger la page.
        channelAuthorization: {
          endpoint: `${API_URL}/broadcasting/auth`,
          transport: "ajax",
          headers: {
            Accept: "application/json",
          },
          headersProvider: () => ({
            Authorization: `Bearer ${localStorage.getItem("token") ?? ""}`,
          }),
        },
      })
    : null;

export default echo;