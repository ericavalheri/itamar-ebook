"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const MAX_FILE_BYTES = 3 * 1024 * 1024;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1] ?? "";
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ComprovanteForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const texto = String(formData.get("texto") || "").trim();
    const file = formData.get("arquivo") as File | null;

    if (!texto && (!file || file.size === 0)) {
      setError("Descreva o pagamento ou anexe o comprovante.");
      return;
    }
    if (file && file.size > MAX_FILE_BYTES) {
      setError("O arquivo deve ter até 3MB.");
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = { texto };
      if (file && file.size > 0) {
        payload.arquivoNome = file.name;
        payload.arquivoTipo = file.type || "application/octet-stream";
        payload.arquivoBase64 = await fileToBase64(file);
      }
      const res = await fetch(`/api/orders/${orderId}/comprovante`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Não foi possível enviar o comprovante.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Falha de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 18 }}>
      <div className="field">
        <label htmlFor="texto">Referência do pagamento (opcional se anexar arquivo)</label>
        <textarea id="texto" name="texto" rows={3} placeholder="Ex: Pix enviado às 14h32 pelo banco X, valor R$ 29,90" />
      </div>
      <div className="field">
        <label htmlFor="arquivo">Comprovante (imagem ou PDF, até 3MB)</label>
        <input id="arquivo" name="arquivo" type="file" accept="image/*,application/pdf" />
      </div>
      <div className="error-box">{error}</div>
      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviei o Pix, avisar a equipe"}
      </button>
    </form>
  );
}
