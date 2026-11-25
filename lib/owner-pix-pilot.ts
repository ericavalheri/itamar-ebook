import { adminIdentity } from "./admin-accounts";
import { getReaderProduct } from "./reader-registry";
import { readPrivateManuscript } from "./reader-content";

export const PILOT_VOLUME = "adicional-periculosidade";
export const PILOT_CENTAVOS = 532;
const maxWindowMs = 30 * 60_000;

export async function ownerPixPilot() {
  const {PIX_OWNER_PILOT_ENABLED,PIX_OWNER_PILOT_COUPON,PIX_OWNER_PILOT_EXPIRES_AT,ADMIN_OWNER_EMAIL,ASAAS_ENV,ASAAS_API_BASE_URL,SALES_ENABLED,PIX_CHECKOUT_ENABLED,DATA_DIR}=process.env;
  if (PIX_OWNER_PILOT_ENABLED !== "true" || SALES_ENABLED !== "false" || PIX_CHECKOUT_ENABLED !== "false" ||
      ASAAS_ENV !== "production" || ASAAS_API_BASE_URL || !DATA_DIR?.startsWith("/") ||
      !ADMIN_OWNER_EMAIL?.trim() || !PIX_OWNER_PILOT_COUPON || !/^PILOT86_[A-Z0-9]{8,20}$/.test(PIX_OWNER_PILOT_COUPON) ||
      !PIX_OWNER_PILOT_EXPIRES_AT || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/.test(PIX_OWNER_PILOT_EXPIRES_AT) ||
      !["ADMIN_SESSION_SECRET","ASAAS_API_KEY","ASAAS_WEBHOOK_TOKEN","SMTP_HOST","SMTP_USER","SMTP_PASSWORD"].every(k=>Boolean(process.env[k]?.trim()))) return null;
  const expiry = Date.parse(PIX_OWNER_PILOT_EXPIRES_AT),now = Date.now();
  if (!Number.isFinite(expiry) || expiry <= now || expiry > now+maxWindowMs) return null;
  const admin = await adminIdentity();
  if (admin?.role !== "owner" || admin.email.toLowerCase() !== ADMIN_OWNER_EMAIL.trim().toLowerCase()) return null;
  const product = getReaderProduct(PILOT_VOLUME);
  if (!product || product.precoCentavos !== 3800 || !(await readPrivateManuscript(product.contentFile)) || expiry<=Date.now()) return null;
  return {product,coupon:PIX_OWNER_PILOT_COUPON,expiresAt:new Date(expiry).toISOString(),expiresMs:expiry};
}
