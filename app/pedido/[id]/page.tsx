import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, STATUS_LABEL, formatMoney } from "@/lib/orders";
import CopyPixCode from "./CopyPixCode";
import PixStatusWatcher from "./PixStatusWatcher";

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
      <PixStatusWatcher orderId={order.id} status={order.status} />
      <span className="label">Seu pedido</span>
      <h1 style={{ margin: "12px 0 6px" }}>Adicional de Periculosidade</h1>
      <p style={{ color: "var(--muted)", marginBottom: 20 }}>
        Pedido de {order.nome} · <span className={`status-pill status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
      </p>

      {order.status === "aguardando_pagamento" && (
        <div className="card" style={{ padding: 24, marginBottom: 20, maxWidth: 420 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Pague via Pix</h2>
          <p style={{ color: "var(--muted)" }}>
            Valor: <strong style={{ color: "var(--ink)" }}>{formatMoney(order.valor_centavos)}</strong>
          </p>
          {order.pix_qr_base64 && (
            <img
              src={`data:image/png;base64,${order.pix_qr_base64}`}
              alt="QR Code Pix"
              width={220}
              height={220}
              style={{ display: "block", margin: "0 auto 16px", borderRadius: 8 }}
            />
          )}
          {order.pix_copia_cola && <CopyPixCode code={order.pix_copia_cola} />}
          <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: 14 }}>
            Escaneie o QR Code ou use o código copia e cola no app do seu banco. O acesso é
            liberado automaticamente assim que o pagamento for confirmado — esta página
            atualiza sozinha.
          </p>
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

      {order.status === "expirado" && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--danger)" }}>
            O Pix deste pedido expirou
          </h2>
          <p style={{ color: "var(--muted)" }}>
            Não identificamos o pagamento a tempo. Faça um novo pedido para gerar um Pix atualizado.
          </p>
          <Link href="/comprar" className="btn btn-primary">
            Gerar novo pedido
          </Link>
        </div>
      )}

      {order.status === "cancelado" && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--danger)" }}>
            Pedido cancelado
          </h2>
          <p style={{ color: "var(--muted)" }}>
            {order.admin_nota || "Este pedido foi cancelado. Fale com a equipe se precisar de ajuda."}
          </p>
        </div>
      )}

      {order.status === "bloqueado" && (
        <div className="card" style={{ padding: 24, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--danger)" }}>
            Acesso bloqueado
          </h2>
          <p style={{ color: "var(--muted)" }}>
            {order.admin_nota || "Fale com a equipe se acredita que isso é um engano."}
          </p>
        </div>
      )}
    </main>
  );
}
