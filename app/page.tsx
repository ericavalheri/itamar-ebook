import Link from "next/link";
import { PRODUCTS } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import BookCover from "@/components/BookCover";

export default function BibliotecaPage() {
  return (
    <main>
      <section
        style={{
          background: "linear-gradient(155deg, #111d2f 0%, #0c6661 58%, #c77842 130%)",
          color: "#fffaf1",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 56px)",
          }}
        />
        <div className="container" style={{ padding: "64px 20px 72px", position: "relative" }}>
          <span
            className="label"
            style={{ color: "#f6df9d", borderColor: "rgba(230,196,106,0.44)", background: "transparent" }}
          >
            Honestamente, Itamar
          </span>
          <h1 style={{ fontSize: "clamp(2.2rem, 4.5vw, 3.2rem)", lineHeight: 1.1, margin: "16px 0 12px", maxWidth: 680 }}>
            Biblioteca de e-books sobre direitos trabalhistas
          </h1>
          <p style={{ fontSize: "1.08rem", maxWidth: 580, opacity: 0.92 }}>
            Revistas digitais interativas, com base legal, calculadoras e exemplos práticos
            para você entender e conferir os seus direitos.
          </p>
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
                <h2 style={{ fontSize: "1.1rem", margin: "0 0 8px" }}>{product.titulo}</h2>
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
