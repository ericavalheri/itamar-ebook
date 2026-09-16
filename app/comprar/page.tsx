import ComprarForm from "./ComprarForm";
import { EBOOK_PRICE_CENTAVOS, formatMoney } from "@/lib/orders";

export default function ComprarPage() {
  return (
    <main className="container" style={{ padding: "48px 20px 80px" }}>
      <span className="label">Cadastro do comprador</span>
      <h1 style={{ margin: "12px 0 6px" }}>Adicional de Periculosidade</h1>
      <p style={{ color: "var(--muted)", marginBottom: 28, maxWidth: 520 }}>
        Preencha seus dados para gerar seu pedido. Na próxima etapa você verá o QR Code Pix para
        pagamento de {formatMoney(EBOOK_PRICE_CENTAVOS)}.
      </p>
      <ComprarForm />
    </main>
  );
}
