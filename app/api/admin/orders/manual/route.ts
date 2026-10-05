import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { createManualOrder } from "@/lib/orders";
import { getProductBySlug } from "@/lib/products";

export const runtime = "nodejs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { produto, nome, email, telefone, estado, cpf } = (body ?? {}) as Record<string, unknown>;

  const product = typeof produto === "string" ? getProductBySlug(produto) : undefined;
  if (!product) {
    return NextResponse.json({ error: "E-book não encontrado." }, { status: 404 });
  }
  if (typeof nome !== "string" || nome.trim().length < 3) {
    return NextResponse.json({ error: "Informe o nome do comprador." }, { status: 400 });
  }
  if (typeof email !== "string" || !isValidEmail(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const order = createManualOrder({
    id: randomUUID(),
    produto: product.slug,
    nome: nome.trim(),
    email: email.trim().toLowerCase(),
    telefone: typeof telefone === "string" ? telefone.trim() : "",
    estado: typeof estado === "string" ? estado.trim().toUpperCase().slice(0, 2) : "",
    cpf: typeof cpf === "string" ? cpf.trim() : "",
    valorCentavos: product.precoCentavos,
  });

  return NextResponse.json({ order });
}
