// API-level role and rule tests. Start the app first (npm run build && npm start) with a freshly seeded DB
// (db/setup.sh then npm run seed:users), then run: npm run test:api
import test from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

async function login(username: string, password = "Demo@1234") {
  const r = await fetch(`${BASE}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }) });
  const cookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  return { status: r.status, cookie };
}
async function call(cookie: string, method: string, path: string, body?: unknown) {
  const r = await fetch(`${BASE}${path}`, { method, headers: { "content-type": "application/json", cookie }, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, json: await r.json().catch(() => ({})) as any };
}

test("authentication", async () => {
  assert.equal((await login("admin", "wrong-password")).status, 401);
  assert.equal((await call("", "GET", "/api/buses")).status, 401);
  assert.equal((await login("admin")).status, 200);
});

test("driver role is limited by API and database", async () => {
  const { cookie } = await login("ravi");
  assert.equal((await call(cookie, "GET", "/api/buses")).status, 403);
  assert.equal((await call(cookie, "GET", "/api/drivers")).status, 403);
  const mine = await call(cookie, "GET", "/api/my");
  assert.equal(mine.status, 200);
  assert.equal(mine.json.trips.length, 3, "driver sees only own trips");
  const other = await call(cookie, "POST", "/api/incidents", { tripId: 2, type: "DELAY", severity: "LOW", location: "Test road", description: "Trip belongs to another driver" });
  assert.equal(other.status, 422);
  assert.match(other.json.error, /own trips/);
  const own = await call(cookie, "POST", "/api/incidents", { tripId: 5, type: "DELAY", severity: "LOW", location: "Test road", description: "Delay at the depot gate" });
  assert.equal(own.status, 201);
  assert.ok(own.json.incidentId > 0);
  assert.equal(typeof own.json.mongoDetailSaved, "boolean");
});

test("manager can operate but not administer", async () => {
  const { cookie } = await login("manager1");
  assert.equal((await call(cookie, "GET", "/api/drivers")).status, 200);
  assert.equal((await call(cookie, "POST", "/api/drivers", { fullName: "New Driver", licenseNo: "KA0120239999", phone: "9876543210", experienceYears: 2 })).status, 403);
  assert.equal((await call(cookie, "DELETE", "/api/buses/3")).status, 403);
  const fleet = await call(cookie, "GET", "/api/buses");
  assert.equal(fleet.status, 200);
  const overlap = await call(cookie, "POST", "/api/trips", { routeId: 1, busId: 1, driverId: 3, scheduledStart: "2026-11-20T08:30", scheduledEnd: "2026-11-20T09:00" });
  assert.equal(overlap.status, 422);
  assert.match(overlap.json.error, /overlapping/);
  const resolved = await call(cookie, "POST", "/api/incidents/1/assign", { description: "Should be rejected", cost: 10 });
  assert.equal(resolved.status, 422);
});

test("admin validation and analytics", async () => {
  const { cookie } = await login("admin");
  const bad = await call(cookie, "POST", "/api/drivers", { fullName: "A", licenseNo: "x", phone: "123", experienceYears: 99 });
  assert.equal(bad.status, 400);
  const dup = await call(cookie, "POST", "/api/buses", { regNumber: "KA01F1001", model: "Duplicate", capacity: 40, purchaseDate: "2024-01-01" });
  assert.equal(dup.status, 409);
  const found = await call(cookie, "GET", "/api/incidents/search?q=brake");
  assert.equal(found.status, 200);
  assert.ok(found.json.sql.length >= 1);
  const an = await call(cookie, "GET", "/api/analytics");
  assert.ok(an.json.chains.some((c: any) => c.path.includes("2 > 3")), "recursive CTE chain");
  const stats = await call(cookie, "GET", "/api/dashboard/stats");
  assert.equal(stats.status, 200);
  assert.ok(stats.json.kpi.buses >= 3);
});
