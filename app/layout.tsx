import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Controle de Despesas",
  description: "Controle de despesas e receitas",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
