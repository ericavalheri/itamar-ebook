export const dynamic = "force-dynamic";
import ComprarForm from "@/app/comprar/[slug]/ComprarForm";
import AuthorProfile from "@/components/AuthorProfile";
import { getCheckoutProduct } from "@/lib/checkout-catalog";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import { ICONS } from "@/components/icons";
import BookCover from "@/components/BookCover";

const salesCopy: Record<string, {
  headline: string; intro: string; takeaways: string[];
  scenario: string; steps: string[]; feature: string;
}> = {
  "adicional-periculosidade": {
    headline: "Meu adicional veio certo?",
    intro: "Se você trabalha em uma atividade de risco, já deve ter se perguntado se o adicional se aplica ao seu caso ou se o valor no holerite está certo. Este e-book ajuda você a sair do achismo, com exemplos, uma calculadora e um roteiro para conferir o que recebeu.",
    takeaways: ["Entenda o que vale conferir no seu trabalho", "Simule o adicional e as horas extras", "Compare seu holerite com um exemplo comentado"],
    scenario: "O adicional apareceu no holerite, mas você não sabe de onde saiu aquele valor. Por onde começar?",
    steps: ["Localize a linha do adicional no contracheque.", "Use o exemplo do e-book para entender de onde vem o valor.", "Simule o cálculo e anote o que ainda precisa esclarecer."],
    feature: "Não é só um texto para ler. É um guia para abrir ao lado do holerite.",
  },
  "adicional-insalubridade": {
    headline: "Por que meu adicional veio nesse grau?",
    intro: "Quem trabalha exposto a agentes nocivos nem sempre entende o que foi considerado na hora de definir o adicional. Este volume foi pensado para ajudar você a entender os critérios, distinguir os graus e saber o que olhar no contracheque.",
    takeaways: ["Entenda por que a exposição no trabalho importa", "Veja o que distingue os graus mínimo, médio e máximo", "Saiba onde olhar no holerite e o que perguntar"],
    scenario: "Você e um colega fazem tarefas parecidas, mas o adicional não é igual. O que vale conferir antes de tirar uma conclusão?",
    steps: ["Identifique o tipo de exposição na sua rotina.", "Confira se há informação sobre o grau e como ele foi definido.", "Localize a verba no holerite e anote o que precisa ser esclarecido."],
    feature: "Entenda o que você precisa conferir antes de comparar seu caso com o de outra pessoa.",
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getCatalogProductBySlug((await params).slug);
  return product
    ? { title: `${product.titulo} | Honestamente Itamar`, description: product.descricaoCurta }
    : { title: "E-book não encontrado | Honestamente Itamar" };
}

export default async function LivroPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getCatalogProductBySlug(slug);
  if (!product) notFound();

  const canBuy = Boolean(await getCheckoutProduct(slug));
  const copy = salesCopy[slug];

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
              {copy?.headline ?? `${product.titulo}: ${product.subtitulo}`}
            </h1>
            <p className="ebook-sales-product">{product.titulo} <span>· E-book digital</span></p>
            <p className="ebook-sales-intro">{copy?.intro ?? product.descricaoCurta}</p>
            {copy && <ul className="ebook-sales-benefits">
              {copy.takeaways.map(item => <li key={item}>{item}</li>)}
            </ul>}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
              {canBuy ? (
                <Link href="#comprar" className="btn btn-primary">
                  Quero conferir meu adicional · {formatMoney(product.precoCentavos)}
                </Link>
              ) : (
                <a className="btn btn-primary" href="#na-pratica">Ver como o guia ajuda</a>
              )}
              <span style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                {canBuy ? "Acesso liberado após confirmação do pagamento via Pix" : `Vendas em breve · ${formatMoney(product.precoCentavos)}`}
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

      {copy && <section id="na-pratica" aria-labelledby="na-pratica-titulo" className="container ebook-sales-preview">
        <div>
          <span className="label">Uma situação do dia a dia</span>
          <h2 id="na-pratica-titulo">{copy.scenario}</h2>
          <p>{copy.feature}</p>
        </div>
        <ol>
          {copy.steps.map((step, index) => (
            <li key={step}><span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>{step}</li>
          ))}
        </ol>
      </section>}

      <section className="container" style={{ padding: "48px 20px 56px" }}>
        <h2 className="font-display" style={{ fontSize: "1.5rem", marginBottom: 24, color: "var(--navy)" }}>
          O que você vai encontrar neste volume
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

      {canBuy && <section id="comprar" aria-labelledby="comprar-titulo" className="container" style={{ padding: "0 20px 64px", scrollMarginTop: 92 }}>
        <div className="card" style={{ padding: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span className="label">Acesso individual · Pagamento único</span>
            <h2 id="comprar-titulo" className="font-display" style={{ margin: "10px 0 6px", color: "var(--navy)" }}>
              Acesse o e-book por {formatMoney(product.precoCentavos)}
            </h2>
            <p style={{ color: "var(--muted)", maxWidth: 520 }}>
              Você faz seu cadastro e paga com o QR Code Pix gerado na hora. Assim que o
              pagamento é confirmado, seu acesso individual é liberado automaticamente.
            </p>
          </div>
          <ComprarForm produto={product.slug} />
        </div>
      </section>}

      {copy && <div className="container ebook-sales-note">
        <p>Material educativo. O e-book ajuda a entender quais pontos conferir, mas não determina se o adicional é devido em um caso específico.</p>
      </div>}

      <div className="container author-book-shell"><AuthorProfile variant="book" /></div>

      <div className="container" style={{ padding: "0 20px 48px" }}>
        <Link href="/" style={{ fontSize: "0.9rem", color: "var(--muted)" }}>
          ← Voltar para a biblioteca
        </Link>
      </div>
    </main>
  );
}
