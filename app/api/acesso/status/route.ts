import { resolveReaderTitle } from "@/lib/reader-library";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getOrderByActiveSession } from "@/lib/orders";
import { READER_COOKIE_NAME } from "@/lib/reader-session";

export const runtime = "nodejs";

export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const store = await cookies();
  const sessionId = store.get(READER_COOKIE_NAME)?.value;
  const slug = new URL(req.url).searchParams.get("livro");
  const valid = slug === null ? Boolean(sessionId && getOrderByActiveSession(sessionId)) : resolveReaderTitle(sessionId, slug).kind === "ok";
  return NextResponse.json({ valid }, { headers: { "Cache-Control": "private, no-store" } });
}
