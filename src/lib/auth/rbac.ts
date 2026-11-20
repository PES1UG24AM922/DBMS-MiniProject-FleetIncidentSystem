import { getSession, Role, Session } from "./session";

/** API guard: throws a Response (caught by handle()) when the caller is not logged in or not allowed. */
export async function requireRole(allowed: Role[]): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Response(JSON.stringify({ error: "Not signed in" }), { status: 401, headers: { "content-type": "application/json" } });
  if (!allowed.includes(s.role))
    throw new Response(JSON.stringify({ error: "Your role is not allowed to do this" }), { status: 403, headers: { "content-type": "application/json" } });
  return s;
}
