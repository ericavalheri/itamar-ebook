import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs";
import path from "node:path";
import { getOrderByActiveSession } from "@/lib/orders";
import { READER_COOKIE_NAME } from "@/lib/reader-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let cachedContent: string | null = null;
function readEbookContent() {
  if (cachedContent) return cachedContent;
  const filePath = path.join(process.cwd(), "content", "adicional-periculosidade.html");
  cachedContent = fs.readFileSync(filePath, "utf8");
  return cachedContent;
}

// Polls the session while the reader is open and kicks the buyer back to
// /acessar the moment another device logs in and takes over the session —
// that's what makes "logging in elsewhere ends this session" feel immediate
// instead of only on the next page load.
const SESSION_WATCHER_SCRIPT = `
<script>
(function () {
  async function checkSession() {
    try {
      const res = await fetch("/api/acesso/status", { cache: "no-store" });
      const data = await res.json();
      if (!data.valid) {
        window.location.href = "/acessar?encerrado=1";
      }
    } catch (e) {
      // network hiccup, try again on the next tick
    }
  }
  setInterval(checkSession, 20000);

  var sairBtn = document.getElementById("sair-btn");
  if (sairBtn) {
    sairBtn.addEventListener("click", function (event) {
      event.preventDefault();
      fetch("/api/acesso/sair", { method: "POST" }).finally(function () {
        window.location.href = "/acessar";
      });
    });
  }
})();
</script>
`;

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
    <a href="/acessar">Fazer login</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function GET(_req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(READER_COOKIE_NAME)?.value;
  const order = sessionId ? getOrderByActiveSession(sessionId) : undefined;

  if (!order) {
    return denyPage(
      "Faça login para ler",
      "Sua sessão não é mais válida — pode ter expirado ou sido aberta em outro lugar. Faça login de novo com seu e-mail.",
      401
    );
  }

  const html = readEbookContent().replace("</body>", `${SESSION_WATCHER_SCRIPT}</body>`);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
    },
  });
}
