import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "itamar-ebook.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

declare global {
  // eslint-disable-next-line no-var
  var __itamarDb: Database.Database | undefined;
}

function createConnection() {
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      produto TEXT NOT NULL DEFAULT 'adicional-periculosidade',
      nome TEXT NOT NULL,
      email TEXT NOT NULL,
      telefone TEXT NOT NULL,
      estado TEXT NOT NULL,
      cpf TEXT NOT NULL,
      valor_centavos INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
      asaas_customer_id TEXT,
      asaas_payment_id TEXT,
      pix_qr_base64 TEXT,
      pix_copia_cola TEXT,
      pix_expiracao TEXT,
      access_token TEXT UNIQUE,
      admin_nota TEXT,
      created_at TEXT NOT NULL,
      pago_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
    CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id ON orders(asaas_payment_id);
  `);
  return db;
}

export const db = globalThis.__itamarDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__itamarDb = db;
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "aprovado"
  | "expirado"
  | "cancelado"
  | "bloqueado";

export interface Order {
  id: string;
  produto: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  cpf: string;
  valor_centavos: number;
  status: OrderStatus;
  asaas_customer_id: string | null;
  asaas_payment_id: string | null;
  pix_qr_base64: string | null;
  pix_copia_cola: string | null;
  pix_expiracao: string | null;
  access_token: string | null;
  admin_nota: string | null;
  created_at: string;
  pago_at: string | null;
}
