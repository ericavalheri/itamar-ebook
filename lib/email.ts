import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP_HOST, SMTP_USER e SMTP_PASSWORD precisam estar definidos no ambiente para enviar e-mails."
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function getFromAddress() {
  return process.env.SMTP_FROM || process.env.SMTP_USER || "";
}

export async function sendAccessCodeEmail(to: string, bookTitle: string, code: string) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: `${code} é o seu código de acesso`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; color: #17212f;">
        <p>Use o código abaixo para acessar a revista digital <strong>${bookTitle}</strong>:</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #0c6661;">
          ${code}
        </p>
        <p>Ele é válido por 10 minutos. Se você não pediu esse código, pode ignorar este e-mail.</p>
      </div>
    `,
  });
}

export async function sendPurchaseConfirmedEmail(to: string, bookTitle: string, code: string) {
  await getTransporter().sendMail({
    from: getFromAddress(),
    to,
    subject: `Pagamento confirmado — seu acesso a "${bookTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 460px; margin: 0 auto; color: #17212f;">
        <p>Seu pagamento foi confirmado! Você já pode acessar <strong>${bookTitle}</strong>.</p>
        <p>Use o código abaixo na página de acesso, com o e-mail <strong>${to}</strong>:</p>
        <p style="font-size: 32px; font-weight: 800; letter-spacing: 6px; text-align: center; margin: 24px 0; color: #0c6661;">
          ${code}
        </p>
        <p>Ele é válido por 10 minutos. Se demorar mais que isso, basta pedir um novo código na própria página de acesso.</p>
      </div>
    `,
  });
}
