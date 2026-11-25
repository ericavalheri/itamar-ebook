"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { listAdminTeam } from "@/lib/admin-accounts";
import s from "../admin-dashboard.module.css";

export default function AdminTeamActions({team}:{team:Awaited<ReturnType<typeof listAdminTeam>>}) {
  const router=useRouter();
  const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[feedback,setFeedback]=useState("");
  async function send(body:{action:"create";email:FormDataEntryValue|null;password:FormDataEntryValue|null}|{action:"disable";operatorId:string}) {
    if(busy)return false;
    setBusy(true);setFeedback("");
    try{const r=await fetch("/api/admin/team",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
      if(!r.ok){setFeedback(r.status===409?"Já existe uma conta com esse e-mail.":"Não foi possível salvar a conta. Confira os dados e a permissão.");return false;}
      setFeedback(body.action==="create"?"Conta criada. Nenhum e-mail foi enviado.":"Acesso desativado.");
      router.refresh();return true;
    }catch{setFeedback("Falha de conexão. Tente novamente.");return false;}finally{setBusy(false);}
  }
  async function add(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();const form=event.currentTarget;const values=new FormData(form);
    if(await send({action:"create",email:values.get("email"),password:values.get("password")})){form.reset();setOpen(false);}
  }
  return <>
    {team.length ? <div className={s.table} role="region" aria-label="Tabela de equipe" tabIndex={0}><table><thead><tr><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Acesso</th><th scope="col">Ações</th></tr></thead><tbody>{team.map(user=><tr key={user.id}><td>{user.email}</td><td>{user.role==="owner"?"Administração":"Operação"}</td><td>{user.active?"Ativo":"Desativado"}</td><td>{user.role==="operator"&&user.active&&<div className={s.actions}><button type="button" disabled={busy} onClick={()=>{if(confirm("Desativar o acesso desta conta?"))void send({action:"disable",operatorId:user.id});}}>Desativar</button></div>}</td></tr>)}</tbody></table></div>:<p>Nenhuma conta listada.</p>}
    <button type="button" className={s.primary} disabled={busy} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?"Fechar cadastro":"Adicionar operador"}</button>
    {open&&<form className={s.form} action="/api/admin/team" method="post" onSubmit={add}>
      <p>Cria uma conta individual de consulta. Nenhum convite é enviado. Defina uma senha exclusiva e não compartilhe por chat.</p>
      <label>E-mail do operador<input type="email" name="email" autoComplete="off" required maxLength={254}/></label>
      <label>Senha inicial<input type="password" name="password" autoComplete="new-password" required minLength={15} maxLength={128}/></label>
      <button type="submit" className={s.primary} disabled={busy}>{busy?"Salvando…":"Criar conta"}</button>
    </form>}
    {feedback&&<p role="status">{feedback}</p>}
  </>;
}
