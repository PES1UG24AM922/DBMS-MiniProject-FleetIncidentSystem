"use client";
import { useState } from "react";
import { Badge, Msg, Table, fmt, send, useApi } from "@/components/ui";

export default function Trips() {
  const trips = useApi<any[]>("/api/trips");
  const routes = useApi<any[]>("/api/routes");
  const buses = useApi<any[]>("/api/buses");
  const drivers = useApi<any[]>("/api/drivers");
  const [res, setRes] = useState<{ err?: string; good?: string }>({});
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await send("/api/trips", "POST", { routeId: Number(f.get("route")), busId: Number(f.get("bus")), driverId: Number(f.get("driver")), scheduledStart: f.get("start"), scheduledEnd: f.get("end") });
    if (r.ok) { setRes({ good: "Trip scheduled." }); trips.reload(); buses.reload(); } else setRes({ err: r.data.error });
  }
  return (<>
    <h1>Trips</h1><p className="sub">Assign a bus and a driver to a route. The database rejects double bookings and unavailable buses.</p>
    <Msg error={res.err ?? trips.error} good={res.good} />
    <div className="card"><h2>Schedule a trip</h2>
      <form className="f" onSubmit={add}>
        <label>Route<select name="route" required>{(routes.data ?? []).map((r) => <option key={r.route_id} value={r.route_id}>{r.route_code} - {r.route_name}</option>)}</select></label>
        <label>Bus<select name="bus" required>{(buses.data ?? []).map((b) => <option key={b.bus_id} value={b.bus_id}>{b.reg_number} ({b.status.toLowerCase()})</option>)}</select></label>
        <label>Driver<select name="driver" required>{(drivers.data ?? []).map((d) => <option key={d.driver_id} value={d.driver_id}>{d.full_name}</option>)}</select></label>
        <label>Start<input name="start" type="datetime-local" required /></label>
        <label>End<input name="end" type="datetime-local" required /></label>
        <button className="btn">Schedule trip</button>
      </form></div>
    <div className="card"><Table rows={trips.data ?? []} cols={[
      { key: "trip_id", label: "Trip" }, { key: "route_code", label: "Route" }, { key: "reg_number", label: "Bus" }, { key: "driver", label: "Driver" },
      { key: "scheduled_start", label: "Start", render: (r) => fmt(r.scheduled_start) }, { key: "scheduled_end", label: "End", render: (r) => fmt(r.scheduled_end) },
      { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} /></div></>);
}
