import { handle, ok } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { tryMongo } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";

export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const [kpi] = await q(s.role,
    `SELECT (SELECT COUNT(*) FROM buses) AS buses,
            (SELECT COUNT(*) FROM buses WHERE status='AVAILABLE') AS available,
            (SELECT COUNT(*) FROM incidents WHERE status IN ('REPORTED','IN_PROGRESS')) AS open_incidents,
            (SELECT COUNT(*) FROM incidents) AS total_incidents,
            (SELECT ROUND(AVG(TIMESTAMPDIFF(MINUTE, reported_at, resolved_at))/60, 1) FROM incidents WHERE resolved_at IS NOT NULL) AS avg_resolution_hrs`);
  const routes = await q(s.role, "SELECT * FROM v_route_performance ORDER BY total_incidents DESC");
  const fleet = await q(s.role, "SELECT * FROM v_fleet_utilization ORDER BY incident_count DESC");
  const bySeverity = await q(s.role, "SELECT severity, COUNT(*) AS n FROM incidents GROUP BY severity ORDER BY FIELD(severity,'CRITICAL','HIGH','MEDIUM','LOW')");
  const topTags = await tryMongo((db) => db.collection("incident_reports").aggregate([
    { $unwind: "$tags" }, { $group: { _id: "$tags", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 6 }]).toArray());
  const overheating = await tryMongo((db) => db.collection("bus_telemetry").aggregate([
    { $match: { engine_temp_c: { $gt: 110 } } },
    { $group: { _id: "$bus_id", alerts: { $sum: 1 }, maxTemp: { $max: "$engine_temp_c" } } }, { $sort: { alerts: -1 } }]).toArray());
  return ok({ kpi, routes, fleet, bySeverity, topTags, overheating, mongoAvailable: topTags !== null });
});
