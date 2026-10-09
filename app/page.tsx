import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import BookCover from "@/components/BookCover";

export default function BibliotecaPage() {
  const destaque = PRODUCTS[0];

  return (
    <main>
      <section style={{ background: "var(--sand)" }}>
        <div
          className="container livro-hero"
          style={{ padding: "56px 20px 64px" }}
        >
          <div>
            <span className="label">Honestamente, Itamar</span>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(2.1rem, 4.2vw, 3rem)", lineHeight: 1.12, margin: "18px 0 14px", color: "var(--navy)" }}
            >
              Biblioteca de e-books sobre direitos trabalhistas
            </h1>
            <p style={{ fontSize: "1.05rem", maxWidth: 520, color: "var(--muted)", marginBottom: 0 }}>
              Revistas digitais interativas, com base legal, calculadoras e exemplos práticos
              para você entender e conferir os seus direitos.
            </p>
          </div>
          {destaque && (
            <div style={{ position: "relative" }}>
              <div
                aria-hidden
                style={{
                  position: "absolute",
                  inset: "-10%",
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(12,102,97,0.14), transparent 70%)",
                  zIndex: 0,
                }}
              />
              <div className="livro-hero-cover" style={{ position: "relative", zIndex: 1 }}>
                <BookCover serie={destaque.serie} titulo={destaque.titulo} />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="container" style={{ padding: "48px 20px 72px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 24,
          }}
        >
          {PRODUCTS.map((product) => (
            <Link
              key={product.slug}
              href={`/livros/${product.slug}`}
              className="card card-link"
              style={{ overflow: "hidden", color: "inherit", textDecoration: "none", width: 260, flex: "0 0 auto" }}
            >
              <BookCover serie={product.serie} titulo={product.titulo} />
              <div style={{ padding: "18px 18px 20px" }}>
                <h2 className="font-display" style={{ fontSize: "1.1rem", margin: "0 0 8px", color: "var(--navy)" }}>
                  {product.titulo}
                </h2>
                <p style={{ color: "var(--muted)", fontSize: "0.88rem", margin: "0 0 16px", lineHeight: 1.5 }}>
                  {product.descricaoCurta}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "var(--petrol)", fontSize: "1.05rem" }}>
                    {formatMoney(product.precoCentavos)}
                  </strong>
                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "var(--copper)" }}>
                    Ver detalhes →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
