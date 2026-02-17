import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Physio MVP",
  description: "Controle de Pacientes (Fisioterapia)",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
