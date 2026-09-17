import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderByActiveSession, clearActiveSession } from "@/lib/orders";
import { READER_COOKIE_NAME } from "@/lib/reader-session";

export const runtime = "nodejs";

export async function POST() {
  const store = await cookies();
  const sessionId = store.get(READER_COOKIE_NAME)?.value;
  if (sessionId) {
    const order = getOrderByActiveSession(sessionId);
    if (order) clearActiveSession(order.id);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(READER_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return res;
}
