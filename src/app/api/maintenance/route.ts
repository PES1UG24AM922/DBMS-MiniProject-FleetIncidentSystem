import { handle, ok } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";

// Managers have no SELECT on `users`, so assignee is shown as a user id.
export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  return ok(await q(s.role,
    `SELECT m.action_id, m.incident_id, b.reg_number, m.assigned_to, m.action_desc, m.cost, m.status, m.created_at, m.completed_at
     FROM maintenance_actions m JOIN buses b ON b.bus_id = m.bus_id ORDER BY m.created_at DESC`));
});
