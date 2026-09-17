import { NextRequest, NextResponse } from "next/server";
import { verifyOtpAndCreateSession } from "@/lib/orders";
import { hashOtpCode } from "@/lib/otp";
import { READER_COOKIE_NAME, READER_COOKIE_MAX_AGE } from "@/lib/reader-session";

export const runtime = "nodejs";

const ERROR_MESSAGES: Record<string, string> = {
  no_code: "Nenhum código pendente para esse e-mail. Peça um novo código.",
  expired: "Esse código expirou. Peça um novo código.",
  too_many_attempts: "Muitas tentativas erradas. Peça um novo código.",
  wrong_code: "Código incorreto. Confira e tente de novo.",
};

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { email, code } = (body ?? {}) as Record<string, unknown>;
  if (typeof email !== "string" || typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: "Informe o e-mail e o código de 6 dígitos." }, { status: 400 });
  }

  const result = verifyOtpAndCreateSession(email.trim().toLowerCase(), hashOtpCode(code));

  if (!result.ok) {
    return NextResponse.json(
      { error: ERROR_MESSAGES[result.reason] || "Não foi possível verificar o código." },
      { status: 400 }
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(READER_COOKIE_NAME, result.order.active_session_id!, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: READER_COOKIE_MAX_AGE,
  });
  return res;
}
