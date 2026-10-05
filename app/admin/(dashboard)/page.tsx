import { listOrders } from "@/lib/orders";
import { PRODUCTS } from "@/lib/products";
import OrdersTable from "./OrdersTable";
import LogoutButton from "./LogoutButton";
import ManualOrderForm from "./ManualOrderForm";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const orders = listOrders();
  const aguardando = orders.filter((o) => o.status === "aguardando_pagamento").length;

  return (
    <main className="container" style={{ padding: "40px 20px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <span className="label">Painel administrativo</span>
          <h1 style={{ margin: "12px 0 4px" }}>Compradores</h1>
          <p style={{ color: "var(--muted)", margin: 0 }}>
            O acesso é liberado automaticamente pelo Asaas quando o Pix é confirmado.{" "}
            {aguardando > 0
              ? `${aguardando} pedido(s) aguardando pagamento.`
              : "Nenhum pedido aguardando pagamento."}
          </p>
        </div>
        <LogoutButton />
      </div>
      <div style={{ marginTop: 24 }}>
        <ManualOrderForm products={PRODUCTS} />
      </div>
      <div className="card" style={{ padding: 20, marginTop: 20 }}>
        <OrdersTable orders={orders} />
      </div>
    </main>
  );
}
