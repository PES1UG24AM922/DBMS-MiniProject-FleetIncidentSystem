import { handle, ok, idParam } from "@/lib/api";
import { getPool } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";

export const POST = handle(async (_req, ctx) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  await getPool(s.role).query("CALL sp_resolve_incident(?,?)", [await idParam(ctx), s.userId]);
  return ok({ resolved: true });
});
