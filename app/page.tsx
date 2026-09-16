import Link from "next/link";
import { EBOOK_PRICE_CENTAVOS, formatMoney } from "@/lib/orders";

export default function SalesPage() {
  return (
    <main>
      <section
        style={{
          background:
            "linear-gradient(160deg, #111d2f 0%, #0c6661 62%, #c77842 130%)",
          color: "#fffaf1",
        }}
      >
        <div className="container" style={{ padding: "64px 20px 84px" }}>
          <span className="label" style={{ color: "#f6df9d", borderColor: "rgba(230,196,106,0.44)", background: "transparent" }}>
            Série Verbas Trabalhistas · Volume 01
          </span>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", lineHeight: 1.05, margin: "18px 0 16px", maxWidth: 720 }}>
            Adicional de Periculosidade: entenda, calcule e confira o seu direito
          </h1>
          <p style={{ fontSize: "1.15rem", maxWidth: 620, opacity: 0.92, marginBottom: 32 }}>
            Revista digital interativa com base legal, calculadora, exemplos de holerite e um
            passo a passo para conferir se você está recebendo o valor correto.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link href="/comprar" className="btn btn-primary">
              Quero o e-book — {formatMoney(EBOOK_PRICE_CENTAVOS)}
            </Link>
            <span style={{ fontSize: "0.9rem", opacity: 0.85 }}>
              Acesso liberado após confirmação do pagamento via Pix
            </span>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "56px 20px" }}>
        <h2 style={{ fontSize: "1.7rem", marginBottom: 24 }}>O que você recebe</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 18,
          }}
        >
          {[
            { title: "Base legal explicada", text: "CLT, NR-16 e súmulas do TST traduzidas em linguagem simples." },
            { title: "Calculadora integrada", text: "Simule o valor do adicional e das horas extras com o seu salário." },
            { title: "Modelo de holerite", text: "Veja como a verba deve aparecer no contracheque, com exemplo real." },
            { title: "Roteiro de conferência", text: "Cinco passos para checar se o pagamento está correto." },
            { title: "Leitura por capítulos", text: "Navegação, busca e progresso de leitura no celular ou no computador." },
            { title: "Acesso individual", text: "Seu acesso é pessoal, vinculado ao seu cadastro e à sua compra." },
          ].map((item) => (
            <div key={item.title} className="card" style={{ padding: 20 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>{item.title}</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.94rem" }}>{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: "0 20px 64px" }}>
        <div className="card" style={{ padding: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="label">Como funciona a compra</span>
            <h3 style={{ margin: "10px 0 6px" }}>Cadastro, Pix e liberação automática</h3>
            <p style={{ color: "var(--muted)", maxWidth: 520 }}>
              Você faz seu cadastro e paga com o QR Code Pix gerado na hora. Assim que o
              pagamento é confirmado, seu acesso individual é liberado automaticamente.
            </p>
          </div>
          <Link href="/comprar" className="btn btn-primary">
            Começar meu cadastro
          </Link>
        </div>
      </section>
    </main>
  );
}
