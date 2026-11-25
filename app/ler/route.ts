import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { readPrivateManuscript } from "@/lib/reader-content";
import { applyVolumeOneMobileMath } from "@/lib/reader-mobile-math";
import { resolveReaderTitle } from "@/lib/reader-library";
import { READER_COOKIE_NAME } from "@/lib/reader-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Polls the session while the reader is open and kicks the buyer back to
// /acessar the moment another device logs in and takes over the session —
// that's what makes "logging in elsewhere ends this session" feel immediate
// instead of only on the next page load.
function watcher(slug: string) {
  const url = JSON.stringify("/api/acesso/status?livro=" + encodeURIComponent(slug));
  return `
<script>
(function () {
  async function checkSession() {
    try {
      const res = await fetch(${url}, { cache: "no-store" });
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
    <a href="/acessar">Fazer login</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store" },
  });
}

export async function GET(req: NextRequest) {
  const store = await cookies();
  const sessionId = store.get(READER_COOKIE_NAME)?.value;
  const selection = resolveReaderTitle(sessionId, new URL(req.url).searchParams.get("livro"));

  if (selection.kind === "invalid-session") {
    return denyPage(
      "Faça login para ler",
      "Sua sessão não é mais válida — pode ter expirado ou sido aberta em outro lugar. Faça login de novo com seu e-mail.",
      401
    );
  }

  if (selection.kind !== "ok") {
    return denyPage(
      "E-book indisponível",
      "Não encontramos o conteúdo deste e-book no momento. Fale com a equipe.",
      404
    );
  }

  const {product,titles} = selection;
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, c => (({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[c] ?? c));
  const switcher = titles.length < 2 ? "" : '<nav aria-label="Meus livros" style="position:fixed;right:1rem;bottom:1rem;z-index:10000;max-width:calc(100% - 2rem);max-height:50vh;overflow:auto;background:#15283c;color:white;padding:.6rem 1rem;border-radius:.5rem"><details><summary>Meus livros</summary><ul>' +
    titles.map(({slug,titulo}) => '<li><a style="color:white" href="/ler?livro=' + encodeURIComponent(slug) + '"' + (slug === product.slug ? ' aria-current="page"' : '') + '>' + escapeHtml(titulo) + '</a></li>').join("") + '</ul></details></nav>';
  const manuscript = await readPrivateManuscript(product.contentFile);
  if (!manuscript) return denyPage("E-book temporariamente indisponível", "Não foi possível abrir esta edição. Sua compra não foi afetada. Tente novamente em instantes.", 503);
  const nonce = randomBytes(16).toString("base64url");
  const prepared = product.contentFile === "adicional-periculosidade.html" ? applyVolumeOneMobileMath(manuscript) : manuscript;
  const html = prepared.replace(/<\/body\s*>/i, () => `${switcher}${watcher(product.slug)}</body>`)
    .replace(/<script(?=[\s>])/gi, () => `<script nonce="${nonce}"`);
  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; style-src 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
    },
  });
}
