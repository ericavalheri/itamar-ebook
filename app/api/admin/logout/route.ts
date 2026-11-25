import { cookies } from "next/headers";
import { COOKIE,cookieOptions } from "@/lib/admin-auth-core.mjs";
import {adminJson,getAccountsIfEnabled,rejectUntrustedAdminOrigin} from "@/lib/admin-accounts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const rejected = rejectUntrustedAdminOrigin(req);
  if (rejected) return rejected;
  getAccountsIfEnabled()?.logout((await cookies()).get(COOKIE)?.value);
  const response = adminJson({ok:true});
  response.cookies.set(COOKIE,"",{...cookieOptions,maxAge:0});
  response.cookies.set("itamar_admin_session","",{...cookieOptions,maxAge:0});
  return response;
}
