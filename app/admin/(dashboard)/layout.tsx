import { Suspense } from "react";
import { redirect } from "next/navigation";
import { adminIdentity } from "@/lib/admin-accounts";
import AdminLogout from "./AdminLogout";
import AdminNav from "./AdminNav";
import s from "../admin-dashboard.module.css";

export default async function AdminDashboardLayout({children}: {children: React.ReactNode}) {
  const identity = await adminIdentity();
  if (!identity) redirect("/admin/login");
  const owner = identity.role === "owner";
  return <div className={s.shell}>
    <a className={s.skip} href="#admin-main">Pular para o conteúdo</a>
    <aside className={s.sidebar}>
      <div className={s.brand}><span>Honestamente, Itamar<span className={s.dot}>.</span></span><small>Administração da biblioteca</small></div>
      <Suspense><AdminNav owner={owner}/></Suspense>
      <div className={s.account}><small>{owner ? "Administração" : "Operação"}</small><span>{identity.email}</span><AdminLogout/></div>
    </aside>
    <div className={s.workspace}>
      <header className={s.top}><span>Painel da biblioteca</span><span className={s.badge}>Área restrita</span></header>
      <main className={s.content} id="admin-main" tabIndex={-1}>{children}</main>
    </div>
  </div>;
}
