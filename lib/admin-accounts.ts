import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COOKIE, makeAdminAuth } from "./admin-auth-core.mjs";

let core: ReturnType<typeof makeAdminAuth> | undefined;

export function configuredAdminOrigin(): string | null {
  const raw = process.env.ADMIN_ORIGIN;
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" && url.origin === raw ? raw : null;
  } catch {
    return null;
  }
}

export function getAccountsIfEnabled() {
  if (process.env.ADMIN_AUTH_MODE !== "accounts" || !configuredAdminOrigin() || !process.env.DATA_DIR?.trim()) return null;
  core ??= makeAdminAuth(db);
  return core.ownerReady() ? core : null;
}

export async function adminIdentity() {
  const accounts = getAccountsIfEnabled();
  if (!accounts) return null;
  return accounts.identify((await cookies()).get(COOKIE)?.value);
}

export function rejectUntrustedAdminOrigin(req: Request) {
  const origin = configuredAdminOrigin();
  return origin && req.headers.get("origin") === origin ? null : blocked(403, "Operação não permitida.");
}

function blocked(status: number, error: string) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "private, no-store" } });
}

export async function requireOwnerMutation(req: Request) {
  const rejected = rejectUntrustedAdminOrigin(req);
  if (rejected) return rejected;
  const identity = await adminIdentity();
  if (!identity) return blocked(401, "Não autenticado.");
  return identity.role === "owner" ? null : blocked(403, "Operação não permitida.");
}

export async function listAdminOrders() {
  const admin = await adminIdentity();
  if (!admin) return [];
  const owner = admin.role === "owner";
  return db.prepare(`SELECT id,${owner ? "nome,email,telefone,active_session_id IS NOT NULL" : "'' AS nome,'' AS email,'' AS telefone,0"} AS has_active_session,
                    created_at,produto,estado,valor_centavos,status,pago_at
                    FROM orders ORDER BY created_at DESC`).all().map((value) => {
    const row = value as Omit<AdminOrder, "has_active_session"> & { has_active_session: number };
    return {...row, has_active_session:Boolean(row.has_active_session)};
  });
}
type AdminOrder = Pick<import("./db").Order, "id" | "nome" | "email" | "telefone" | "created_at" | "produto" | "estado" | "valor_centavos" | "status" | "pago_at"> & {has_active_session:boolean};

export async function listAdminTeam() {
  const admin = await adminIdentity();
  if (admin?.role !== "owner") return [];
  return getAccountsIfEnabled()?.team() ?? [];
}

export async function readAdminJson(req: Request): Promise<Record<string,unknown> | null> {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers.get("content-type") || "") || !req.body) return null;
  const reader = req.body.getReader(); let n = 0; const parts: Uint8Array[] = [];
  try {
    for (;;) {
      const p = await reader.read(); if (p.done) break;
      n += p.value.length;
      if (n > 4096) { await reader.cancel(); return null; }
      parts.push(p.value);
    }
    const object: unknown = JSON.parse(Buffer.concat(parts).toString("utf8"));
    return object && typeof object === "object" && !Array.isArray(object) ? object as Record<string,unknown> : null;
  } catch { return null; } finally { reader.releaseLock(); }
}

export function adminJson(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
}
