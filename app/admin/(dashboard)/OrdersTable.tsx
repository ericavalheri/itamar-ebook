"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@/lib/db";
import { STATUS_LABEL, formatMoney } from "@/lib/money";

function useOrderAction() {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function run(id: string, action: "approve" | "reject" | "block" | "reactivate", nota?: string) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nota ? { nota } : {}),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Ação falhou.");
        return;
      }
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  return { run, pendingId };
}

function ComprovanteCell({ order }: { order: Order }) {
  const [open, setOpen] = useState(false);
  if (!order.comprovante_texto && !order.comprovante_arquivo_base64) {
    return <span style={{ color: "var(--muted)" }}>—</span>;
  }
  return (
    <div>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Ocultar" : "Ver comprovante"}
      </button>
      {open && (
        <div style={{ marginTop: 8, fontSize: "0.85rem", maxWidth: 260 }}>
          {order.comprovante_texto && <p style={{ margin: "4px 0" }}>{order.comprovante_texto}</p>}
          {order.comprovante_arquivo_base64 && (
            <a
              href={`data:${order.comprovante_arquivo_tipo};base64,${order.comprovante_arquivo_base64}`}
              download={order.comprovante_arquivo_nome || "comprovante"}
              target="_blank"
              rel="noreferrer"
            >
              Baixar {order.comprovante_arquivo_nome || "arquivo"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function AccessLinkCell({ order }: { order: Order }) {
  const [copied, setCopied] = useState(false);
  if (order.status !== "aprovado" || !order.access_token) {
    return <span style={{ color: "var(--muted)" }}>—</span>;
  }
  const link = typeof window !== "undefined"
    ? `${window.location.origin}/ebook/${order.access_token}`
    : `/ebook/${order.access_token}`;
  return (
    <button
      type="button"
      className="btn btn-secondary"
      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
      onClick={async () => {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copiado!" : "Copiar link"}
    </button>
  );
}

export default function OrdersTable({ orders }: { orders: Order[] }) {
  const { run, pendingId } = useOrderAction();

  if (orders.length === 0) {
    return <p style={{ color: "var(--muted)" }}>Nenhum pedido ainda.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table>
        <thead>
          <tr>
            <th>Comprador</th>
            <th>Contato</th>
            <th>UF</th>
            <th>Valor</th>
            <th>Status</th>
            <th>Comprovante</th>
            <th>Acesso</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const busy = pendingId === order.id;
            return (
              <tr key={order.id}>
                <td>
                  <strong>{order.nome}</strong>
                  <div style={{ fontSize: "0.76rem", color: "var(--muted)" }}>
                    {new Date(order.created_at).toLocaleString("pt-BR")}
                  </div>
                </td>
                <td>
                  <div>{order.email}</div>
                  <div style={{ color: "var(--muted)" }}>{order.telefone}</div>
                </td>
                <td>{order.estado}</td>
                <td>{formatMoney(order.valor_centavos)}</td>
                <td>
                  <span className={`status-pill status-${order.status}`}>
                    {STATUS_LABEL[order.status]}
                  </span>
                </td>
                <td><ComprovanteCell order={order} /></td>
                <td><AccessLinkCell order={order} /></td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {order.status === "aguardando_aprovacao" && (
                      <>
                        <button
                          className="btn btn-success"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          disabled={busy}
                          onClick={() => run(order.id, "approve")}
                        >
                          Aprovar
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          disabled={busy}
                          onClick={() => run(order.id, "reject", prompt("Motivo (opcional):") || undefined)}
                        >
                          Rejeitar
                        </button>
                      </>
                    )}
                    {order.status === "aprovado" && (
                      <button
                        className="btn btn-danger"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        disabled={busy}
                        onClick={() => run(order.id, "block", prompt("Motivo do bloqueio (opcional):") || undefined)}
                      >
                        Bloquear acesso
                      </button>
                    )}
                    {(order.status === "bloqueado" || order.status === "rejeitado") && (
                      <button
                        className="btn btn-success"
                        style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                        disabled={busy}
                        onClick={() => run(order.id, "reactivate")}
                      >
                        Reativar acesso
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
