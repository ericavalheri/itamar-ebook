import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, PIX_KEY, PIX_OWNER_NAME, STATUS_LABEL, formatMoney } from "@/lib/orders";
import ComprovanteForm from "./ComprovanteForm";

export const dynamic = "force-dynamic";

export default async function PedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) notFound();

  return (
    <main className="container" style={{ padding: "48px 20px 80px" }}>
      <span className="label">Seu pedido</span>
      <h1 style={{ margin: "12px 0 6px" }}>Adicional de Periculosidade</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>
        Pedido de {order.nome} · <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </p>

      {(order.status === "aguardando_pagamento" || order.status === "aguardando_aprovacao") && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Pague via Pix</h2>
          <p style={{ color: "var(--muted)" }}>
            Valor: <strong style={{ color: "var(--ink)" }}>{formatMoney(order.valor_centavos)}</strong>
          </p>
          <div style={{ background: "var(--sand)", borderRadius: 8, padding: "14px 16px", margin: "12px 0" }}>
            <div style={{ fontSize: "0.78rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Chave Pix (CPF)
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>{PIX_KEY}</div>
            <div style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Titular: {PIX_OWNER_NAME}</div>
          </div>
          <p style={{ fontSize: "0.92rem" }}>
            Após pagar, descreva o pagamento ou anexe o comprovante abaixo. Nossa equipe confirma
            manualmente e libera seu acesso individual em seguida.
          </p>
          {order.status === "aguardando_pagamento" ? (
            <ComprovanteForm orderId={order.id} />
          ) : (
            <p style={{ fontWeight: 700, color: "var(--copper)" }}>
              Comprovante recebido em {new Date(order.comprovante_enviado_at!).toLocaleString("pt-BR")}.
              Aguardando aprovação da equipe.
            </p>
          )}
        </div>
      )}

      {order.status === "aprovado" && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--success)" }}>
            Pagamento confirmado
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Seu acesso individual está liberado. Guarde este link, ele é pessoal e intransferível.
          </p>
          <Link href={`/ebook/${order.access_token}`} className="btn btn-primary">
            Abrir minha revista digital
          </Link>
        </div>
      )}

      {(order.status === "rejeitado" || order.status === "bloqueado") && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--danger)" }}>
            {order.status === "rejeitado" ? "Não conseguimos confirmar o pagamento" : "Acesso bloqueado"}
          </h2>
          <p style={{ color: "var(--muted)" }}>
            {order.admin_nota || "Fale com a equipe para regularizar seu pedido."}
          </p>
        </div>
      )}

      <a href={`/pedido/${order.id}`} className="btn btn-secondary">
        Atualizar status
      </a>
    </main>
  );
}
