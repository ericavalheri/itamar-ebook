import { NextRequest, NextResponse } from "next/server";
import { createOrder } from "@/lib/orders";

export const runtime = "nodejs";

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

  const { nome, email, telefone, estado } = (body ?? {}) as Record<string, unknown>;

  if (
    typeof nome !== "string" || nome.trim().length < 3 ||
    typeof email !== "string" || !isValidEmail(email) ||
    typeof telefone !== "string" || telefone.trim().length < 8 ||
    typeof estado !== "string" || estado.trim().length !== 2
  ) {
    return NextResponse.json(
      { error: "Preencha nome, e-mail, telefone e estado válidos." },
      { status: 400 }
    );
  }

  const order = createOrder({
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: telefone.trim(),
    estado: estado.trim().toUpperCase(),
  });

  return NextResponse.json({ id: order.id });
}
