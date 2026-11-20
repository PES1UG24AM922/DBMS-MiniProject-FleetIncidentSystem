"use client";
import { Msg, Table, fmt, useApi } from "@/components/ui";

export default function Analytics() {
  const { data, error } = useApi("/api/analytics");
  if (!data) return <Msg error={error || "Loading..."} />;
  return (<>
    <h1>Analytics</h1><p className="sub">Patterns in the incident history: repeat breakdowns, slow resolutions and follow-up chains.</p>
    <div className="card"><h2>Buses with repeated breakdowns</h2><Table rows={data.recurring} empty="No bus has two or more breakdowns." cols={[{ key: "reg_number", label: "Bus" }, { key: "breakdowns", label: "Breakdowns" }, { key: "last_seen", label: "Latest", render: (r) => fmt(r.last_seen) }]} /></div>
    <div className="card"><h2>Follow-up chains</h2><p className="hint">An incident linked to an earlier one, shown as earlier then later.</p><Table rows={data.chains} empty="No follow-up incidents." cols={[{ key: "path", label: "Chain" }, { key: "depth", label: "Length" }, { key: "incident_type", label: "Type" }]} /></div>
    <div className="card"><h2>Slower than their route average</h2><Table rows={data.slow} empty="None." cols={[{ key: "incident_id", label: "#" }, { key: "route_code", label: "Route" }, { key: "incident_type", label: "Type" }, { key: "minutes_taken", label: "Minutes to resolve" }]} /></div>
    <div className="card"><h2>Bus risk ranking</h2><Table rows={data.risk} cols={[{ key: "risk_rank", label: "Rank" }, { key: "reg_number", label: "Bus" }, { key: "incidents", label: "Incidents" }, { key: "trips_done", label: "Completed trips" }, { key: "incidents_per_trip", label: "Per trip" }]} /></div>
    <div className="card"><h2>Monthly trend</h2><Table rows={data.monthly} cols={[{ key: "month", label: "Month" }, { key: "incident_type", label: "Type" }, { key: "n", label: "Count" }]} /></div></>);
}
