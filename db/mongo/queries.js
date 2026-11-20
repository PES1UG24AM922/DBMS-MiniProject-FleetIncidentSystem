// Reference commands used by the application (run in mongosh against transport_nosql)
const nosql = db.getSiblingDB("transport_nosql");
printjson(nosql.incident_reports.findOne({ incident_id: 2 }));                       // READ one
printjson(nosql.incident_reports.find({ tags: "brake" }).toArray());                  // READ by tag
printjson(nosql.incident_reports.find({ $text: { $search: "coolant leak" } }).toArray()); // text search
printjson(nosql.incident_reports.aggregate([{ $unwind: "$tags" },
  { $group: { _id: "$tags", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]).toArray());
printjson(nosql.bus_telemetry.aggregate([
  { $match: { engine_temp_c: { $gt: 110 } } },
  { $group: { _id: "$bus_id", alerts: { $sum: 1 }, maxTemp: { $max: "$engine_temp_c" } } },
  { $sort: { alerts: -1 } }]).toArray());
nosql.incident_reports.updateOne({ incident_id: 2 }, { $push: { comments: { by: 2, text: "Inspected; pads replaced.", at: new Date() } } }); // UPDATE
nosql.incident_reports.updateOne({ incident_id: 2 }, { $addToSet: { tags: "repeat-issue" } });                                              // UPDATE
nosql.incident_reports.deleteOne({ incident_id: 99 });                                                                                    // DELETE
nosql.bus_telemetry.deleteMany({ ts: { $lt: new Date(Date.now() - 90 * 24 * 3600e3) } });                                               // DELETE
