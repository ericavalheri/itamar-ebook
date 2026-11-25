import {createHash,timingSafeEqual} from "node:crypto";
import {db} from "@/lib/db";
import {configuredAdminOrigin} from "@/lib/admin-accounts";
import {makeAdminAuth} from "@/lib/admin-auth-core.mjs";

const equal = (a:string,b:string) => {
  const digest = (s:string) => createHash("sha256").update(s).digest();
  return timingSafeEqual(digest(a),digest(b));
};

function config(now = Date.now()) {
  const { ADMIN_SETUP_ARMED, ADMIN_SETUP_SECRET, ADMIN_SETUP_EXPIRES_AT, ADMIN_OWNER_EMAIL, ADMIN_PASSWORD, DATA_DIR, ADMIN_AUTH_MODE } = process.env;
  const until = Date.parse(ADMIN_SETUP_EXPIRES_AT ?? "");
  if (ADMIN_SETUP_ARMED !== "true" || ADMIN_AUTH_MODE !== "accounts" || !configuredAdminOrigin() ||
      !DATA_DIR?.startsWith("/") || !ADMIN_SETUP_SECRET || !/^[A-Za-z0-9_-]{43}$/.test(ADMIN_SETUP_SECRET) ||
      !ADMIN_OWNER_EMAIL || ADMIN_OWNER_EMAIL.length>254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ADMIN_OWNER_EMAIL) ||
      !ADMIN_PASSWORD || !Number.isFinite(until) || until <= now || until > now+15*60_000) return null;
  return {secret:ADMIN_SETUP_SECRET,legacy:ADMIN_PASSWORD,email:ADMIN_OWNER_EMAIL,until};
}

let auth: ReturnType<typeof makeAdminAuth> | undefined;
function freshDatabase() {
  auth ??= makeAdminAuth(db);
  return !db.prepare("SELECT 1 FROM itamar_admin_users LIMIT 1").get();
}
export function adminSetupAvailable() {
  return Boolean(config() && freshDatabase());
}

export async function provisionAdminOnce(input: Record<string,unknown>) {
  const opts = config();
  if (!opts || !freshDatabase()) return "closed" as const;
  const {setupToken,legacyPassword,password} = input;
  if (typeof setupToken !== "string" || typeof legacyPassword !== "string" || typeof password !== "string" ||
      !equal(setupToken,opts.secret) || !equal(legacyPassword,opts.legacy) || equal(password,opts.legacy) ||
      password.length<15 || Buffer.byteLength(password)>1024) return "invalid" as const;
  db.exec("CREATE TABLE IF NOT EXISTS itamar_admin_bootstrap_budget (id INTEGER PRIMARY KEY CHECK(id=1), attempts INTEGER NOT NULL)");
  const lock = db.prepare("INSERT INTO itamar_admin_bootstrap_budget VALUES (1,1) ON CONFLICT(id) DO UPDATE SET attempts=attempts+1 WHERE attempts<3").run();
  if (!lock.changes) return "closed" as const;
  try {
    await auth!.bootstrapOwnerOffline({email:opts.email,password});
    // No session or identity in this response. Next use requires a normal login.
    return "ok" as const;
  } catch {
    return "closed" as const;
  }
}
