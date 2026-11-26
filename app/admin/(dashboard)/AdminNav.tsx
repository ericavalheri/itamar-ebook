"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import s from "../admin-dashboard.module.css";

const links = [
  ["overview", "Visão geral", "/admin", "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z"],
  ["orders", "Pedidos", "/admin?tab=orders", "M5 3h14v18l-3-2-4 2-4-2-3 2V3z M9 8h6m-6 4h6"],
  ["users", "Usuários", "/admin?tab=users", "M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M14 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z M20 21v-2a4 4 0 0 0-3-4m0-12a4 4 0 0 1 0 8"],
  ["money", "Financeiro", "/admin?tab=money", "M4 19V5m0 14h16M9 15v-3m5 3V9m5 6V6"],
  ["coupons", "Cupons", "/admin/coupons", "M3 5h18v4a3 3 0 0 0 0 6v4H3v-4a3 3 0 0 0 0-6V5z M13 8h.01m0 4h.01m0 4h.01"],
] as const;

export default function AdminNav({ owner }: { owner: boolean }) {
  const pathname = usePathname();
  const selected = useSearchParams().get("tab");
  const active = pathname === "/admin/coupons" ? "coupons" :
    selected === "orders" || selected === "users" || selected === "money" ? selected : "overview";
  return <nav className={s.nav} aria-label="Menu da administração">
    {links.filter(([id]) => owner || id !== "coupons").map(([id, label, href, path]) =>
      <Link key={id} href={href} prefetch={false} aria-current={id === active ? "page" : undefined}>
        <svg aria-hidden="true" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={path}/></svg>
        {label}
      </Link>)}
  </nav>;
}
