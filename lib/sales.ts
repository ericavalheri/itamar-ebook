// Fail closed: publication of the catalogue never enables payments implicitly.
export function salesEnabled(): boolean {
  return process.env.SALES_ENABLED === "true" &&
    ["ADMIN_PASSWORD", "ADMIN_SESSION_SECRET", "ASAAS_API_KEY", "ASAAS_WEBHOOK_TOKEN",
     "SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD", "DATA_DIR"].every((key) => Boolean(process.env[key]?.trim())) &&
    ["sandbox", "production"].includes(process.env.ASAAS_ENV ?? "");
}

export const PREVIEW_MESSAGE =
  "Prévia em desenvolvimento. As compras ainda não estão disponíveis. Não estamos recebendo cadastros nem pagamentos nesta página.";

export function readerLoginConfigured(): boolean {
  return Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() &&
    process.env.SMTP_PASSWORD?.trim() && process.env.DATA_DIR?.trim());
}

export function adminLoginConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD?.trim() && process.env.ADMIN_SESSION_SECRET?.trim());
}
