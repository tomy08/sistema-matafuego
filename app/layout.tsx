import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sistema de Gestión de Matafuegos",
  description:
    "Gestión de vencimientos, trazabilidad y alertas para matafuegos en CABA.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full bg-slate-100 text-slate-900">{children}</body>
    </html>
  );
}
