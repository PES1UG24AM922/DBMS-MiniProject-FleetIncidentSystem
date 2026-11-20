"use client";
import { Badge, Msg, Table, fmt, useApi } from "@/components/ui";
import Link from "next/link";

export default function MyTrips() {
  const { data, error } = useApi("/api/my");
  return (<>
    <h1>My trips</h1><p className="sub">Your assigned trips and the incidents you have reported.</p>
    <Msg error={error} />
    <div className="row"><Link href="/incidents/new" className="btn" style={{ textDecoration: "none", padding: "9px 16px", background: "var(--signal)", color: "var(--signal-ink)", borderRadius: 6, fontWeight: 650 }}>Report an incident</Link></div>
    <div className="card"><h2>Trips</h2><Table rows={data?.trips ?? []} cols={[
      { key: "trip_id", label: "Trip" }, { key: "route_code", label: "Route" }, { key: "reg_number", label: "Bus" },
      { key: "scheduled_start", label: "Start", render: (r) => fmt(r.scheduled_start) }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} /></div>
    <div className="card"><h2>My incidents</h2><Table rows={data?.incidents ?? []} empty="You have not reported any incidents." cols={[
      { key: "incident_id", label: "#" }, { key: "incident_type", label: "Type" }, { key: "severity", label: "Severity", render: (r) => <Badge v={r.severity} /> },
      { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }, { key: "location_desc", label: "Location" }, { key: "reported_at", label: "Reported", render: (r) => fmt(r.reported_at) }]} /></div></>);
}
