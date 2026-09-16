import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { getOrderByToken } from "@/lib/orders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedContent: string | null = null;
function readEbookContent() {
  if (cachedContent) return cachedContent;
  const filePath = path.join(process.cwd(), "content", "adicional-periculosidade.html");
  cachedContent = fs.readFileSync(filePath, "utf8");
  return cachedContent;
}

function denyPage(title: string, message: string, status: number) {
  const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  body { margin:0; min-height:100svh; display:grid; place-items:center; font-family: Inter, system-ui, sans-serif;
    color:#fffaf1; background: linear-gradient(135deg,#111d2f,#0c6661 60%,#c77842); padding:24px; }
  .box { max-width:440px; text-align:center; background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.16);
    border-radius:12px; padding:36px; backdrop-filter: blur(10px); }
  h1 { font-size:1.5rem; margin:0 0 10px; }
  p { opacity:0.9; margin:0 0 18px; }
  a { color:#e6c46a; font-weight:700; text-decoration:none; }
</style>
</head>
<body>
  <div class="box">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Voltar para a página inicial</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const order = getOrderByToken(token);

  if (!order) {
    return denyPage(
      "Link inválido",
      "Não encontramos um acesso ativo para este link. Confira o link recebido ou entre em contato com a equipe.",
      404
    );
  }

  if (order.status === "bloqueado") {
    return denyPage(
      "Acesso bloqueado",
      "O acesso vinculado a este link foi bloqueado. Fale com a equipe se acredita que isso é um engano.",
      403
    );
  }

  if (order.status !== "aprovado") {
    return denyPage(
      "Acesso ainda não liberado",
      "Este pedido ainda não foi aprovado. Assim que o pagamento for confirmado, o acesso será liberado.",
      403
    );
  }

  const html = readEbookContent();
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
