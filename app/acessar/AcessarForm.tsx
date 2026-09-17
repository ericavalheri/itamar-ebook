"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AcessarForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "codigo">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleRequestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/acesso/codigo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar o código.");
        return;
      }
      setInfo(data.message || "Se esse e-mail tiver uma compra aprovada, enviamos um código.");
      setStep("codigo");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/acesso/verificar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível verificar o código.");
        return;
      }
      router.push("/ler");
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (step === "email") {
    return (
      <form onSubmit={handleRequestCode} className="card" style={{ padding: 28, maxWidth: 400 }}>
        <div className="field">
          <label htmlFor="email">E-mail usado na compra</label>
          <input
            id="email"
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="error-box">{error}</div>
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
          {loading ? "Enviando..." : "Enviar código de acesso"}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleVerifyCode} className="card" style={{ padding: 28, maxWidth: 400 }}>
      <p style={{ fontSize: "0.88rem", color: "var(--muted)", marginTop: 0 }}>{info}</p>
      <div className="field">
        <label htmlFor="code">Código de 6 dígitos</label>
        <input
          id="code"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          style={{ letterSpacing: "4px", fontSize: "1.2rem", textAlign: "center" }}
        />
      </div>
      <div className="error-box">{error}</div>
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Verificando..." : "Entrar"}
      </button>
      <button
        type="button"
        className="btn btn-secondary"
        style={{ width: "100%", marginTop: 10 }}
        onClick={() => {
          setStep("email");
          setCode("");
          setError("");
        }}
      >
        Usar outro e-mail
      </button>
    </form>
  );
}
