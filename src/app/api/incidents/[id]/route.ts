import { handle, ok, idParam } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { tryMongo } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";

export const GET = handle(async (_req, ctx) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const id = await idParam(ctx);
  const [incident] = await q(s.role,
    `SELECT i.*, b.reg_number, r.route_code, d.full_name AS driver_name
     FROM incidents i JOIN buses b ON b.bus_id=i.bus_id JOIN drivers d ON d.driver_id=i.driver_id
     JOIN trips t ON t.trip_id=i.trip_id JOIN routes r ON r.route_id=t.route_id WHERE i.incident_id = ?`, [id]);
  if (!incident) return ok({ error: "Incident not found" }, 404);
  const log = await q(s.role, "SELECT old_status, new_status, changed_by, changed_at FROM incident_status_log WHERE incident_id = ? ORDER BY log_id", [id]);
  const actions = await q(s.role, "SELECT action_id, action_desc, cost, status, created_at, completed_at FROM maintenance_actions WHERE incident_id = ?", [id]);
  const report = await tryMongo((db) => db.collection("incident_reports").findOne({ incident_id: id }, { projection: { _id: 0 } }));
  return ok({ incident, log, actions, report, mongoAvailable: report !== null || (await tryMongo(async () => true)) === true });
});
