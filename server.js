// Custom entry point for hosts (like Hostinger's hPanel "Node.js App")
// that expect a startup file listening on process.env.PORT, instead of
// running `next start` directly.
const { createServer } = require("node:http");
const next = require("next");

const port = Number(process.env.PORT) || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`itamar-ebook ready on port ${port}`);
  });
});
