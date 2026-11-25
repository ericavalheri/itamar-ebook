import {adminJson,readAdminJson,rejectUntrustedAdminOrigin} from "@/lib/admin-accounts";
import {provisionAdminOnce} from "@/lib/admin-setup";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const origin = rejectUntrustedAdminOrigin(req);
  if (origin) return origin;
  const body = await readAdminJson(req);
  if (!body) return adminJson({error:"Dados inválidos."},400);
  const result = await provisionAdminOnce(body);
  if (result === "ok") return adminJson({ok:true},201);
  if (result === "invalid") return adminJson({error:"Não foi possível ativar. Confira os dados."},403);
  return adminJson({error:"Ativação indisponível."},404);
}
