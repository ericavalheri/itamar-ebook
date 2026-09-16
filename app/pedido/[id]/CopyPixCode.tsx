"use client";

import { useState } from "react";

export default function CopyPixCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div>
      <textarea
        readOnly
        value={code}
        rows={3}
        style={{
          width: "100%",
          resize: "none",
          fontFamily: "monospace",
          fontSize: "0.8rem",
          padding: 10,
          borderRadius: 8,
          border: "1.5px solid var(--line)",
          background: "#fff",
          marginBottom: 10,
        }}
        onFocus={(e) => e.currentTarget.select()}
      />
      <button
        type="button"
        className="btn btn-primary"
        style={{ width: "100%" }}
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
      >
        {copied ? "Código copiado!" : "Copiar código Pix (copia e cola)"}
      </button>
    </div>
  );
}
