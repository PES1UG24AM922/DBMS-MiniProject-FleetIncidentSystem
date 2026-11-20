import { handle, ok, idParam } from "@/lib/api";
import { mongoDb } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";
import { ReportUpdate } from "@/lib/validators";

// MongoDB document for one incident: Read / Update / Delete.
export const GET = handle(async (_req, ctx) => {
  await requireRole(["ADMIN", "MANAGER"]);
  const doc = await (await mongoDb()).collection("incident_reports").findOne({ incident_id: await idParam(ctx) }, { projection: { _id: 0 } });
  return doc ? ok(doc) : ok({ error: "No detail report for this incident" }, 404);
});

export const PUT = handle(async (req, ctx) => {
  await requireRole(["ADMIN", "MANAGER"]);
  const b = ReportUpdate.parse(await req.json());
  const $set: Record<string, unknown> = {};
  if (b.narrative) $set.narrative = b.narrative;
  if (b.tags) $set.tags = b.tags;
  if (!Object.keys($set).length) return ok({ error: "Nothing to update" }, 400);
  const r = await (await mongoDb()).collection("incident_reports").updateOne({ incident_id: await idParam(ctx) }, { $set });
  return r.matchedCount ? ok({ updated: true }) : ok({ error: "No detail report for this incident" }, 404);
});

export const DELETE = handle(async (_req, ctx) => {
  await requireRole(["ADMIN"]);
  const r = await (await mongoDb()).collection("incident_reports").deleteOne({ incident_id: await idParam(ctx) });
  return r.deletedCount ? ok({ deleted: true }) : ok({ error: "No detail report for this incident" }, 404);
});
