import type { OrderStatus } from "./db";

export const EBOOK_PRICE_CENTAVOS = Number(
  process.env.EBOOK_PRICE_CENTAVOS || 2990
);
export const PIX_KEY =
  process.env.PIX_KEY || "000.000.000-00 (defina PIX_KEY no ambiente)";
export const PIX_OWNER_NAME =
  process.env.PIX_OWNER_NAME || "Itamar (defina PIX_OWNER_NAME no ambiente)";

export function formatMoney(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
  bloqueado: "Bloqueado",
};
