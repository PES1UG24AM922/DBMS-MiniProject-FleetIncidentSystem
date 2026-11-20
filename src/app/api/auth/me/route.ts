import { handle, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
export const GET = handle(async () => {
  const s = await getSession();
  return s ? ok(s) : ok({ error: "Not signed in" }, 401);
});
