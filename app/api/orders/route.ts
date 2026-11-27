import { rejectUntrustedAdminOrigin } from "@/lib/admin-accounts";
import { ownerPixPilot, PILOT_CENTAVOS } from "@/lib/owner-pix-pilot";
import { pixCheckoutEnabled, PREVIEW_MESSAGE } from "@/lib/sales";
import { CouponError, reserveCoupon, reserveOwnerPilotCoupon, releaseCouponReservation } from "@/lib/coupons";
import { claimPixRequest, pixRequestPattern, releaseUnusedPixRequest } from "@/lib/pix-request";
import { NextRequest, NextResponse } from "next/server";
import { createOrder, getOrderById, storeOrderPixQr } from "@/lib/orders";
import { getCheckoutProduct } from "@/lib/checkout-catalog";
import { parsePixReceipt } from "@/lib/pix-receipt";
import { isValidCPF, onlyDigits } from "@/lib/cpf";
import { findOrCreateCustomer, createPixCharge, getPixQrCode, AsaasError } from "@/lib/asaas";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  const pilotRequest = req.headers.get("x-itamar-pix-pilot") === "1";
  if (pilotRequest) {
    const denied = rejectUntrustedAdminOrigin(req);
    if (denied) return denied;
  }
  const pilot = pilotRequest ? await ownerPixPilot() : null;
  if (pilotRequest ? !pilot : !pixCheckoutEnabled()) {
    return NextResponse.json({ error: PREVIEW_MESSAGE }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { produto, nome, email, telefone, estado, cpf, coupon, requestId } = (body ?? {}) as Record<string, unknown>;

  if (typeof requestId !== "string" || !pixRequestPattern.test(requestId)) {
    return NextResponse.json({error:"Reabra a página para iniciar o pedido."},{status:400});
  }
  if (coupon !== undefined && (typeof coupon !== "string" || coupon.length > 48)) {
    return NextResponse.json({error:"Cupom inválido."},{status:400});
  }
  if (pilot && (produto !== pilot.product.slug || coupon !== undefined)) {
    return NextResponse.json({error:"O teste está limitado ao Volume 1."},{status:400});
  }
  const product = pilot ? pilot.product : typeof produto === "string" ? await getCheckoutProduct(produto) : undefined;
  if (!product) {
    return NextResponse.json({ error: "E-book não encontrado." }, { status: 404 });
  }

  if (
    typeof nome !== "string" || nome.trim().length < 3 ||
    typeof email !== "string" || !isValidEmail(email) ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof estado !== "string" || estado.trim().length !== 2 ||
    typeof cpf !== "string" || !isValidCPF(cpf)
  ) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail, telefone, estado e CPF válidos." },
      { status: 400 }
    );
  }

  const nomeTrim = nome.trim();
  const emailTrim = email.trim().toLowerCase();
  const telefoneTrim = telefone.trim();
  const cpfDigits = onlyDigits(cpf);

  const id = requestId.toLowerCase();
  const normalizedCoupon = pilot?.coupon ?? (typeof coupon === "string" ? coupon.trim().toUpperCase() || undefined : undefined);
  const replyOrder = (order: NonNullable<ReturnType<typeof getOrderById>>) => NextResponse.json({
    id:order.id, amountCentavos:order.valor_centavos, status:order.status,
    pix:{qrBase64:order.pix_qr_base64,copyPaste:order.pix_copia_cola,expiresAt:order.pix_expiracao},
  }, {headers:{"Cache-Control":"private, no-store"}});
  const qrPending = () => NextResponse.json({
    error: "A cobrança foi registrada. O QR Code ainda não está disponível. Use “Recuperar este Pix” nesta mesma página, sem gerar outro pedido.",
    mayHaveCreatedOrder: true,
  }, {status: 503, headers: {"Cache-Control": "private, no-store"}});
  const completePix = async (order: NonNullable<ReturnType<typeof getOrderById>>) => {
    if (order.status !== "aguardando_pagamento") return replyOrder(order);
    if (order.pix_qr_base64 && order.pix_copia_cola) return replyOrder(order);
    if (!order.asaas_payment_id) return qrPending();
    try {
      const qr = await getPixQrCode(order.asaas_payment_id);
      if (!qr || typeof qr.expirationDate !== "string" || !qr.expirationDate || !parsePixReceipt({
        id: order.id, amountCentavos: order.valor_centavos,
        pix: {qrBase64: qr.encodedImage, copyPaste: qr.payload},
      })) return qrPending();
      const updated = storeOrderPixQr(order.id, order.asaas_payment_id, qr);
      return updated ? replyOrder(updated) : qrPending();
    } catch (error) {
      console.error("QR Pix indisponível após registrar o pedido.", error instanceof AsaasError ? error.status : "internal");
      return qrPending();
    }
  };
  let claim: ReturnType<typeof claimPixRequest>;
  try { claim=claimPixRequest(id,[pilot ? "owner-pilot" : "public", produto as string,nomeTrim,emailTrim,telefoneTrim,estado.trim().toUpperCase(),cpfDigits,normalizedCoupon??""]); }
  catch { return NextResponse.json({error:"Não foi possível preparar o Pix."},{status:503}); }
  if (claim !== "new") {
    const previous = claim === "existing" ? getOrderById(id) : undefined;
    if (previous && (!pilot || previous.valor_centavos === PILOT_CENTAVOS)) return completePix(previous);
    return NextResponse.json({
      error: claim==="different" ? "Este navegador já tem um pedido com outros dados. Confira o cadastro anterior." :
        "Ainda não deu para recuperar este Pix. Não gere outro pedido; confira novamente em instantes.",
      mayHaveCreatedOrder:true,
    },{status:409,headers:{"Cache-Control":"private, no-store"}});
  }

  let paymentAttempted = false;
  let reservation;
  try {
    reservation = pilot
      ? reserveOwnerPilotCoupon(pilot.coupon,pilot.expiresAt,product.precoCentavos,id)
      : reserveCoupon(normalizedCoupon, product.precoCentavos, id);
    if (pilot && (reservation.couponCode !== pilot.coupon || reservation.amountCentavos !== PILOT_CENTAVOS ||
        pilot.expiresMs <= Date.now())) throw new CouponError();
    const customer = await findOrCreateCustomer({
      name: nomeTrim,
      email: emailTrim,
      cpfCnpj: cpfDigits,
      phone: telefoneTrim,
    });

    if (pilot && pilot.expiresMs <= Date.now()) throw new CouponError();
    paymentAttempted = true;
    const payment = await createPixCharge({
      customerId: customer.id,
      valueCentavos: reservation.amountCentavos,
      description: `E-book ${product.titulo}`,
      externalReference: id,
    });

    const order = createOrder({
      id,
      produto: product.slug,
      nome: nomeTrim,
      email: emailTrim,
      telefone: telefoneTrim,
      estado: estado.trim().toUpperCase(),
      cpf: cpfDigits,
      valorCentavos: reservation.amountCentavos,
      asaasCustomerId: customer.id,
      asaasPaymentId: payment.id,
      pixQrBase64: null,
      pixCopiaCola: null,
      pixExpiracao: null,
    });

    return completePix(order);
  } catch (err) {
    if (!paymentAttempted) {
      try {
        if (reservation) releaseCouponReservation(id);
        releaseUnusedPixRequest(id);
      } catch { console.error("Falha interna ao liberar reserva de checkout."); }
    }
    if (err instanceof CouponError) {
      return NextResponse.json({error:"Cupom inválido ou indisponível."},{status:400});
    }
    return NextResponse.json({
      error:paymentAttempted
        ? "Não deu para confirmar se o Pix foi criado. Para evitar gerar outro pedido, não envie novamente agora."
        : "Não foi possível preparar o Pix. Confira seus dados e tente novamente.",
      mayHaveCreatedOrder:paymentAttempted,
    },{status:err instanceof AsaasError ? 502 : 500,headers:{"Cache-Control":"private, no-store"}});
  }
}
