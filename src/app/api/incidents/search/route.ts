import { handle, ok } from "@/lib/api";
import { q } from "@/lib/db/mysql";
import { tryMongo } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";

export const GET = handle(async (req) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const term = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (term.length < 3) return ok({ error: "Type at least 3 characters" }, 400);
  const sql = await q(s.role,
    `SELECT i.incident_id, i.incident_type, i.severity, i.status, i.location_desc, i.reported_at,
            MATCH(i.description, i.location_desc) AGAINST (? IN NATURAL LANGUAGE MODE) AS score
     FROM incidents i WHERE MATCH(i.description, i.location_desc) AGAINST (? IN NATURAL LANGUAGE MODE)
     ORDER BY score DESC LIMIT 50`, [term, term]);
  const mongoHits = await tryMongo((db) =>
    db.collection("incident_reports").find({ $text: { $search: term } }, { projection: { incident_id: 1, tags: 1, _id: 0 } }).limit(50).toArray());
  return ok({ sql, mongo: mongoHits ?? [], mongoAvailable: mongoHits !== null });
});
