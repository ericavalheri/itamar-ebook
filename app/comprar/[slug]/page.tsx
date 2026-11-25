import { ownerPixPilot, PILOT_VOLUME } from "@/lib/owner-pix-pilot";
import Link from "next/link";
import { PREVIEW_MESSAGE } from "@/lib/sales";
import { getCheckoutProduct } from "@/lib/checkout-catalog";
export const dynamic = "force-dynamic";
import { notFound } from "next/navigation";
import { getCatalogProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import ComprarForm from "./ComprarForm";

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getCatalogProductBySlug(slug);
  if (!product) notFound();

  const pilot = slug === PILOT_VOLUME ? await ownerPixPilot() : null;
  if (pilot) return (
    <main className="container" style={{padding:"48px 20px 80px"}}>
      <span className="label">Teste privado · apenas proprietário</span>
      <h1>{product.titulo}</h1>
      <p>Pix real de <strong>R$ 5,32</strong>, com cupom de 86% e limite de um uso. As vendas públicas continuam fechadas.</p>
      <ComprarForm produto={product.slug} ownerPilot />
    </main>
  );
  if (!(await getCheckoutProduct(slug))) {
    return (
      <main className="container" style={{ padding: "48px 20px 80px" }}>
        <span className="label">Em breve</span>
        <h1>{product.titulo}</h1>
        <p style={{ maxWidth: 560 }}>{PREVIEW_MESSAGE}</p>
        <Link href={`/livros/${product.slug}`} className="btn btn-primary">Conhecer o e-book</Link>
      </main>
    );
  }

  return (
    <main className="container" style={{ padding: "48px 20px 80px" }}>
      <span className="label">Cadastro do comprador</span>
      <h1 style={{ margin: "12px 0 6px" }}>{product.titulo}</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28, maxWidth: 520 }}>
        Preencha seus dados para gerar o Pix nesta página. Preço do e-book: {formatMoney(product.precoCentavos)} antes de eventual desconto.
      </p>
      <ComprarForm produto={product.slug} />
    </main>
  );
}
