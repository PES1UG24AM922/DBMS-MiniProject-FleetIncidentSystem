"use client";
import { useState } from "react";
import { Badge, Msg, Table, send, useApi } from "@/components/ui";
import { useRole } from "@/components/RoleProvider";

export default function Buses() {
  const role = useRole();
  const [status, setStatus] = useState("");
  const { data, error, reload } = useApi<any[]>(`/api/buses${status ? `?status=${status}` : ""}`);
  const [res, setRes] = useState<{ err?: string; good?: string }>({});
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await send("/api/buses", "POST", { regNumber: f.get("reg"), model: f.get("model"), capacity: Number(f.get("cap")), purchaseDate: f.get("date"), fuelType: f.get("fuel") });
    if (r.ok) { setRes({ good: "Bus added." }); (e.target as HTMLFormElement).reset(); reload(); } else setRes({ err: r.data.error });
  }
  async function setBusStatus(id: number, s: string) {
    const r = await send(`/api/buses/${id}`, "PUT", { status: s });
    setRes(r.ok ? { good: "Status updated." } : { err: r.data.error }); reload();
  }
  async function remove(id: number) {
    if (!confirm("Delete this bus? This cannot be undone.")) return;
    const r = await send(`/api/buses/${id}`, "DELETE");
    setRes(r.ok ? { good: "Bus deleted." } : { err: r.data.error }); reload();
  }
  return (<>
    <h1>Buses</h1><p className="sub">Register vehicles and track their availability.</p>
    <Msg error={res.err ?? error} good={res.good} />
    <div className="card"><h2>Add a bus</h2>
      <form className="f" onSubmit={add}>
        <label>Registration<input name="reg" required minLength={5} placeholder="KA01F1004" /></label>
        <label>Model<input name="model" required /></label>
        <label>Capacity<input name="cap" type="number" min={10} max={120} required /></label>
        <label>Purchase date<input name="date" type="date" required /></label>
        <label>Fuel<select name="fuel"><option>DIESEL</option><option>CNG</option><option>ELECTRIC</option></select></label>
        <button className="btn">Add bus</button>
      </form></div>
    <div className="card">
      <div className="row"><label>Filter by status<select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="">All</option><option>AVAILABLE</option><option>ON_TRIP</option><option>MAINTENANCE</option><option>RETIRED</option></select></label></div>
      <Table rows={data ?? []} cols={[
        { key: "reg_number", label: "Bus" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> },
        { key: "completed_trips", label: "Completed trips" }, { key: "incident_count", label: "Incidents" },
        { key: "act", label: "Actions", render: (r) => (<span className="row" style={{ margin: 0 }}>
          <select aria-label="Change status" value={r.status} onChange={(e) => setBusStatus(r.bus_id, e.target.value)}>
            <option>AVAILABLE</option><option>ON_TRIP</option><option>MAINTENANCE</option><option>RETIRED</option></select>
          {role === "ADMIN" && <button className="btn danger" onClick={() => remove(r.bus_id)}>Delete</button>}</span>) }]} />
    </div></>);
}
