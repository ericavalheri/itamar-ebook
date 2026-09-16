import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { getOrderById, rejectOrder } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }
  const { id } = await params;
  const existing = getOrderById(id);
  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const nota = typeof body?.nota === "string" ? body.nota.slice(0, 500) : undefined;
  const order = rejectOrder(id, nota);
  return NextResponse.json({ order });
}
