import { handle, ok, idParam } from "@/lib/api";
import { getPool } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { Assign } from "@/lib/validators";

export const POST = handle(async (req, ctx) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const b = Assign.parse(await req.json());
  await getPool(s.role).query("CALL sp_assign_maintenance(?,?,?,?)", [await idParam(ctx), s.userId, b.description, b.cost]);
  return ok({ assigned: true });
});
