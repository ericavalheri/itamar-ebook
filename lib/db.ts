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
      valor_centavos INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
      comprovante_texto TEXT,
      comprovante_arquivo_nome TEXT,
      comprovante_arquivo_tipo TEXT,
      comprovante_arquivo_base64 TEXT,
      access_token TEXT UNIQUE,
      admin_nota TEXT,
      created_at TEXT NOT NULL,
      comprovante_enviado_at TEXT,
      decidido_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_access_token ON orders(access_token);
  `);
  return db;
}

export const db = globalThis.__itamarDb ?? createConnection();

if (process.env.NODE_ENV !== "production") {
  globalThis.__itamarDb = db;
}

export type OrderStatus =
  | "aguardando_pagamento"
  | "aguardando_aprovacao"
  | "aprovado"
  | "rejeitado"
  | "bloqueado";

export interface Order {
  id: string;
  produto: string;
  nome: string;
  email: string;
  telefone: string;
  estado: string;
  valor_centavos: number;
  status: OrderStatus;
  comprovante_texto: string | null;
  comprovante_arquivo_nome: string | null;
  comprovante_arquivo_tipo: string | null;
  comprovante_arquivo_base64: string | null;
  access_token: string | null;
  admin_nota: string | null;
  created_at: string;
  comprovante_enviado_at: string | null;
  decidido_at: string | null;
}
