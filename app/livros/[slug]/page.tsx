import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";

export default async function LivroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main>
      <section
        style={{
          background: "linear-gradient(160deg, #111d2f 0%, #0c6661 62%, #c77842 130%)",
          color: "#fffaf1",
        }}
      >
        <div className="container" style={{ padding: "64px 20px 84px" }}>
          <span
            className="label"
            style={{ color: "#f6df9d", borderColor: "rgba(230,196,106,0.44)", background: "transparent" }}
          >
            {product.serie}
          </span>
          <h1 style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", lineHeight: 1.05, margin: "18px 0 16px", maxWidth: 720 }}>
            {product.titulo}: {product.subtitulo}
          </h1>
          <p style={{ fontSize: "1.15rem", maxWidth: 620, opacity: 0.92, marginBottom: 32 }}>
            {product.descricaoCurta}
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
            <Link href={`/comprar/${product.slug}`} className="btn btn-primary">
              Quero o e-book — {formatMoney(product.precoCentavos)}
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
          {product.recursos.map((item) => (
            <div key={item.titulo} className="card" style={{ padding: 20 }}>
              <strong style={{ display: "block", marginBottom: 8 }}>{item.titulo}</strong>
              <span style={{ color: "var(--muted)", fontSize: "0.94rem" }}>{item.texto}</span>
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
          <Link href={`/comprar/${product.slug}`} className="btn btn-primary">
            Começar meu cadastro
          </Link>
        </div>
      </section>

      <div className="container" style={{ padding: "0 20px 48px" }}>
        <Link href="/" style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          ← Voltar para a biblioteca
        </Link>
      </div>
    </main>
  );
}
