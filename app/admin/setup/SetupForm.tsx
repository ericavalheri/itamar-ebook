"use client";
import { useState } from "react";
import s from "../admin-dashboard.module.css";
export default function SetupForm(){
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [done,setDone]=useState(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(busy)return;
    const element=event.currentTarget, form=new FormData(element);
    const password=form.get("password");
    if(password!==form.get("confirm")) {setError("As duas novas senhas precisam ser iguais.");return;}
    setError("");setBusy(true);
    try {
      const r=await fetch("/api/admin/setup",{method:"POST",cache:"no-store",headers:{"Content-Type":"application/json"},body:JSON.stringify({setupToken:form.get("setupToken"),legacyPassword:form.get("legacyPassword"),password})});
      if(r.ok){element.reset();setDone(true);return;}
      setError("Não foi possível concluir. Confira os dados e se o prazo do código ainda está válido.");
    }catch{setError("Falha na conexão. Por segurança, confira se a conta já funciona antes de repetir.");}
    setBusy(false);
  }
  if(done)return <div role="status"><p>Conta proprietária criada. Remova o código temporário da hospedagem. Agora entre com o e-mail administrativo configurado e sua nova senha.</p><a className={s.primary} href="/admin/login">Ir para o login</a></div>;
  return <form action="/api/admin/setup" method="post" autoComplete="off" onSubmit={submit} className={s.form}>
    <label>Código temporário<input name="setupToken" type="password" autoComplete="off" required minLength={32} maxLength={256}/></label>
    <label>Senha atual do painel<input name="legacyPassword" type="password" autoComplete="off" required maxLength={256}/></label>
    <label>Nova senha<input name="password" type="password" autoComplete="new-password" required minLength={15} maxLength={128}/></label>
    <label>Repita a nova senha<input name="confirm" type="password" autoComplete="new-password" required minLength={15} maxLength={128}/></label>
    {error&&<p className={s.error} role="alert">{error}</p>}
    <button type="submit" className={s.primary} disabled={busy}>{busy?"Configurando…":"Criar conta proprietária"}</button>
  </form>;
}
