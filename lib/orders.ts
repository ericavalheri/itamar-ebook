import { randomBytes, randomUUID } from "node:crypto";
import { db, Order } from "./db";
import { EBOOK_PRICE_CENTAVOS } from "./money";

export { EBOOK_PRICE_CENTAVOS, PIX_KEY, PIX_OWNER_NAME, formatMoney, STATUS_LABEL } from "./money";

export interface NewOrderInput {
  nome: string;
  email: string;
  telefone: string;
  estado: string;
}

function newAccessToken() {
  return randomBytes(24).toString("hex");
}

export function createOrder(input: NewOrderInput): Order {
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO orders (id, nome, email, telefone, estado, valor_centavos, status, created_at)
     VALUES (@id, @nome, @email, @telefone, @estado, @valor_centavos, 'aguardando_pagamento', @created_at)`
  ).run({
    id,
    nome: input.nome,
    email: input.email,
    telefone: input.telefone,
    estado: input.estado,
    valor_centavos: EBOOK_PRICE_CENTAVOS,
    created_at: now,
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

export function listOrders(): Order[] {
  return db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Order[];
}

export function attachComprovante(
  id: string,
  data: {
    texto?: string;
    arquivoNome?: string;
    arquivoTipo?: string;
    arquivoBase64?: string;
  }
) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET
       comprovante_texto = @texto,
       comprovante_arquivo_nome = @arquivoNome,
       comprovante_arquivo_tipo = @arquivoTipo,
       comprovante_arquivo_base64 = @arquivoBase64,
       status = 'aguardando_aprovacao',
       comprovante_enviado_at = @now
     WHERE id = @id`
  ).run({
    id,
    texto: data.texto ?? null,
    arquivoNome: data.arquivoNome ?? null,
    arquivoTipo: data.arquivoTipo ?? null,
    arquivoBase64: data.arquivoBase64 ?? null,
    now,
  });
  return getOrderById(id);
}

export function approveOrder(id: string) {
  const token = newAccessToken();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', access_token = @token, decidido_at = @now WHERE id = @id`
  ).run({ id, token, now });
  return getOrderById(id);
}

export function rejectOrder(id: string, nota?: string) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'rejeitado', admin_nota = @nota, decidido_at = @now WHERE id = @id`
  ).run({ id, nota: nota ?? null, now });
  return getOrderById(id);
}

export function blockOrder(id: string, nota?: string) {
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'bloqueado', admin_nota = @nota, decidido_at = @now WHERE id = @id`
  ).run({ id, nota: nota ?? null, now });
  return getOrderById(id);
}

export function reactivateOrder(id: string) {
  const token = newAccessToken();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE orders SET status = 'aprovado', access_token = @token, decidido_at = @now WHERE id = @id`
  ).run({ id, token, now });
  return getOrderById(id);
}
