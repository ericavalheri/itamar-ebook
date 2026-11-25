"use client";
import { useState } from "react";
import s from "../admin-dashboard.module.css";

export default function AdminLogout() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function leave() {
    if (busy) return;
    setBusy(true); setError(false);
    try {
      const res = await fetch("/api/admin/logout", { method: "POST", cache: "no-store" });
      if (res.ok || res.status === 401) {window.location.replace("/admin/login"); return;}
    } catch {}
    setError(true); setBusy(false);
  }
  return <div><button type="button" className={s.logout} disabled={busy} onClick={leave}>{busy ? "Saindo…" : "Sair do painel"}</button>
    {error && <p className={s.sideError} role="alert">Não foi possível sair. Tente novamente.</p>}</div>;
}
