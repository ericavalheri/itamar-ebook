"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { parsePixReceipt, type PixReceipt } from "@/lib/pix-receipt";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export default function ComprarForm({ produto, ownerPilot = false }: { produto: string; ownerPilot?:boolean }) {
  const busy = useRef(false);
  const headline = useRef<HTMLHeadingElement>(null);
  const pixInput = useRef<HTMLTextAreaElement>(null);
  const [receipt, setReceipt] = useState<PixReceipt | null>(null);
  const [status, setStatus] = useState("aguardando_pagamento");
  const [copyHint, setCopyHint] = useState("");
  const [uncertain, setUncertain] = useState(false);
  useEffect(() => { if (receipt) headline.current?.focus(); }, [receipt]);
  useEffect(() => {
    if (!receipt || status !== "aguardando_pagamento") return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      try {
        const res = await fetch(`/api/orders/${receipt.id}/status`, {cache:"no-store",signal:controller.signal});
        if (res.ok) {
          const data = await res.json();
          if (["aprovado","expirado","cancelado","bloqueado","estornado"].includes(data?.status)) {
            setStatus(data.status);
            return;
          }
        }
      } catch { /* Network failure leaves the pending state intact. */ }
      if (!controller.signal.aborted) timer = setTimeout(tick,4000);
    };
    timer = setTimeout(tick,4000);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [receipt,status]);

  async function copyPix() {
    if (!receipt) return;
    try { await navigator.clipboard.writeText(receipt.copyPaste); setCopyHint("Código Pix copiado."); }
    catch { pixInput.current?.focus(); pixInput.current?.select(); setCopyHint("Código selecionado. Use a opção Copiar do seu aparelho."); }
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current || receipt) return;
    busy.current = true;
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      produto,
      nome: String(form.get("nome") || "").trim(),
      email: String(form.get("email") || "").trim(),
      telefone: String(form.get("telefone") || "").trim(),
      estado: String(form.get("estado") || "").trim(),
      cpf: String(form.get("cpf") || "").trim(),
      coupon: String(form.get("coupon") || "").trim() || undefined,
    };
    try {
      const key = `honestamente-itamar:pix:${ownerPilot ? "pilot" : "public"}:${produto}`;
      let requestId = sessionStorage.getItem(key);
      if (!requestId) { requestId = crypto.randomUUID(); sessionStorage.setItem(key, requestId); }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(ownerPilot ? {"X-Itamar-Pix-Pilot":"1"} : {}) },
        body: JSON.stringify({...body,requestId}),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Não foi possível concluir o cadastro.");
        if (data.mayHaveCreatedOrder === true) setUncertain(true);
        return;
      }
      const parsed = parsePixReceipt(data);
      if (!parsed) throw Error("Incomplete response");
      setStatus(typeof data.status==="string" ? data.status : "aguardando_pagamento");
      setReceipt(parsed);
      setUncertain(false);
    } catch {
      setError("A conexão foi interrompida e não deu para confirmar se o Pix foi criado. Use os mesmos dados para tentar recuperar este pedido, sem gerar outro nesta aba.");
      setUncertain(true);
    } finally { busy.current = false; setLoading(false); }
  }

  if (receipt) return (
    <section aria-label="Pagamento Pix" className="card" style={{padding:24,width:"100%",maxWidth:480}}>
      <h3 ref={headline} tabIndex={-1}>{status === "aprovado" ? "Pagamento confirmado" : "Pagamento Pix"}</h3>
      <p>Valor deste pedido: <strong>{formatMoney(receipt.amountCentavos)}</strong></p>
      {status === "aguardando_pagamento" && <div>
        <p>No app do banco, escaneie o QR Code ou copie o código Pix. Esta página acompanha o pagamento automaticamente.</p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${receipt.qrBase64}`} alt="QR Code para pagar este pedido" width={208} height={208} style={{display:"block",maxWidth:"100%",height:"auto",margin:"12px auto"}} />
        <label htmlFor="pix-codigo">Pix copia e cola</label>
        <textarea id="pix-codigo" ref={pixInput} value={receipt.copyPaste} readOnly style={{width:"100%",display:"block",margin:"6px 0 12px"}}/>
        <button type="button" className="btn btn-primary" onClick={copyPix}>Copiar código Pix</button>
        <p role="status">{copyHint || "Aguardando pagamento"}</p>
      </div>}
      {status === "aprovado" && <><p role="status">Use o e-mail da compra para receber ou solicitar seu código de acesso.</p><Link href="/acessar" className="btn btn-primary">Acessar meu e-book</Link></>}
      {status !== "aguardando_pagamento" && status !== "aprovado" && <p role="status">O Pix deste pedido não está mais disponível. Confira o acompanhamento antes de gerar outro.</p>}
      <p><Link href={`/pedido/${receipt.id}`}>Acompanhar pedido</Link></p>
    </section>
  );

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 28, width:"100%", maxWidth: 480 }}>
      <div className="field">
        <label htmlFor="nome">Nome completo</label>
        <input id="nome" name="nome" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="telefone">Telefone / WhatsApp</label>
        <input id="telefone" name="telefone" required autoComplete="tel" placeholder="(11) 91234-5678" />
      </div>
      <div className="field">
        <label htmlFor="cpf">CPF</label>
        <input id="cpf" name="cpf" required inputMode="numeric" placeholder="000.000.000-00" maxLength={14} />
        <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>
          Necessário para gerar o Pix da sua compra.
        </span>
      </div>
      <div className="field">
        <label htmlFor="estado">Estado</label>
        <select id="estado" name="estado" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {ESTADOS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </div>
      {!ownerPilot && <div className="field">
        <label htmlFor="coupon">Cupom de desconto (opcional)</label>
        <input id="coupon" name="coupon" maxLength={48} autoComplete="off"/>
        <span style={{fontSize:"0.78rem",color:"var(--muted)"}}>O desconto será aplicado ao gerar o Pix.</span>
      </div>}
      {error && <div role="alert" className="error-box">{error}</div>}
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Conferindo Pix..." : uncertain ? "Recuperar este Pix" : "Gerar Pix"}
      </button>
    </form>
  );
}
