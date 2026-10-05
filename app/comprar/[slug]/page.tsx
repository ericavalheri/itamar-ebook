import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { formatMoney } from "@/lib/money";
import ComprarForm from "./ComprarForm";

export default async function ComprarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  return (
    <main className="container" style={{ padding: "48px 20px 80px" }}>
      <span className="label">Cadastro do comprador</span>
      <h1 style={{ margin: "12px 0 6px" }}>{product.titulo}</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28, maxWidth: 520 }}>
        Preencha seus dados para gerar seu pedido. Na próxima etapa você verá o QR Code Pix para
        pagamento de {formatMoney(product.precoCentavos)}.
      </p>
      <ComprarForm produto={product.slug} />
    </main>
  );
}
