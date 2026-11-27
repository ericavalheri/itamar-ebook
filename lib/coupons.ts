
import { db } from "./db";

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,31}$/;
const MIN_PAYABLE = 500;
export const PILOT_LIST_CENTAVOS = 3800;
export const PILOT_PERCENT = 67;
export const PILOT_CENTAVOS = PILOT_LIST_CENTAVOS - Math.floor((PILOT_LIST_CENTAVOS * PILOT_PERCENT + 50) / 100);
export const PILOT_CODE_PATTERN = /^PILOT67_[A-Z0-9]{8,20}$/;
const isReservedPilotCode = (code: string) => /^(?:PILOT86_|PILOT73_|PILOT67_)/.test(code);
const UNAVAILABLE = "Cupom inválido, vencido ou sem usos disponíveis.";
export class CouponError extends Error {
  constructor(message = UNAVAILABLE) { super(message); this.name = "CouponError"; }
}

function setup() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS checkout_coupons (
      code TEXT PRIMARY KEY,
      percent_off INTEGER NOT NULL CHECK (percent_off BETWEEN 1 AND 90),
      active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
      starts_at TEXT NOT NULL,
      ends_at TEXT NOT NULL CHECK (ends_at > starts_at),
      max_uses INTEGER NOT NULL CHECK (max_uses BETWEEN 1 AND 10000),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS checkout_coupon_reservations (
      order_id TEXT PRIMARY KEY,
      coupon_code TEXT NOT NULL,
      list_amount_centavos INTEGER NOT NULL,
      amount_centavos INTEGER NOT NULL CHECK (amount_centavos > 0 AND amount_centavos < list_amount_centavos),
      reserved_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS checkout_coupon_usage_idx
      ON checkout_coupon_reservations(coupon_code);
  `);
}
let ready = false;
function useDb() { if (!ready) { setup(); ready = true; } }

function normalize(raw: string) {
  const trimmed = raw.trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]{2,31}$/.test(trimmed)) throw new CouponError();
  const code = trimmed.toUpperCase();
  if (!CODE_PATTERN.test(code)) throw new CouponError();
  return code;
}
function zonedDate(day: string, end: boolean) {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(day+"T00:00:00Z") : null;
  if (!parsed || !Number.isFinite(+parsed) || parsed.toISOString().slice(0,10) !== day ||
     day < "2026-01-01" || day > "2099-12-31") throw new CouponError("Informe datas válidas.");
  return new Date(day+(end ? "T23:59:59.999-03:00" : "T00:00:00.000-03:00")).toISOString();
}
export type CouponAdminRow = {
  code: string; percent_off: number; active: number; starts_at: string; ends_at: string;
  max_uses: number; created_at: string; uses: number;
};
export function createCoupon(input: {code:string; percentOff:number; startsOn:string; endsOn:string; maxUses:number}) {
  const code = normalize(input.code);
  if (isReservedPilotCode(code)) throw new CouponError("Use um código de cupom comercial.");
  if (!Number.isInteger(input.percentOff) || input.percentOff < 1 || input.percentOff > 90 ||
      !Number.isInteger(input.maxUses) || input.maxUses < 1 || input.maxUses > 10000) {
    throw new CouponError("Use um desconto de 1% a 90% e um limite de 1 a 10.000 usos.");
  }
  const now = new Date().toISOString();
  const start = zonedDate(input.startsOn,false), end = zonedDate(input.endsOn,true);
  if (end <= start || end <= now) throw new CouponError("A validade precisa terminar a partir de hoje e não pode terminar antes do início.");
  useDb();
  const result = db.prepare(`INSERT INTO checkout_coupons (code,percent_off,starts_at,ends_at,max_uses,created_at)
    VALUES (?,?,?,?,?,?) ON CONFLICT(code) DO NOTHING`).run(code,input.percentOff,start,end,input.maxUses,now);
  if (!result.changes) throw new CouponError("Esse código já existe. Escolha um código diferente.");
  return code;
}
export function listCoupons(): CouponAdminRow[] {
  useDb();
  return db.prepare(`SELECT c.*, (SELECT count(*) FROM checkout_coupon_reservations r WHERE r.coupon_code=c.code) AS uses
    FROM checkout_coupons c ORDER BY created_at DESC LIMIT 200`).all() as CouponAdminRow[];
}
export function disableCoupon(raw: string) {
  const code = normalize(raw);
  useDb();
  return db.prepare("UPDATE checkout_coupons SET active=0 WHERE code=? AND active=1").run(code).changes === 1;
}

export function reserveCoupon(raw: string | undefined, listAmountCentavos: number, orderId: string): {
  amountCentavos: number; couponCode: string | null;
} {
  if (raw === undefined || raw.trim() === "") return {amountCentavos:listAmountCentavos,couponCode:null};
  const code = normalize(raw);
  if (isReservedPilotCode(code)) throw new CouponError();
  if (!Number.isSafeInteger(listAmountCentavos) || listAmountCentavos < 1 || listAmountCentavos > 100000000 ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId)) throw new CouponError();
  useDb();
  const now = new Date().toISOString();
  // One SQL write atomically checks eligibility/cap and locks the quoted amount to this order ID.
  // Percent-discount rounded to nearest cent using integer inputs; no client total is accepted.
  const row = db.prepare(`INSERT INTO checkout_coupon_reservations (order_id,coupon_code,list_amount_centavos,amount_centavos,reserved_at)
    SELECT @id,c.code,@price,@price - CAST((@price*c.percent_off+50)/100 AS INTEGER),@now
    FROM checkout_coupons c WHERE c.code=@code AND c.active=1 AND c.starts_at<=@now AND c.ends_at>=@now
      AND @price - CAST((@price*c.percent_off+50)/100 AS INTEGER) >= @floor
      AND CAST((@price*c.percent_off+50)/100 AS INTEGER) > 0
      AND (SELECT count(*) FROM checkout_coupon_reservations r WHERE r.coupon_code=c.code) < c.max_uses
    ON CONFLICT(order_id) DO NOTHING RETURNING amount_centavos`)
    .get({id:orderId,price:listAmountCentavos,now,code,floor:MIN_PAYABLE}) as {amount_centavos:number} | undefined;
  if (!row) throw new CouponError();
  return {amountCentavos:row.amount_centavos,couponCode:code};
}
export function releaseCouponReservation(orderId: string) {
  useDb();
  // Call only before the provider payment call; preserve ambiguous or already-persisted orders.
  db.prepare(`DELETE FROM checkout_coupon_reservations WHERE order_id=?
      AND NOT EXISTS (SELECT 1 FROM orders WHERE id=?)`).run(orderId,orderId);
}

/** Internal only: exact short-lived account-owner pilot; never usable as a public coupon. */
export function reserveOwnerPilotCoupon(code:string,expiresAt:string,listAmountCentavos:number,orderId:string) {
  const now=new Date().toISOString(), expiry=Date.parse(expiresAt);
  if (!PILOT_CODE_PATTERN.test(code) || listAmountCentavos!==PILOT_LIST_CENTAVOS ||
      !Number.isFinite(expiry) || expiresAt<=now || expiry>Date.now()+30*60_000 ||
      !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(orderId)) throw new CouponError();
  useDb();
  return db.transaction(()=>{
    db.prepare(`INSERT INTO checkout_coupons(code,percent_off,starts_at,ends_at,max_uses,created_at)
      VALUES(?,?,?,?,1,?) ON CONFLICT(code) DO NOTHING`).run(code,PILOT_PERCENT,now,expiresAt,now);
    const row=db.prepare(`INSERT INTO checkout_coupon_reservations(order_id,coupon_code,list_amount_centavos,amount_centavos,reserved_at)
      SELECT @id,c.code,@price,@amount,@now FROM checkout_coupons c
      WHERE c.code=@code AND c.active=1 AND c.percent_off=@percent AND c.max_uses=1
      AND c.ends_at=@expiresAt AND c.starts_at<=@now AND c.ends_at>@now
      AND NOT EXISTS(SELECT 1 FROM checkout_coupon_reservations r WHERE r.coupon_code=c.code)
      ON CONFLICT(order_id) DO NOTHING RETURNING amount_centavos`)
      .get({id:orderId,code,now,expiresAt,price:PILOT_LIST_CENTAVOS,amount:PILOT_CENTAVOS,percent:PILOT_PERCENT}) as {amount_centavos:number}|undefined;
    if(row?.amount_centavos!==PILOT_CENTAVOS) throw new CouponError();
    return {couponCode:code,amountCentavos:row.amount_centavos};
  }).immediate();
}
