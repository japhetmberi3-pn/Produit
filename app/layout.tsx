import "./globals.css";

import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import { THEME_STORAGE_KEY } from "@/lib/theme";

/*
 * Applique le thème sauvegardé AVANT le premier affichage
 * (évite un flash clair → sombre). Voir la doc Next :
 * node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md
 */
const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="dark"||t==="light")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

export const metadata = {
  title: "ShopX — Achetez et vendez simplement",
  description:
    "ShopX : la marketplace pour découvrir des produits et ouvrir votre boutique en ligne.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
