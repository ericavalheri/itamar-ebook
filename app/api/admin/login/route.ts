import { COOKIE,cookieOptions } from "@/lib/admin-auth-core.mjs";
import { adminJson,getAccountsIfEnabled,readAdminJson,rejectUntrustedAdminOrigin } from "@/lib/admin-accounts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const rejected = rejectUntrustedAdminOrigin(req);
  if (rejected) return rejected;
  const accounts = getAccountsIfEnabled();
  if (!accounts) return adminJson({error:"Acesso administrativo indisponível."},503);
  const body = await readAdminJson(req);
  if (!body || typeof body.email !== "string" || typeof body.password !== "string") return adminJson({error:"Dados de acesso inválidos."},400);
  // Dedicated global/account SQLite buckets are independent of any caller-spoofable IP headers.
  const token = await accounts.login({email:body.email,password:body.password,trustedSourceKey:"admin-global"});
  if (!token) return adminJson({error:"Não foi possível entrar. Confira os dados ou aguarde alguns minutos."},401);
  const response = adminJson({ok:true});
  response.cookies.set(COOKIE,token,cookieOptions);
  return response;
}
