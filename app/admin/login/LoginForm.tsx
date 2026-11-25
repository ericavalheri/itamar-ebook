"use client";
import { useState } from "react";
import s from "../admin-dashboard.module.css";

export default function LoginForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/admin/login", {method: "POST", cache: "no-store",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email: form.get("email"), password: form.get("password")})});
      if (res.ok) { window.location.replace("/admin"); return; }
      setError(res.status === 429 ? "Muitas tentativas. Aguarde e tente novamente."
        : res.status === 503 ? "O acesso administrativo ainda não está configurado."
        : res.status === 401 ? "E-mail ou senha incorretos." : "Não foi possível entrar. Tente novamente.");
    } catch { setError("Falha na conexão. Tente novamente."); }
    setBusy(false);
  }
  return <form className={s.form} action="/api/admin/login" method="post" onSubmit={submit}>
    <label>E-mail profissional<input type="email" name="email" autoComplete="username" maxLength={254} required /></label>
    <label>Senha<input type="password" name="password" autoComplete="current-password" maxLength={256} required /></label>
    {error && <p className={s.error} role="alert">{error}</p>}
    <button className={s.primary} type="submit" disabled={busy}>{busy ? "Entrando…" : "Entrar no painel"}</button>
  </form>;
}
