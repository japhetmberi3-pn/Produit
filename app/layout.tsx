import "./globals.css";

import { AuthProvider } from "@/app/context/AuthContext";
import { ThemeProvider } from "@/app/context/ThemeContext";
import AmbientLight from "@/app/components/AmbientLight";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <AuthProvider>
          <ThemeProvider>
            <AmbientLight />
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}