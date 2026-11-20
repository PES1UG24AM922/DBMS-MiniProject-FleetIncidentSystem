"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { Role } from "@/types";

const NAV: { href: string; label: string; roles: Role[] }[] = [
  { href: "/dashboard", label: "Overview", roles: ["ADMIN", "MANAGER"] },
  { href: "/incidents", label: "Incidents", roles: ["ADMIN", "MANAGER"] },
  { href: "/incidents/new", label: "Report incident", roles: ["ADMIN", "MANAGER", "DRIVER"] },
  { href: "/my-trips", label: "My trips", roles: ["DRIVER"] },
  { href: "/buses", label: "Buses", roles: ["ADMIN", "MANAGER"] },
  { href: "/drivers", label: "Drivers", roles: ["ADMIN"] },
  { href: "/routes", label: "Routes", roles: ["ADMIN", "MANAGER", "DRIVER"] },
  { href: "/trips", label: "Trips", roles: ["ADMIN", "MANAGER"] },
  { href: "/maintenance", label: "Maintenance", roles: ["ADMIN", "MANAGER"] },
  { href: "/analytics", label: "Analytics", roles: ["ADMIN", "MANAGER"] },
];

export default function Sidebar({ role }: { role: Role }) {
  const path = usePathname();
  const router = useRouter();
  const items = NAV.filter((n) => n.roles.includes(role));
  const active = items.filter((n) => path === n.href || path.startsWith(n.href + "/")).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return (
    <aside className="side">
      <p className="brand">Fleet &amp; Incident Console</p>
      <p className="who">Signed in as {role.toLowerCase()}</p>
      <ul className="line">
        {items.map((n) => (<li key={n.href} className={n.href === active ? "on" : ""}><Link href={n.href}>{n.label}</Link></li>))}
      </ul>
      <button className="signout" onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }}>Sign out</button>
    </aside>
  );
}
