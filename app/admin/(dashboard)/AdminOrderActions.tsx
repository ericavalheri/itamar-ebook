"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "../admin-dashboard.module.css";

type Action = "grant-access" | "block" | "cancel" | "encerrar-sessao";
export default function AdminOrderActions({id,status,session}:{id:string;status:string;session:boolean}) {
  const router=useRouter();
  const [busy,setBusy]=useState(false), [feedback,setFeedback]=useState("");
  const actions:[Action,string][]=[];
  if(session)actions.push(["encerrar-sessao","Encerrar sessão"]);
  if(status==="aprovado")actions.push(["block","Bloquear leitura"]);
  else if(status==="bloqueado")actions.push(["grant-access","Reativar leitura"]);
  else { actions.push(["grant-access","Confirmar pagamento externo"]); if(status==="aguardando_pagamento")actions.push(["cancel","Cancelar pedido"]); }
  async function run(action:Action,name:string) {
    if(busy || !confirm(action==="grant-access"&&status!=="bloqueado"?"Confirme somente se você verificou o pagamento. Esta ação libera leitura e pode enviar e-mail ao leitor. Continuar?":action==="cancel"?"Cancelar o pedido no sistema? Isso não solicita estorno no Asaas.":name+"?"))return;
    setBusy(true);setFeedback("");
    try {const res=await fetch("/api/admin/orders/"+encodeURIComponent(id)+"/"+action,{method:"POST", headers:{"Content-Type":"application/json"}, body:"{}"});
      if(!res.ok){setFeedback("Não foi possível concluir a ação.");return;}
      setFeedback("Ação concluída.");router.refresh();
    }catch{setFeedback("Falha de conexão. Tente novamente.");}finally{setBusy(false);}
  }
  return <div className={s.actions}>{actions.map(([action,name])=><button key={action} type="button" disabled={busy} onClick={()=>void run(action,name)}>{name}</button>)}{feedback&&<span role="status">{feedback}</span>}</div>;
}
