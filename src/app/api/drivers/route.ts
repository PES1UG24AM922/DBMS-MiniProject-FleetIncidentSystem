import { handle, ok } from "@/lib/api";
import { getPool, q } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";
import { Driver } from "@/lib/validators";

export const GET = handle(async () => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  return ok(await q(s.role, "SELECT driver_id, full_name, license_no, phone, experience_years, status FROM drivers ORDER BY driver_id"));
});

export const POST = handle(async (req) => {
  const s = await requireRole(["ADMIN"]);
  const d = Driver.parse(await req.json());
  const [r]: any = await getPool(s.role).query(
    "INSERT INTO drivers (full_name, license_no, phone, experience_years) VALUES (?,?,?,?)",
    [d.fullName, d.licenseNo.toUpperCase(), d.phone, d.experienceYears]);
  return ok({ driverId: r.insertId }, 201);
});
