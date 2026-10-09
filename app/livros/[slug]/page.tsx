import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { ICONS } from "@/components/icons";
import BookCover from "@/components/BookCover";

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
      <section style={{ background: "var(--sand)" }}>
        <div className="container livro-hero" style={{ padding: "48px 20px 56px" }}>
          <div>
            <span className="label">{product.serie}</span>
            <h1
              className="font-display"
              style={{ fontSize: "clamp(2rem, 4vw, 2.9rem)", lineHeight: 1.1, margin: "16px 0 14px", color: "var(--navy)" }}
            >
              {product.titulo}: {product.subtitulo}
            </h1>
            <p style={{ fontSize: "1.05rem", maxWidth: 540, color: "var(--muted)", marginBottom: 28 }}>
              {product.descricaoCurta}
            </p>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              <Link href={`/comprar/${product.slug}`} className="btn btn-primary">
                Quero o e-book — {formatMoney(product.precoCentavos)}
              </Link>
              <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                Acesso liberado após confirmação do pagamento via Pix
              </span>
            </div>
          </div>
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
              <BookCover serie={product.serie} titulo={product.titulo} titleSize="1.6rem" />
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ padding: "56px 20px" }}>
        <h2 className="font-display" style={{ fontSize: "1.5rem", marginBottom: 24, color: "var(--navy)" }}>
          O que você recebe
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
            gap: 18,
          }}
        >
          {product.recursos.map((item) => {
            const Icon = ICONS[item.icon];
            return (
              <div key={item.titulo} className="card" style={{ padding: 20 }}>
                <div className="icon-badge" style={{ marginBottom: 14 }}>
                  <Icon size={20} />
                </div>
                <strong style={{ display: "block", marginBottom: 6 }}>{item.titulo}</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.5 }}>{item.texto}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="container" style={{ padding: "0 20px 64px" }}>
        <div className="card" style={{ padding: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="label">Como funciona a compra</span>
            <h3 className="font-display" style={{ margin: "10px 0 6px", color: "var(--navy)" }}>
              Cadastro, Pix e liberação automática
            </h3>
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
