// Run with:  mongosh "mongodb://localhost:27017" db/mongo/seed.js   (after init.js)
const nosql = db.getSiblingDB("transport_nosql");

nosql.incident_reports.insertMany([
  { incident_id: 2, reported_by: 3,
    narrative: "Engine overheated near Silk Board; coolant leak and brake pad wear observed by driver.",
    tags: ["engine", "brake", "coolant"], witnesses: [{ name: "S. Rao", phone: "9900011122" }],
    location: { type: "Point", coordinates: [77.623, 12.917] },
    attachments: [{ filename: "overheat.jpg", url: "/uploads/overheat.jpg" }],
    comments: [], created_at: new Date() },
  { incident_id: 3, reported_by: 3,
    narrative: "Brake failure warning returned after repair; vehicle taken back to the depot.",
    tags: ["brake", "repeat-issue"], witnesses: [],
    location: { type: "Point", coordinates: [77.6235, 12.9175] }, comments: [], created_at: new Date() },
  { incident_id: 4, reported_by: 4,
    narrative: "Crowding at Indiranagar during the morning peak; many standing passengers.",
    tags: ["crowding", "peak-hour"], witnesses: [],
    location: { type: "Point", coordinates: [77.6412, 12.9719] }, comments: [], created_at: new Date() }
]);

const now = Date.now();
nosql.bus_telemetry.insertMany([
  { bus_id: 1, ts: new Date(now - 3600e3),  speed_kmph: 42, engine_temp_c: 96,  fuel_pct: 61 },
  { bus_id: 1, ts: new Date(now - 1800e3),  speed_kmph: 38, engine_temp_c: 118, fuel_pct: 60 },
  { bus_id: 1, ts: new Date(now - 600e3),   speed_kmph: 35, engine_temp_c: 121, fuel_pct: 59 },
  { bus_id: 2, ts: new Date(now - 1200e3),  speed_kmph: 55, engine_temp_c: 88,  fuel_pct: 75 },
  { bus_id: 3, ts: new Date(now - 900e3),   speed_kmph: 48, engine_temp_c: 90,  fuel_pct: 82 }
]);
print("sample documents inserted");
