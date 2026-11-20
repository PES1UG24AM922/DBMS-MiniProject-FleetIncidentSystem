import { handle, ok } from "@/lib/api";
import { callProc, getPool, q } from "@/lib/db/mysql";
import { tryMongo } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";
import { IncidentNew } from "@/lib/validators";

export const GET = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER", "DRIVER"]);
  if (s.role === "DRIVER") return ok(await callProc("DRIVER", "CALL sp_driver_incidents(?)", [s.driverId]));
  const p = new URL(req.url).searchParams;
  const where: string[] = []; const vals: any[] = [];
  for (const [param, col] of [["status", "status"], ["severity", "severity"], ["type", "incident_type"]] as const) {
    const v = p.get(param);
    if (v) { where.push(`${col} = ?`); vals.push(v); }
  }
  return ok(await q(s.role, `SELECT * FROM v_incident_details ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY reported_at DESC`, vals));
});

// Transaction + business rules live in sp_report_incident and the incident triggers.
// The connection uses the caller's own database account, so database privileges apply.
export const POST = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER", "DRIVER"]);
  const b = IncidentNew.parse(await req.json());
  const conn = await getPool(s.role).getConnection();
  let incidentId: number;
  try {
    await conn.query("CALL sp_report_incident(?,?,?,?,?,?,?,@out)",
      [b.tripId, b.type, b.severity, b.location, b.description, s.userId, s.role === "DRIVER" ? s.driverId : null]);
    const [r]: any = await conn.query("SELECT @out AS id");
    incidentId = r[0].id;
  } finally {
    conn.release();
  }
  const saved = await tryMongo((db) => db.collection("incident_reports").insertOne({
    incident_id: incidentId, reported_by: s.userId, narrative: b.description, tags: b.tags, witnesses: [], comments: [],
    ...(b.lng !== undefined && b.lat !== undefined ? { location: { type: "Point", coordinates: [b.lng, b.lat] } } : {}),
    created_at: new Date(),
  }));
  return ok({ incidentId, mongoDetailSaved: saved !== null }, 201);
});
