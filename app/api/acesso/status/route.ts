import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderByActiveSession } from "@/lib/orders";
import { READER_COOKIE_NAME } from "@/lib/reader-session";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const sessionId = store.get(READER_COOKIE_NAME)?.value;
  const order = sessionId ? getOrderByActiveSession(sessionId) : undefined;
  return NextResponse.json({ valid: Boolean(order) });
}
