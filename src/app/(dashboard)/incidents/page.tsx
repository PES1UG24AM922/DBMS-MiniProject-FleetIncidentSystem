"use client";
import { useState } from "react";
import Link from "next/link";
import { Badge, Msg, Table, fmt, send, useApi } from "@/components/ui";

export default function Incidents() {
  const [f, setF] = useState({ status: "", severity: "", type: "" });
  const qs = new URLSearchParams(Object.entries(f).filter(([, v]) => v)).toString();
  const { data, error } = useApi<any[]>(`/api/incidents${qs ? `?${qs}` : ""}`);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<any>(null);
  const [serr, setSerr] = useState("");
  async function search(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch(`/api/incidents/search?q=${encodeURIComponent(term)}`);
    const j = await r.json();
    if (!r.ok) { setSerr(j.error); setHits(null); } else { setSerr(""); setHits(j); }
  }
  const sel = (k: keyof typeof f, label: string, opts: string[]) => (
    <label>{label}<select value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">All</option>{opts.map((o) => <option key={o}>{o}</option>)}</select></label>);
  return (<>
    <h1>Incidents</h1><p className="sub">Every reported incident, newest first. Search finds matches in descriptions and locations.</p>
    <div className="card"><h2>Search past incidents</h2>
      <form className="row" onSubmit={search}><input style={{ maxWidth: 320 }} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="for example: brake failure" aria-label="Search" /><button className="btn">Search</button></form>
      <Msg error={serr} />
      {hits && <>
        <Table rows={hits.sql} empty="No matching incidents." cols={[
          { key: "incident_id", label: "#", render: (r) => <Link href={`/incidents/${r.incident_id}`}>#{r.incident_id}</Link> }, { key: "incident_type", label: "Type" },
          { key: "location_desc", label: "Location" }, { key: "score", label: "Relevance", render: (r) => Number(r.score).toFixed(2) }]} />
        <p className="hint">{hits.mongoAvailable ? `Detail reports also matching in MongoDB: ${hits.mongo.map((m: any) => "#" + m.incident_id).join(", ") || "none"}` : "MongoDB is not reachable, so detail-report matches are not included."}</p></>}
    </div>
    <div className="card">
      <div className="row">{sel("status", "Status", ["REPORTED", "IN_PROGRESS", "RESOLVED", "CLOSED"])}{sel("severity", "Severity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"])}{sel("type", "Type", ["BREAKDOWN", "ACCIDENT", "DELAY", "OVERCROWDING", "COMPLAINT"])}</div>
      <Msg error={error} />
      <Table rows={data ?? []} cols={[
        { key: "incident_id", label: "#", render: (r) => <Link href={`/incidents/${r.incident_id}`}>#{r.incident_id}</Link> }, { key: "incident_type", label: "Type" },
        { key: "severity", label: "Severity", render: (r) => <Badge v={r.severity} /> }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> },
        { key: "reg_number", label: "Bus" }, { key: "route_code", label: "Route" }, { key: "driver_name", label: "Driver" }, { key: "reported_at", label: "Reported", render: (r) => fmt(r.reported_at) }]} />
    </div></>);
}
