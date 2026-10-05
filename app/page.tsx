import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { formatMoney } from "@/lib/money";

export default function BibliotecaPage() {
  return (
    <main>
      <section
        style={{
          background: "linear-gradient(160deg, #111d2f 0%, #0c6661 62%, #c77842 130%)",
          color: "#fffaf1",
        }}
      >
        <div className="container" style={{ padding: "56px 20px 64px" }}>
          <span
            className="label"
            style={{ color: "#f6df9d", borderColor: "rgba(230,196,106,0.44)", background: "transparent" }}
          >
            Honestamente, Itamar
          </span>
          <h1 style={{ fontSize: "clamp(2.1rem, 4.5vw, 3rem)", lineHeight: 1.1, margin: "16px 0 12px", maxWidth: 680 }}>
            Biblioteca de e-books sobre direitos trabalhistas
          </h1>
          <p style={{ fontSize: "1.05rem", maxWidth: 580, opacity: 0.92 }}>
            Revistas digitais interativas, com base legal, calculadoras e exemplos práticos
            para você entender e conferir os seus direitos.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: "48px 20px 64px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 20,
          }}
        >
          {PRODUCTS.map((product) => (
            <Link
              key={product.slug}
              href={`/livros/${product.slug}`}
              className="card"
              style={{ padding: 24, display: "block", color: "inherit", textDecoration: "none" }}
            >
              <span className="label">{product.serie}</span>
              <h2 style={{ fontSize: "1.3rem", margin: "12px 0 8px" }}>{product.titulo}</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.92rem", marginBottom: 18 }}>
                {product.descricaoCurta}
              </p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong style={{ color: "var(--petrol)" }}>{formatMoney(product.precoCentavos)}</strong>
                <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--copper)" }}>
                  Ver detalhes →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
