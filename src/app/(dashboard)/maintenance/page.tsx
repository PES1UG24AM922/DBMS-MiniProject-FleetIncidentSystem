"use client";
import { Badge, Msg, Table, fmt, useApi } from "@/components/ui";
import Link from "next/link";

export default function Maintenance() {
  const { data, error } = useApi<any[]>("/api/maintenance");
  return (<>
    <h1>Maintenance</h1><p className="sub">Repair actions raised from incidents. Assign new actions from an incident page.</p>
    <Msg error={error} />
    <div className="card"><Table rows={data ?? []} empty="No maintenance actions yet." cols={[
      { key: "action_id", label: "Action" }, { key: "incident_id", label: "Incident", render: (r) => <Link href={`/incidents/${r.incident_id}`}>#{r.incident_id}</Link> },
      { key: "reg_number", label: "Bus" }, { key: "action_desc", label: "Work", wrap: true }, { key: "cost", label: "Cost (INR)" },
      { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }, { key: "created_at", label: "Raised", render: (r) => fmt(r.created_at) }]} /></div></>);
}
