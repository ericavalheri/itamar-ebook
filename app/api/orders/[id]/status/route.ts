import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404,headers:{"Cache-Control":"private, no-store"} });
  }
  return NextResponse.json({ status: order.status },{headers:{"Cache-Control":"private, no-store"}});
}
