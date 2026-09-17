import { NextRequest, NextResponse } from "next/server";
import {
  getLatestApprovedOrderByEmail,
  countRecentOtpRequests,
  getLatestOtpRequest,
  createOtpRequest,
} from "@/lib/orders";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_TTL_MINUTES,
  OTP_MAX_PER_WINDOW,
  OTP_WINDOW_MINUTES,
  OTP_MIN_RESEND_SECONDS,
} from "@/lib/otp";
import { sendAccessCodeEmail } from "@/lib/email";

export const runtime = "nodejs";

const GENERIC_MESSAGE =
  "Se esse e-mail tiver uma compra aprovada, enviamos um código de acesso. Ele vale por 10 minutos.";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { email } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }
  const emailTrim = email.trim().toLowerCase();

  // Always answer the same way regardless of what's found, so the endpoint
  // can't be used to probe which emails have an approved order.
  const respondGeneric = () => NextResponse.json({ ok: true, message: GENERIC_MESSAGE });

  const order = getLatestApprovedOrderByEmail(emailTrim);
  if (!order) return respondGeneric();

  if (countRecentOtpRequests(emailTrim, OTP_WINDOW_MINUTES) >= OTP_MAX_PER_WINDOW) {
    return respondGeneric();
  }

  const latest = getLatestOtpRequest(emailTrim);
  if (latest) {
    const secondsSince = (Date.now() - new Date(latest.created_at).getTime()) / 1000;
    if (secondsSince < OTP_MIN_RESEND_SECONDS) return respondGeneric();
  }

  const code = generateOtpCode();
  createOtpRequest(order.id, emailTrim, hashOtpCode(code), OTP_TTL_MINUTES);

  try {
    await sendAccessCodeEmail(emailTrim, code);
  } catch {
    // Don't leak provider errors to the client — the generic message stays
    // the same either way. The code still exists if the admin needs to help.
  }

  return respondGeneric();
}
