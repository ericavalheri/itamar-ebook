import { NextRequest, NextResponse } from "next/server";
import { configuredAdminOrigin, requireOwnerMutation } from "@/lib/admin-accounts";
import { CouponError, createCoupon, disableCoupon } from "@/lib/coupons";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };
function redirectResult(origin: string, notice: string) {
  return NextResponse.redirect(new URL("/admin/coupons?resultado="+notice, origin), {status:303, headers});
}
export async function POST(req: NextRequest) {
  const denial=await requireOwnerMutation(req);
  if (denial) return denial;
  const origin=configuredAdminOrigin();
  if (!origin) return NextResponse.json({error:"Operação indisponível."},{status:503,headers});
  if (!req.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded"))
    return NextResponse.json({error:"Formulário inválido."},{status:415,headers});
  let form: URLSearchParams;
  try {
    const reader=req.body?.getReader();
    if (!reader) return redirectResult(origin,"invalido");
    const chunks: Uint8Array[]=[];
    let total=0;
    for (;;) {
      const part=await reader.read();
      if (part.done) break;
      total+=part.value.length;
      if (total>4096) { await reader.cancel(); return redirectResult(origin,"invalido"); }
      chunks.push(part.value);
    }
    form=new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  } catch { return redirectResult(origin,"invalido"); }
  try {
    const action = form.get("action");
    if (action === "desativar") return redirectResult(origin, disableCoupon(String(form.get("code")??"")) ? "desativado" : "invalido");
    if (action !== "criar") return redirectResult(origin,"invalido");
    const percent = String(form.get("percentOff")??"");
    const cap = String(form.get("maxUses")??"");
    if (!/^\d{1,2}$/.test(percent) || !/^\d{1,5}$/.test(cap)) return redirectResult(origin,"invalido");
    createCoupon({code:String(form.get("code")??""),percentOff:Number(percent),maxUses:Number(cap),
      startsOn:String(form.get("startsOn")??""),endsOn:String(form.get("endsOn")??"")});
    return redirectResult(origin,"criado");
  } catch (err) {
    if (err instanceof CouponError)
      return redirectResult(origin,err.message.startsWith("Esse código") ? "duplicado" : "invalido");
    return NextResponse.json({error:"Não foi possível atualizar os cupons."},{status:500,headers});
  }
}
