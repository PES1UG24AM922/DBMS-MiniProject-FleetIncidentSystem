import { handle, ok, idParam } from "@/lib/api";
import { mongoDb } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";
import { Comment } from "@/lib/validators";

export const POST = handle(async (req, ctx) => {
  const s = await requireRole(["ADMIN", "MANAGER"]);
  const b = Comment.parse(await req.json());
  const r = await (await mongoDb()).collection("incident_reports").updateOne(
    { incident_id: await idParam(ctx) }, { $push: { comments: { by: s.userId, text: b.text, at: new Date() } } as any });
  return r.matchedCount ? ok({ added: true }, 201) : ok({ error: "No detail report for this incident" }, 404);
});
