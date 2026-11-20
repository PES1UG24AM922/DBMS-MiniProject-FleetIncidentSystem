import { handle, ok } from "@/lib/api";
import { getPool, q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { Trip } from "@/lib/validators";

export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  return ok(await q(s.role,
    `SELECT t.trip_id, r.route_code, b.reg_number, d.full_name AS driver, t.scheduled_start, t.scheduled_end, t.status
     FROM trips t JOIN routes r ON r.route_id=t.route_id JOIN buses b ON b.bus_id=t.bus_id JOIN drivers d ON d.driver_id=t.driver_id
     ORDER BY t.scheduled_start DESC`));
});

// Overlap / availability rules are enforced by the trg_trip_bi trigger, not by this code.
export const POST = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const t = Trip.parse(await req.json());
  const [r]: any = await getPool(s.role).query(
    "INSERT INTO trips (route_id, bus_id, driver_id, scheduled_start, scheduled_end) VALUES (?,?,?,?,?)",
    [t.routeId, t.busId, t.driverId, t.scheduledStart.replace("T", " "), t.scheduledEnd.replace("T", " ")]);
  return ok({ tripId: r.insertId }, 201);
});
