import { randomBytes } from "node:crypto";
import { db, Order } from "./db";

export { EBOOK_PRICE_CENTAVOS, formatMoney, STATUS_LABEL } from "./money";

function newAccessToken() {
  return randomBytes(24).toString("hex");
}

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

export function getOrderByToken(token: string): Order | undefined {
  if (!token) return undefined;
  return db
    .prepare("SELECT * FROM orders WHERE access_token = ?")
    .get(token) as Order | undefined;
}

export function getOrderByAsaasPaymentId(paymentId: string): Order | undefined {
  return db
    .prepare("SELECT * FROM orders WHERE asaas_payment_id = ?")
    .get(paymentId) as Order | undefined;
}

export function listOrders(): Order[] {
  return db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];
}

/** Marks an order as paid and issues an access token. Idempotent: a
 * duplicate webhook delivery or an order that isn't awaiting payment
 * anymore is a no-op, so a buyer's link never gets silently replaced. */
export function markOrderPaid(id: string): Order | undefined {
  const order = getOrderById(id);
  if (!order || order.status !== "aguardando_pagamento") return order;
  const token = newAccessToken();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', access_token = @token, pago_at = @now WHERE id = @id`
  ).run({ id, token, now });
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

export function blockOrder(id: string, nota?: string) {
  db.prepare(
    `UPDATE orders SET status = 'bloqueado', admin_nota = @nota WHERE id = @id`
  ).run({ id, nota: nota ?? null });
  return getOrderById(id);
}

/** Admin override: grants (or re-grants) individual access regardless of the
 * current status — used both to unblock an account and to manually confirm a
 * payment the webhook missed. Always issues a fresh token. */
export function grantAccess(id: string) {
  const order = getOrderById(id);
  if (!order) return undefined;
  const token = newAccessToken();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', access_token = @token, pago_at = @now WHERE id = @id`
  ).run({ id, token, now });
  return getOrderById(id);
}
