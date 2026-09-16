import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Adicional de Periculosidade | E-book Itamar",
  description:
    "Revista digital sobre adicional de periculosidade: quem tem direito, como calcular e como conferir no holerite.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
