import { salesEnabled, PREVIEW_MESSAGE } from "@/lib/sales";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

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
    <html lang="pt-BR" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        {!salesEnabled() && (
          <aside aria-label="Status do lançamento" style={{ padding: "14px 20px", background: "#111d2f", color: "#fffaf1", textAlign: "center", fontSize: "0.9rem" }}>
            {PREVIEW_MESSAGE}
          </aside>
        )}
        {children}
      </body>
    </html>
  );
}
