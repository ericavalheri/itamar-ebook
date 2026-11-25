import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { open, realpath } from "node:fs/promises";
import path from "node:path";

const allowed = new Map([
  ["adicional-periculosidade.html","f785503d634ea8e42f104fc9ad051bd88ed31f4e4e7684b7116f164edf6325ca"],
  ["adicional-insalubridade.html","77447df82036612af92a6e69f96a02944e322bf678f3b1c22140473d9662fb16"],
]);
const limit = 2 * 1024 * 1024;
const disallowed = /(?:^|\/)(?:public_html|public|hbuilds|\.next|nodejs)(?:\/|$)/i;

export async function readPrivateManuscript(name: string): Promise<string | null> {
  const expected = allowed.get(name);
  const dir = process.env.READER_CONTENT_DIR;
  if (!expected || !dir || !path.isAbsolute(dir) || disallowed.test(dir)) return null;
  try {
    const root = await realpath(dir);
    if (root === path.parse(root).root || disallowed.test(root)) return null;
    const file = path.join(root,name);
    const handle = await open(file, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
      const info = await handle.stat();
      if (!info.isFile() || info.size < 1 || info.size > limit) return null;
      const bytes = Buffer.alloc(info.size);
      let size = 0;
      while (size < bytes.length) {
        const {bytesRead} = await handle.read(bytes,size,bytes.length-size,size);
        if (!bytesRead) return null;
        size += bytesRead;
      }
      if ((await handle.stat()).size !== size || createHash("sha256").update(bytes).digest("hex") !== expected) return null;
      const html = bytes.toString("utf8");
      return /<\/body\s*>/i.test(html) ? html : null;
    } finally { await handle.close(); }
  } catch { return null; }
}
