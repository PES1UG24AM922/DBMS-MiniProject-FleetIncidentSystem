import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import Sidebar from "@/components/Sidebar";
import { RoleProvider } from "@/components/RoleProvider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const s = await getSession();
  if (!s) redirect("/login");
  return (
    <RoleProvider role={s.role}>
      <div className="shell"><Sidebar role={s.role} /><main className="main">{children}</main></div>
    </RoleProvider>
  );
}
