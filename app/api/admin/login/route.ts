import { NextRequest, NextResponse } from "next/server";
import { checkAdminPassword, createSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }
  const { password } = (body ?? {}) as Record<string, unknown>;
  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
  }

  let valid: boolean;
  try {
    valid = checkAdminPassword(password);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Configuração ausente." },
      { status: 500 }
    );
  }

  if (!valid) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return res;
}
