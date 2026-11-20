import { handle, ok, idParam } from "@/lib/api";
import { getPool } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { BusUpdate } from "@/lib/validators";

export const PUT = handle(async (req, ctx) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const id = await idParam(ctx);
  const b = BusUpdate.parse(await req.json());
  const sets: string[] = []; const vals: any[] = [];
  if (b.status) { sets.push("status = ?"); vals.push(b.status); }
  if (b.model) { sets.push("model = ?"); vals.push(b.model); }
  if (b.capacity) { sets.push("capacity = ?"); vals.push(b.capacity); }
  if (!sets.length) return ok({ error: "Nothing to update" }, 400);
  const [r]: any = await getPool(s.role).query(`UPDATE buses SET ${sets.join(", ")} WHERE bus_id = ?`, [...vals, id]);
  return r.affectedRows ? ok({ updated: true }) : ok({ error: "Bus not found" }, 404);
});

export const DELETE = handle(async (_req, ctx) => {
  const s = await requireRole(["ADMIN"]);
  const [r]: any = await getPool(s.role).query("DELETE FROM buses WHERE bus_id = ?", [await idParam(ctx)]);
  return r.affectedRows ? ok({ deleted: true }) : ok({ error: "Bus not found" }, 404);
});
