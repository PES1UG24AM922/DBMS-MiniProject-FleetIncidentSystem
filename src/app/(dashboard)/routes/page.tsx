"use client";
import { useState } from "react";
import { Msg, Table, send, useApi } from "@/components/ui";
import { useRole } from "@/components/RoleProvider";

export default function RoutesPage() {
  const role = useRole();
  const { data, error, reload } = useApi<any[]>("/api/routes");
  const [res, setRes] = useState<{ err?: string; good?: string }>({});
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await send("/api/routes", "POST", { routeCode: f.get("code"), routeName: f.get("name"), origin: f.get("origin"), destination: f.get("dest"), distanceKm: Number(f.get("km")) });
    if (r.ok) { setRes({ good: "Route added." }); (e.target as HTMLFormElement).reset(); reload(); } else setRes({ err: r.data.error });
  }
  return (<>
    <h1>Routes</h1><p className="sub">Each route lists its stops in running order.</p>
    <Msg error={res.err ?? error} good={res.good} />
    {role !== "DRIVER" && <div className="card"><h2>Add a route</h2>
      <form className="f" onSubmit={add}>
        <label>Code<input name="code" required minLength={2} placeholder="R303" /></label>
        <label>Name<input name="name" required /></label>
        <label>Origin<input name="origin" required /></label>
        <label>Destination<input name="dest" required /></label>
        <label>Distance (km)<input name="km" type="number" step="0.1" min={0.1} required /></label>
        <button className="btn">Add route</button>
      </form></div>}
    <div className="card"><Table rows={data ?? []} cols={[
      { key: "route_code", label: "Code" }, { key: "route_name", label: "Name" }, { key: "distance_km", label: "Km" }, { key: "stops", label: "Stops", wrap: true }]} /></div></>);
}
