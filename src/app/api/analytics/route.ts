import { handle, ok } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";

export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const recurring = await q(s.role,
    `SELECT b.reg_number, COUNT(*) AS breakdowns, MAX(i.reported_at) AS last_seen
     FROM incidents i JOIN buses b ON b.bus_id=i.bus_id WHERE i.incident_type='BREAKDOWN'
     GROUP BY b.bus_id, b.reg_number HAVING COUNT(*) >= 2 ORDER BY breakdowns DESC`);
  const chains = await q(s.role,
    `WITH RECURSIVE chain AS (
       SELECT incident_id, parent_incident_id, incident_type, reported_at, 1 AS depth, CAST(incident_id AS CHAR(200)) AS path
       FROM incidents WHERE parent_incident_id IS NULL
       UNION ALL
       SELECT c.incident_id, c.parent_incident_id, c.incident_type, c.reported_at, ch.depth+1, CONCAT(ch.path,' > ',c.incident_id)
       FROM incidents c JOIN chain ch ON c.parent_incident_id = ch.incident_id)
     SELECT path, depth, incident_type, reported_at FROM chain WHERE depth > 1 ORDER BY path`);
  const slow = await q(s.role,
    `SELECT i.incident_id, i.incident_type, r.route_code, TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at) AS minutes_taken
     FROM incidents i JOIN trips t ON t.trip_id=i.trip_id JOIN routes r ON r.route_id=t.route_id
     WHERE i.resolved_at IS NOT NULL AND TIMESTAMPDIFF(MINUTE, i.reported_at, i.resolved_at) >
       (SELECT AVG(TIMESTAMPDIFF(MINUTE, i2.reported_at, i2.resolved_at)) FROM incidents i2
        JOIN trips t2 ON t2.trip_id=i2.trip_id WHERE t2.route_id=t.route_id AND i2.resolved_at IS NOT NULL)
     ORDER BY minutes_taken DESC`);
  const risk = await q(s.role,
    `WITH bus_stats AS (
       SELECT b.reg_number, (SELECT COUNT(*) FROM incidents i WHERE i.bus_id=b.bus_id) AS incidents,
              (SELECT COUNT(*) FROM trips t WHERE t.bus_id=b.bus_id AND t.status='COMPLETED') AS trips_done FROM buses b)
     SELECT reg_number, incidents, trips_done, ROUND(incidents/NULLIF(trips_done,0),2) AS incidents_per_trip,
            RANK() OVER (ORDER BY incidents DESC) AS risk_rank FROM bus_stats`);
  const monthly = await q(s.role,
    `SELECT DATE_FORMAT(reported_at,'%Y-%m') AS month, incident_type, COUNT(*) AS n FROM incidents GROUP BY month, incident_type ORDER BY month, n DESC`);
  return ok({ recurring, chains, slow, risk, monthly });
});
