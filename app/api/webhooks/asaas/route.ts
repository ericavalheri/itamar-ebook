import { NextResponse } from "next/server";
import { createHash, timingSafeEqual } from "node:crypto";
import { applyVerifiedPixStatus, getOrderByAsaasPaymentId } from "@/lib/orders";
import { getPayment } from "@/lib/asaas";
import { notifyOrderApproved } from "@/lib/purchase-notify";
export const runtime = "nodejs";

const relevant = new Set(["PAYMENT_CONFIRMED","PAYMENT_RECEIVED","PAYMENT_OVERDUE","PAYMENT_DELETED","PAYMENT_REFUNDED","PAYMENT_PARTIALLY_REFUNDED","PAYMENT_REFUND_IN_PROGRESS","PAYMENT_REFUND_DENIED","PAYMENT_CHARGEBACK_REQUESTED","PAYMENT_CHARGEBACK_DISPUTE","PAYMENT_AWAITING_CHARGEBACK_REVERSAL"]);
const reply = (body:object,status=200) => NextResponse.json(body,{status,headers:{"Cache-Control":"private, no-store"}});
const digest=(s:string)=>createHash("sha256").update(s).digest();
const lastAuthWarning: Record<string, number> = Object.create(null);

export async function POST(req:Request) {
  const configured=process.env.ASAAS_WEBHOOK_TOKEN;
  const incoming=req.headers.get("asaas-access-token");
  if (!configured || !incoming || !timingSafeEqual(digest(configured),digest(incoming))) {
    const reason = !configured ? "token_not_configured" : !incoming ? "header_not_received" : "token_mismatch";
    const now = Date.now();
    if (now - (lastAuthWarning[reason] ?? 0) >= 60_000) {
      lastAuthWarning[reason] = now;
      console.warn(`[asaas-webhook] authentication rejected: ${reason}`);
    }
    return reply({error:"Não autorizado."},401);
  }
  let payload;
  try { payload=await req.json(); } catch { return reply({error:"Corpo inválido."},400); }
  const event=payload?.event, pay=payload?.payment;
  if (typeof event!=="string" || typeof pay?.id!=="string" || !/^[A-Za-z0-9_-]{1,100}$/.test(pay.id)) return reply({error:"Payload inesperado."},400);
  if (!relevant.has(event)) return reply({ok:true,ignored:true});
  const order=getOrderByAsaasPaymentId(pay.id);
  if (!order) {
    // Checkout persists after calling Asaas. Retry an early webhook carrying an app-shaped order id.
    return typeof pay.externalReference==="string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(pay.externalReference)
      ? reply({retry:true},503) : reply({ok:true,ignored:true});
  }
  if (typeof pay.externalReference==="string" && pay.externalReference!==order.id) return reply({ok:true,review:true});
  let current;
  try { current=await getPayment(pay.id); } catch { return reply({retry:true},503); }
  if (!current || current.id!==pay.id || current.externalReference!==order.id || current.billingType!=="PIX")
    return reply({ok:true,review:true});

  // A verified terminal refund always takes priority and removes sessions.
  if (current.status==="REFUNDED") {
    applyVerifiedPixStatus(order.id,pay.id,"refunded");
  } else if (current.deleted===true) {
    applyVerifiedPixStatus(order.id,pay.id,"deleted");
  } else if (current.status==="RECEIVED") {
    if (typeof current.value!=="number" || !Number.isFinite(current.value) ||
        Math.abs(current.value*100-order.valor_centavos)>0.00001) return reply({ok:true,review:true});
    const changed=applyVerifiedPixStatus(order.id,pay.id,"received");
    if (changed) {
      try { await notifyOrderApproved(changed); } catch { console.error("Falha interna ao preparar acesso ao e-book."); }
    }
  } else if (current.status==="OVERDUE") {
    applyVerifiedPixStatus(order.id,pay.id,"overdue");
  } else if (current.status==="CONFIRMED") {
    // Personal-account Pix confirmation can be precautionary; wait for RECEIVED.
    return reply({ok:true,awaitingSettlement:true});
  } else {
    return reply({ok:true,review:true});
  }
  return reply({ok:true});
}
