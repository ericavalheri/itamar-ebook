import { createOtpRequest } from "./orders";
import { generateOtpCode, hashOtpCode, OTP_TTL_MINUTES } from "./otp";
import { sendPurchaseConfirmedEmail } from "./email";
import { getCatalogProductBySlug } from "./products";
import type { Order } from "./db";

/** Sends the buyer a first access code as soon as their order is approved,
 * instead of leaving it up to them to know to visit /acessar on their own.
 * Never throws: a delivery failure here shouldn't fail the webhook or the
 * admin action that called it — the buyer can still request a new code at
 * /acessar, same as any other login. */
export async function notifyOrderApproved(order: Order) {
  const product = getCatalogProductBySlug(order.produto);
  const code = generateOtpCode();
  const email = order.email.trim().toLowerCase();
  createOtpRequest(order.id, email, hashOtpCode(code), OTP_TTL_MINUTES);
  try {
    await sendPurchaseConfirmedEmail(email, product?.titulo ?? order.produto, code);
  } catch {
    console.error("Falha ao enviar e-mail de confirmação de compra.");
  }
}
