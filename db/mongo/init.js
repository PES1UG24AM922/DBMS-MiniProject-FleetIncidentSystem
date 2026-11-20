// Run with:  mongosh "mongodb://localhost:27017" db/mongo/init.js
const nosql = db.getSiblingDB("transport_nosql");
nosql.dropDatabase();

nosql.createCollection("incident_reports", {
  validator: { $jsonSchema: {
    bsonType: "object",
    required: ["incident_id", "reported_by", "narrative", "created_at"],
    properties: {
      incident_id: { bsonType: ["int", "long", "double"], minimum: 1 },
      reported_by: { bsonType: ["int", "long", "double"] },
      narrative:   { bsonType: "string", minLength: 10 },
      tags:        { bsonType: "array", items: { bsonType: "string" } },
      witnesses:   { bsonType: "array", items: { bsonType: "object", required: ["name"],
                       properties: { name: { bsonType: "string" }, phone: { bsonType: "string" } } } },
      location:    { bsonType: "object", required: ["type", "coordinates"],
                       properties: { type: { enum: ["Point"] },
                                     coordinates: { bsonType: "array", minItems: 2, maxItems: 2 } } },
      comments:    { bsonType: "array" },
      created_at:  { bsonType: "date" }
    } } },
  validationLevel: "strict", validationAction: "error"
});

nosql.createCollection("bus_telemetry", {
  validator: { $jsonSchema: { bsonType: "object",
    required: ["bus_id", "ts", "speed_kmph"],
    properties: {
      bus_id: { bsonType: ["int", "long", "double"] }, ts: { bsonType: "date" },
      speed_kmph: { bsonType: ["int", "long", "double"], minimum: 0, maximum: 150 },
      engine_temp_c: { bsonType: ["int", "long", "double"] },
      fuel_pct: { bsonType: ["int", "long", "double"], minimum: 0, maximum: 100 } } } }
});

nosql.incident_reports.createIndex({ incident_id: 1 }, { unique: true });
nosql.incident_reports.createIndex({ tags: 1 });
nosql.incident_reports.createIndex({ narrative: "text", tags: "text" });
nosql.incident_reports.createIndex({ location: "2dsphere" });
nosql.bus_telemetry.createIndex({ bus_id: 1, ts: -1 });
nosql.bus_telemetry.createIndex({ ts: 1 }, { expireAfterSeconds: 7776000 });
print("transport_nosql initialised");
