"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
];

export default function ComprarForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      nome: String(form.get("nome") || "").trim(),
      email: String(form.get("email") || "").trim(),
      telefone: String(form.get("telefone") || "").trim(),
      estado: String(form.get("estado") || "").trim(),
    };
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível concluir o cadastro.");
        setLoading(false);
        return;
      }
      router.push(`/pedido/${data.id}`);
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 28, maxWidth: 480 }}>
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
        <label htmlFor="estado">Estado</label>
        <select id="estado" name="estado" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {ESTADOS.map((uf) => (
            <option key={uf} value={uf}>{uf}</option>
          ))}
        </select>
      </div>
      <div className="error-box">{error}</div>
      <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: "100%" }}>
        {loading ? "Enviando..." : "Continuar para pagamento"}
      </button>
    </form>
  );
}
