import type { AsaasPayment } from "./asaas";
import type { Order } from "./db";
import { applyVerifiedPixStatus } from "./orders";
import { notifyOrderApproved } from "./purchase-notify";

export const PIX_PAYMENT_ID = /^[A-Za-z0-9_-]{1,100}$/;
export const canReconcilePix = (status: string) =>
  status === "aguardando_pagamento" || status === "expirado";

type PixCheck = "approved" | "unchanged" | "pending" | "awaitingSettlement" |
  "expired" | "cancelled" | "refunded" | "review";

/** Apply only an authoritative read from the Asaas account used by checkout. */
export async function applyAsaasPix(
  order: Pick<Order, "id" | "asaas_payment_id" | "valor_centavos">,
  payment: AsaasPayment | null,
): Promise<PixCheck> {
  const paymentId = order.asaas_payment_id;
  if (!paymentId || !payment || payment.id !== paymentId ||
      payment.externalReference !== order.id || payment.billingType !== "PIX") return "review";

  // Preserve webhook precedence: a terminal refund revokes reader access.
  if (payment.status === "REFUNDED") {
    applyVerifiedPixStatus(order.id, paymentId, "refunded");
    return "refunded";
  }
  if (payment.deleted === true) {
    return applyVerifiedPixStatus(order.id, paymentId, "deleted") ? "cancelled" : "unchanged";
  }
  if (payment.status === "RECEIVED") {
    if (typeof payment.value !== "number" || !Number.isFinite(payment.value) ||
        Math.abs(payment.value * 100 - order.valor_centavos) > 0.00001) return "review";
    const changed = applyVerifiedPixStatus(order.id, paymentId, "received");
    if (!changed) return "unchanged";
    try { await notifyOrderApproved(changed); }
    catch { console.error("Falha interna ao preparar acesso ao e-book."); }
    return "approved";
  }
  if (payment.status === "OVERDUE") {
    applyVerifiedPixStatus(order.id, paymentId, "overdue");
    return "expired";
  }
  if (payment.status === "CONFIRMED") return "awaitingSettlement";
  if (payment.status === "PENDING") return "pending";
  return "review";
}
