import { NextRequest, NextResponse } from "next/server";
import { attachComprovante, getOrderById } from "@/lib/orders";

export const runtime = "nodejs";

const MAX_BASE64_LENGTH = 4 * 1024 * 1024; // ~3MB binary

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.status !== "aguardando_pagamento" && order.status !== "aguardando_aprovacao") {
    return NextResponse.json(
      { error: "Este pedido não aceita novo comprovante no momento." },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const { texto, arquivoNome, arquivoTipo, arquivoBase64 } = (body ?? {}) as Record<string, unknown>;

  const textoStr = typeof texto === "string" ? texto.trim().slice(0, 2000) : "";
  const hasFile = typeof arquivoBase64 === "string" && arquivoBase64.length > 0;

  if (!textoStr && !hasFile) {
    return NextResponse.json(
      { error: "Descreva o pagamento ou anexe o comprovante." },
      { status: 400 }
    );
  }

  if (hasFile && (arquivoBase64 as string).length > MAX_BASE64_LENGTH) {
    return NextResponse.json({ error: "Arquivo muito grande." }, { status: 400 });
  }

  attachComprovante(id, {
    texto: textoStr || undefined,
    arquivoNome: typeof arquivoNome === "string" ? arquivoNome.slice(0, 200) : undefined,
    arquivoTipo: typeof arquivoTipo === "string" ? arquivoTipo.slice(0, 100) : undefined,
    arquivoBase64: hasFile ? (arquivoBase64 as string) : undefined,
  });

  return NextResponse.json({ ok: true });
}
