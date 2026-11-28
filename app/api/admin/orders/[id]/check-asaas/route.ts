import { adminJson, requireOwnerMutation } from "@/lib/admin-accounts";
import { getPayment } from "@/lib/asaas";
import { getOrderById } from "@/lib/orders";
import { applyAsaasPix, canReconcilePix, PIX_PAYMENT_ID } from "@/lib/verified-pix";

export const runtime = "nodejs";

const message = {
  approved: "Pix recebido no Asaas. Leitura liberada.",
  unchanged: "Pedido já atualizado ou sem alteração. Confira o status na lista.",
  pending: "O Asaas ainda não registrou o recebimento do Pix.",
  awaitingSettlement: "O Asaas confirmou o pagamento, mas ainda não registrou o recebimento. A leitura segue bloqueada.",
  expired: "O Asaas informa que a cobrança está vencida.",
  cancelled: "O Asaas informa que a cobrança foi excluída. Pedido cancelado.",
  refunded: "O Asaas informa que o pagamento foi estornado. Leitura indisponível.",
  review: "Não foi possível conciliar esse Pix com o pedido. Nada foi alterado.",
};

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const denial = await requireOwnerMutation(req);
  if (denial) return denial;
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) return adminJson({ message: "Pedido não encontrado." }, 404);
  if (!order.asaas_payment_id || !PIX_PAYMENT_ID.test(order.asaas_payment_id)) {
    return adminJson({ message: "Este pedido não tem uma cobrança Pix vinculada." }, 409);
  }
  if (!canReconcilePix(order.status)) return adminJson({ message: message.unchanged });

  let payment;
  try { payment = await getPayment(order.asaas_payment_id); }
  catch { return adminJson({ message: "O Asaas não respondeu à consulta. Nada foi alterado; tente novamente." }, 503); }

  const result = await applyAsaasPix(order, payment);
  return adminJson({ message: message[result] }, result === "review" ? 409 : 200);
}
