// Override only for local development/testing against a mock server.
const RESEND_API_BASE_URL = process.env.RESEND_API_BASE_URL || "https://api.resend.com";

export class EmailError extends Error {
  constructor(message: string, public status: number, public details?: unknown) {
    super(message);
    this.name = "EmailError";
  }
}

function getApiKey() {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error(
      "RESEND_API_KEY não está definido no ambiente. Configure a chave de API do Resend."
    );
  }
  return key;
}

function getFromAddress() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    "Honestamente, Itamar <onboarding@resend.dev>"
  );
}

export async function sendAccessCodeEmail(to: string, code: string) {
  const res = await fetch(`${RESEND_API_BASE_URL}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject: `${code} é o seu código de acesso`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; color: #17212f;">
          <p>Use o código abaixo para acessar a revista digital <strong>Adicional de Periculosidade</strong>:</p>
          <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #0c6661;">
            ${code}
          </p>
          <p>Ele é válido por 10 minutos. Se você não pediu esse código, pode ignorar este e-mail.</p>
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    let message = `Resend respondeu ${res.status}`;
    try {
      const body = JSON.parse(text);
      message = body?.message || message;
    } catch {
      // keep default message
    }
    throw new EmailError(message, res.status);
  }
}
