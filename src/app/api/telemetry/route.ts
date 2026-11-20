import { handle, ok } from "@/lib/api";
import { mongoDb } from "@/lib/db/mongo";
import { requireRole } from "@/lib/auth/rbac";
import { Telemetry } from "@/lib/validators";

export const GET = handle(async (req) => {
  await requireRole(["ADMIN", "MANAGER"]);
  const busId = Number(new URL(req.url).searchParams.get("busId"));
  const filter = Number.isInteger(busId) && busId > 0 ? { bus_id: busId } : {};
  return ok(await (await mongoDb()).collection("bus_telemetry").find(filter, { projection: { _id: 0 } }).sort({ ts: -1 }).limit(50).toArray());
});

export const POST = handle(async (req) => {
  await requireRole(["ADMIN", "MANAGER"]);
  const t = Telemetry.parse(await req.json());
  await (await mongoDb()).collection("bus_telemetry").insertOne({
    bus_id: t.busId, ts: new Date(), speed_kmph: t.speedKmph,
    ...(t.engineTempC !== undefined ? { engine_temp_c: t.engineTempC } : {}), ...(t.fuelPct !== undefined ? { fuel_pct: t.fuelPct } : {}),
  });
  return ok({ saved: true }, 201);
});
