import { randomUUID } from "node:crypto";
import { db, Order } from "./db";

export { EBOOK_PRICE_CENTAVOS, formatMoney, STATUS_LABEL } from "./money";

export interface NewOrderInput {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  cpf: string;
  valorCentavos: number;
  asaasCustomerId: string;
  asaasPaymentId: string;
  pixQrBase64: string;
  pixCopiaCola: string;
  pixExpiracao: string;
}

export function createOrder(input: NewOrderInput): Order {
  const id = input.id;
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO orders (
       id, nome, email, telefone, estado, cpf, valor_centavos, status,
       asaas_customer_id, asaas_payment_id, pix_qr_base64, pix_copia_cola, pix_expiracao,
       created_at
     ) VALUES (
       @id, @nome, @email, @telefone, @estado, @cpf, @valorCentavos, 'aguardando_pagamento',
       @asaasCustomerId, @asaasPaymentId, @pixQrBase64, @pixCopiaCola, @pixExpiracao,
       @createdAt
     )`
  ).run({
    id,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    estado: input.estado,
    cpf: input.cpf,
    valorCentavos: input.valorCentavos,
    asaasCustomerId: input.asaasCustomerId,
    asaasPaymentId: input.asaasPaymentId,
    pixQrBase64: input.pixQrBase64,
    pixCopiaCola: input.pixCopiaCola,
    pixExpiracao: input.pixExpiracao,
    createdAt: now,
  });
  return getOrderById(id)!;
}

export function getOrderById(id: string): Order | undefined {
  return db.prepare("SELECT * FROM orders WHERE id = ?").get(id) as
    | Order
    | undefined;
}

export function getOrderByAsaasPaymentId(paymentId: string): Order | undefined {
  return db
    .prepare("SELECT * FROM orders WHERE asaas_payment_id = ?")
    .get(paymentId) as Order | undefined;
}

/** Most recent approved order for an email — used to decide whether an
 * access-code request is legitimate, and which order a verified login maps to. */
export function getLatestApprovedOrderByEmail(email: string): Order | undefined {
  return db
    .prepare(
      "SELECT * FROM orders WHERE email = ? AND status = 'aprovado' ORDER BY created_at DESC LIMIT 1"
    )
    .get(email) as Order | undefined;
}

export function getOrderByActiveSession(sessionId: string): Order | undefined {
  if (!sessionId) return undefined;
  return db
    .prepare(
      "SELECT * FROM orders WHERE active_session_id = ? AND status = 'aprovado'"
    )
    .get(sessionId) as Order | undefined;
}

export function listOrders(): Order[] {
  return db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];
}

/** Marks an order as paid. Idempotent: a duplicate webhook delivery or an
 * order that isn't awaiting payment anymore is a no-op. */
export function markOrderPaid(id: string): Order | undefined {
  const order = getOrderById(id);
  if (!order || order.status !== "aguardando_pagamento") return order;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', pago_at = @now WHERE id = @id`
  ).run({ id, now });
  return getOrderById(id);
}

export function markOrderExpired(id: string): Order | undefined {
  const order = getOrderById(id);
  if (!order || order.status !== "aguardando_pagamento") return order;
  db.prepare(`UPDATE orders SET status = 'expirado' WHERE id = @id`).run({ id });
  return getOrderById(id);
}

export function markOrderCancelled(id: string): Order | undefined {
  const order = getOrderById(id);
  if (!order || order.status !== "aguardando_pagamento") return order;
  db.prepare(`UPDATE orders SET status = 'cancelado' WHERE id = @id`).run({ id });
  return getOrderById(id);
}

/** Blocking also kills any device currently reading — the next status poll
 * on the reader page finds the session gone and forces a re-login. */
export function blockOrder(id: string, nota?: string) {
  db.prepare(
    `UPDATE orders SET status = 'bloqueado', admin_nota = @nota,
       active_session_id = NULL, active_session_created_at = NULL
     WHERE id = @id`
  ).run({ id, nota: nota ?? null });
  return getOrderById(id);
}

/** Admin override: grants (or re-grants) individual access regardless of the
 * current status — used both to unblock an account and to manually confirm a
 * payment the webhook missed. The buyer still logs in via /acessar with
 * their email afterwards; this doesn't create a session by itself. */
export function grantAccess(id: string) {
  const order = getOrderById(id);
  if (!order) return undefined;
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', pago_at = @now WHERE id = @id`
  ).run({ id, now });
  return getOrderById(id);
}

// --- Access codes (email OTP) and single active session ---

export function countRecentOtpRequests(email: string, sinceMinutesAgo: number): number {
  const since = new Date(Date.now() - sinceMinutesAgo * 60_000).toISOString();
  const row = db
    .prepare(
      "SELECT COUNT(*) as count FROM otp_codes WHERE email = ? AND created_at > ?"
    )
    .get(email, since) as { count: number };
  return row.count;
}

export function getLatestOtpRequest(email: string) {
  return db
    .prepare(
      "SELECT * FROM otp_codes WHERE email = ? ORDER BY created_at DESC LIMIT 1"
    )
    .get(email) as import("./db").OtpCode | undefined;
}

export function createOtpRequest(orderId: string, email: string, codeHash: string, ttlMinutes: number) {
  const id = randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60_000);
  db.prepare(
    `INSERT INTO otp_codes (id, order_id, email, code_hash, attempts, expires_at, created_at)
     VALUES (@id, @orderId, @email, @codeHash, 0, @expiresAt, @createdAt)`
  ).run({
    id,
    orderId,
    email,
    codeHash,
    expiresAt: expiresAt.toISOString(),
    createdAt: now.toISOString(),
  });
  return id;
}

export type OtpVerifyResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "wrong_code" };

/** Verifies the most recent unconsumed code for the email, and on success
 * issues a new session for its order — overwriting any previously active
 * session, so a second successful login elsewhere kicks the first one out. */
export function verifyOtpAndCreateSession(email: string, codeHash: string): OtpVerifyResult {
  const otp = db
    .prepare(
      "SELECT * FROM otp_codes WHERE email = ? AND consumed_at IS NULL ORDER BY created_at DESC LIMIT 1"
    )
    .get(email) as import("./db").OtpCode | undefined;

  if (!otp) return { ok: false, reason: "no_code" };
  if (new Date(otp.expires_at).getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (otp.attempts >= 5) {
    db.prepare("UPDATE otp_codes SET consumed_at = @now WHERE id = @id").run({
      id: otp.id,
      now: new Date().toISOString(),
    });
    return { ok: false, reason: "too_many_attempts" };
  }

  if (otp.code_hash !== codeHash) {
    db.prepare("UPDATE otp_codes SET attempts = attempts + 1 WHERE id = @id").run({
      id: otp.id,
    });
    return { ok: false, reason: "wrong_code" };
  }

  const now = new Date().toISOString();
  const sessionId = randomUUID();
  db.prepare("UPDATE otp_codes SET consumed_at = @now WHERE id = @id").run({
    id: otp.id,
    now,
  });
  db.prepare(
    `UPDATE orders SET active_session_id = @sessionId, active_session_created_at = @now WHERE id = @orderId`
  ).run({ sessionId, now, orderId: otp.order_id });

  return { ok: true, order: getOrderById(otp.order_id)! };
}

export function clearActiveSession(orderId: string) {
  db.prepare(
    `UPDATE orders SET active_session_id = NULL, active_session_created_at = NULL WHERE id = @orderId`
  ).run({ orderId });
}
