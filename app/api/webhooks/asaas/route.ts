import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import {
  getOrderById,
  getOrderByAsaasPaymentId,
  markOrderPaid,
  markOrderExpired,
  markOrderCancelled,
} from "@/lib/orders";

export const runtime = "nodejs";

const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const EXPIRED_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const CANCELLED_EVENTS = new Set(["PAYMENT_DELETED", "PAYMENT_REFUNDED"]);

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN;
  if (!expected) return false;
  const received = req.headers.get("asaas-access-token") || "";
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { event, payment } = (body ?? {}) as {
    event?: string;
    payment?: { id?: string; externalReference?: string };
  };

  if (!event || !payment?.id) {
    return NextResponse.json({ error: "Payload inesperado." }, { status: 400 });
  }

  const order = payment.externalReference
    ? getOrderById(payment.externalReference)
    : getOrderByAsaasPaymentId(payment.id);

  if (!order) {
    // Unknown payment for us: acknowledge so Asaas doesn't keep retrying.
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (PAID_EVENTS.has(event)) {
    markOrderPaid(order.id);
  } else if (EXPIRED_EVENTS.has(event)) {
    markOrderExpired(order.id);
  } else if (CANCELLED_EVENTS.has(event)) {
    markOrderCancelled(order.id);
  }

  return NextResponse.json({ ok: true });
}
