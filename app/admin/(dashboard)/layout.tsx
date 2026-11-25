import { redirect } from "next/navigation";
import { adminIdentity } from "@/lib/admin-accounts";

export default async function AdminDashboardLayout({children}: {children: React.ReactNode}) {
  if (!(await adminIdentity())) redirect("/admin/login");
  return <>{children}</>;
}
