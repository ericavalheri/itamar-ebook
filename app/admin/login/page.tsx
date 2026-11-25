import { redirect } from "next/navigation";
import { adminIdentity } from "@/lib/admin-accounts";
import LoginForm from "./LoginForm";
import s from "../admin-dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await adminIdentity()) redirect("/admin");
  return <main className={s.login}>
    <div className={s.loginCard}>
      <p className={s.kicker}>Honestamente, Itamar</p>
      <h1>Acesso da equipe</h1>
      <p>Entre com sua conta administrativa individual.</p>
      <LoginForm />
      <p className={s.loginFoot}>Comprou um e-book? Use a <a href="/acessar">área de leitura</a>.</p>
    </div>
  </main>;
}
