// Emergency maintenance entry point. Does not load Next.js or any application code.
const { createServer } = require("node:http");
const port = Number(process.env.PORT) || 3000;
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Honestamente, Itamar | Em manutenção</title></head><body style="font-family:system-ui,sans-serif;max-width:640px;margin:12vh auto;padding:24px;color:#111d2f"><h1>Voltamos em breve</h1><p>A biblioteca está em manutenção. Compras e acessos estão temporariamente indisponíveis.</p></body></html>`;
createServer((_req, res) => {
  res.writeHead(503, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "Retry-After": "3600",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  });
  res.end(html);
}).listen(port, () => console.log(`itamar maintenance on port ${port}`));
