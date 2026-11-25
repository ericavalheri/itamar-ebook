import { NextRequest, NextResponse } from "next/server";
import { requireOwnerMutation } from "@/lib/admin-accounts";
import { getOrderById, markOrderCancelled } from "@/lib/orders";

export const runtime = "nodejs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denial = await requireOwnerMutation(req);
  if (denial) return denial;
  const { id } = await params;
  const existing = getOrderById(id);
  if (!existing) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  markOrderCancelled(id);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "private, no-store" } });
}
