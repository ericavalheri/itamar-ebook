import Database from "better-sqlite3";
import { createHash, timingSafeEqual } from "node:crypto";
import { statSync } from "node:fs";
import { createInterface } from "node:readline";
import path from "node:path";
import { makeAdminAuth } from "../lib/admin-auth-core.mjs";

// Run offline from the existing authorized shell. Feed two lines through a protected
// pipe or file descriptor from a secret store (legacy password, then fresh password).
// This command rejects interactive input to avoid terminal echo.
const digest = (s) => createHash("sha256").update(s).digest();
try {
  const [email, ...extra] = process.argv.slice(2);
  if (!email || extra.length || process.stdin.isTTY || !process.env.ADMIN_PASSWORD || !process.env.DATA_DIR || !path.isAbsolute(process.env.DATA_DIR)) {
    throw new Error("Usage: provision an explicit email with DATA_DIR and legacy ADMIN_PASSWORD set, passwords via protected pipe.");
  }
  const file = path.join(process.env.DATA_DIR,"itamar-ebook.db");
  if (!statSync(file).isFile()) throw new Error("Existing database required.");
  const lines = [];
  const reader = createInterface({input:process.stdin,crlfDelay:Infinity,terminal:false});
  for await (const line of reader) {
    if (line.length > 1024 || lines.length > 1) throw new Error("Invalid input.");
    lines.push(line);
  }
  const [oldPassword,newPassword] = lines;
  if (!oldPassword || !newPassword) throw new Error("Invalid input.");
  if (!timingSafeEqual(digest(oldPassword),digest(process.env.ADMIN_PASSWORD)) ||
      timingSafeEqual(digest(oldPassword),digest(newPassword))) throw new Error("Invalid setup authorization or reused password.");
  lines.fill("");
  const db = new Database(file,{fileMustExist:true});
  try { await makeAdminAuth(db).bootstrapOwnerOffline({email,password:newPassword}); }
  finally { db.close(); }
  process.stdout.write("Conta proprietária preparada; nenhum login foi publicado.\n");
} catch {
  process.stderr.write("Bootstrap não executado: verifique a conta, os dados de entrada e se já existe administrador.\n");
  process.exitCode = 1;
}
