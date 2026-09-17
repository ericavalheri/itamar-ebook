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
      active_session_id TEXT,
      active_session_created_at TEXT,
      admin_nota TEXT,
      created_at TEXT NOT NULL,
      pago_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
    CREATE INDEX IF NOT EXISTS idx_orders_asaas_payment_id ON orders(asaas_payment_id);
    CREATE INDEX IF NOT EXISTS idx_orders_active_session_id ON orders(active_session_id);

    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
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
  active_session_id: string | null;
  active_session_created_at: string | null;
  admin_nota: string | null;
  created_at: string;
  pago_at: string | null;
}

export interface OtpCode {
  id: string;
  order_id: string;
  email: string;
  code_hash: string;
  attempts: number;
  expires_at: string;
  consumed_at: string | null;
  created_at: string;
}
