import type { OrderStatus } from "./db";

export function formatMoney(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_pagamento: "Aguardando pagamento",
  aprovado: "Aprovado",
  expirado: "Pix expirado",
  cancelado: "Cancelado",
  bloqueado: "Bloqueado",
};
