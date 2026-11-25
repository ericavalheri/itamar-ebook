import { createHmac } from "node:crypto";
import { db } from "./db";

export const pixRequestPattern = /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;

export function claimPixRequest(id:string, fields:string[]):"new"|"existing"|"different" {
  const secret=process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw Error("Checkout indisponível.");
  const fingerprint=createHmac("sha256",secret).update("itamar-pix-idempotency:v1:").update(JSON.stringify(fields)).digest("hex");
  db.exec("CREATE TABLE IF NOT EXISTS checkout_pix_requests (id TEXT PRIMARY KEY, fingerprint TEXT NOT NULL)");
  const claimed=db.prepare("INSERT INTO checkout_pix_requests VALUES(?,?) ON CONFLICT(id) DO NOTHING").run(id,fingerprint);
  if (claimed.changes===1) return "new";
  const row=db.prepare("SELECT fingerprint FROM checkout_pix_requests WHERE id=?").get(id) as {fingerprint:string}|undefined;
  return row?.fingerprint===fingerprint ? "existing" : "different";
}

export function releaseUnusedPixRequest(id:string) {
  db.prepare("DELETE FROM checkout_pix_requests WHERE id=? AND NOT EXISTS(SELECT 1 FROM orders WHERE id=?)").run(id,id);
}
