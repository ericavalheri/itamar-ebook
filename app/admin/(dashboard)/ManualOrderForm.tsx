"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Product } from "@/lib/products";

export default function ManualOrderForm({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const body = {
      produto: String(form.get("produto") || ""),
      nome: String(form.get("nome") || "").trim(),
      email: String(form.get("email") || "").trim(),
      telefone: String(form.get("telefone") || "").trim(),
      estado: String(form.get("estado") || "").trim(),
      cpf: String(form.get("cpf") || "").trim(),
    };
    try {
      const res = await fetch("/api/admin/orders/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível adicionar o comprador.");
        return;
      }
      (event.target as HTMLFormElement).reset();
      setOpen(false);
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button className="btn btn-secondary" onClick={() => setOpen(true)}>
        + Adicionar comprador manualmente
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: 20, maxWidth: 520 }}>
      <p style={{ marginTop: 0, fontSize: "0.86rem", color: "var(--muted)" }}>
        Libera o acesso na hora, sem passar pelo Asaas — use enquanto não temos a conta de
        pagamento dele configurada, ou para qualquer comprador que pagou por fora do sistema.
      </p>
      <div className="field">
        <label htmlFor="manual-produto">E-book</label>
        <select id="manual-produto" name="produto" required defaultValue="">
          <option value="" disabled>Selecione</option>
          {products.map((p) => (
            <option key={p.slug} value={p.slug}>{p.titulo}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="manual-nome">Nome</label>
        <input id="manual-nome" name="nome" required />
      </div>
      <div className="field">
        <label htmlFor="manual-email">E-mail (usado para o login)</label>
        <input id="manual-email" name="email" type="email" required />
      </div>
      <div className="field">
        <label htmlFor="manual-telefone">Telefone (opcional)</label>
        <input id="manual-telefone" name="telefone" />
      </div>
      <div className="field">
        <label htmlFor="manual-estado">Estado (opcional)</label>
        <input id="manual-estado" name="estado" maxLength={2} placeholder="SP" />
      </div>
      <div className="field">
        <label htmlFor="manual-cpf">CPF (opcional)</label>
        <input id="manual-cpf" name="cpf" placeholder="000.000.000-00" />
      </div>
      <div className="error-box">{error}</div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Adicionando..." : "Liberar acesso"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setOpen(false);
            setError("");
          }}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
