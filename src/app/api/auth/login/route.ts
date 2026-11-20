import bcrypt from "bcryptjs";
import { handle, ok } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { createSession } from "@/lib/auth/session";
import { Login } from "@/lib/validators";

export const POST = handle(async (req) => {
  const body = Login.parse(await req.json());
  // The login account (app_auth) can only read the columns needed for authentication.
  const rows = await q("AUTH", "SELECT user_id, password_hash, role, driver_id FROM users WHERE username = ? AND is_active = 1", [body.username]);
  const u = rows[0];
  if (!u || !(await bcrypt.compare(body.password, u.password_hash))) return ok({ error: "Wrong username or password" }, 401);
  await createSession({ userId: u.user_id, role: u.role, driverId: u.driver_id });
  return ok({ role: u.role });
});
