import {adminIdentity,adminJson,getAccountsIfEnabled,readAdminJson,requireOwnerMutation} from "@/lib/admin-accounts";
export const runtime = "nodejs";
export async function POST(req: Request) {
  const denial = await requireOwnerMutation(req);
  if (denial) return denial;
  const body = await readAdminJson(req);
  if (!body) return adminJson({error:"Dados inválidos."},400);
  const owner = await adminIdentity();
  const core = getAccountsIfEnabled();
  if (!owner || owner.role !== "owner" || !core) return adminJson({error:"Operação não permitida."},403);
  if (body.action === "disable" && typeof body.operatorId === "string") {
    return core.disableOperator({ownerId:owner.id,operatorId:body.operatorId}) ? adminJson({ok:true}) : adminJson({error:"Conta não disponível para desativação."},409);
  }
  if (body.action !== "create" || typeof body.email !== "string" || typeof body.password !== "string") return adminJson({error:"Dados inválidos."},400);
  try {
    await core.provisionOperatorOffline({ownerId:owner.id,email:body.email,password:body.password});
    return adminJson({ok:true},201);
  } catch {
    return adminJson({error:"Não foi possível criar a conta. Confira o e-mail e use pelo menos 15 caracteres na senha."},409);
  }
}
