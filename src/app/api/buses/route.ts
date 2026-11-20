import { handle, ok } from "@/lib/api";
import { getPool, q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { Bus } from "@/lib/validators";

export const GET = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const status = new URL(req.url).searchParams.get("status");
  const rows = status
    ? await q(s.role, "SELECT * FROM v_fleet_utilization WHERE status = ? ORDER BY bus_id", [status])
    : await q(s.role, "SELECT * FROM v_fleet_utilization ORDER BY bus_id");
  return ok(rows);
});

export const POST = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const b = Bus.parse(await req.json());
  const [r]: any = await getPool(s.role).query(
    "INSERT INTO buses (reg_number, model, capacity, purchase_date, fuel_type) VALUES (?,?,?,?,?)",
    [b.regNumber.toUpperCase(), b.model, b.capacity, b.purchaseDate, b.fuelType]);
  return ok({ busId: r.insertId }, 201);
});
