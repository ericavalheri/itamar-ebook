import { redirect } from "next/navigation";
import { adminIdentity, listAdminOrders, listAdminTeam } from "@/lib/admin-accounts";
import AdminDashboard from "./AdminDashboard";

export const dynamic = "force-dynamic";

const tabs = ["overview", "orders", "users", "money"] as const;
export type AdminTab = (typeof tabs)[number];

export default async function AdminDashboardPage({searchParams}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const identity = await adminIdentity();
  if (!identity) redirect("/admin/login");
  const params = await searchParams;
  const tab = tabs.find((value) => value === params.tab) ?? "overview";
  const orders = await listAdminOrders();
  const team = tab === "users" && identity.role === "owner" ? await listAdminTeam() : [];
  return <AdminDashboard tab={tab} identity={identity} orders={orders} team={team}
    filter={typeof params.status === "string" ? params.status : ""}
    page={typeof params.page === "string" ? params.page : "1"} />;
}
