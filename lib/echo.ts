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

const token =
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

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

        authEndpoint: "http://127.0.0.1:8000/api/broadcasting/auth",

        auth: {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        },
      })
    : null;

export default echo;