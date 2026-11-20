import { handle, ok } from "@/lib/api";
import { callProc } from "@/lib/db/mysql";
import { requireRole } from "@/lib/auth/rbac";

// Drivers read only their own data, through procedures (the DRIVER DB role has no table access).
export const GET = handle(async () => {
  const s = await requireRole(["DRIVER"]);
  return ok({
    trips: await callProc("DRIVER", "CALL sp_driver_trips(?)", [s.driverId]),
    incidents: await callProc("DRIVER", "CALL sp_driver_incidents(?)", [s.driverId]),
  });
});
