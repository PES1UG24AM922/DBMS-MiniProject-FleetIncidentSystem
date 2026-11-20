import { handle, ok } from "@/lib/api";
import { getPool, q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { Route } from "@/lib/validators";

export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER", "DRIVER"]);
  return ok(await q(s.role,
    `SELECT r.route_id, r.route_code, r.route_name, r.origin, r.destination, r.distance_km,
            GROUP_CONCAT(st.stop_name ORDER BY rs.stop_sequence SEPARATOR ' > ') AS stops
     FROM routes r LEFT JOIN route_stops rs ON rs.route_id = r.route_id LEFT JOIN stops st ON st.stop_id = rs.stop_id
     GROUP BY r.route_id ORDER BY r.route_code`));
});

export const POST = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const r = Route.parse(await req.json());
  const [res]: any = await getPool(s.role).query(
    "INSERT INTO routes (route_code, route_name, origin, destination, distance_km) VALUES (?,?,?,?,?)",
    [r.routeCode.toUpperCase(), r.routeName, r.origin, r.destination, r.distanceKm]);
  return ok({ routeId: res.insertId }, 201);
});
