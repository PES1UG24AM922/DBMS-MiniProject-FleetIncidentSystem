"use client";
import { Bars, Msg, Table, useApi } from "@/components/ui";

export default function Dashboard() {
  const { data, error, loading } = useApi("/api/dashboard/stats");
  if (loading) return <p>Loading overview...</p>;
  if (!data) return <Msg error={error} />;
  const k = data.kpi;
  return (<>
    <h1>Overview</h1>
    <p className="sub">Fleet status and incident activity across all routes.</p>
    <div className="grid">
      <div className="kpi"><b>{k.available}/{k.buses}</b><span>Buses available</span></div>
      <div className={`kpi ${k.open_incidents > 0 ? "hot" : ""}`}><b>{k.open_incidents}</b><span>Open incidents</span></div>
      <div className="kpi"><b>{k.total_incidents}</b><span>Incidents on record</span></div>
      <div className="kpi"><b>{k.avg_resolution_hrs ?? "-"}</b><span>Average hours to resolve</span></div>
    </div>
    <div className="cols">
      <div className="card"><h2>Incidents by severity</h2><Bars hot items={data.bySeverity.map((s: any) => ({ label: s.severity.toLowerCase(), n: s.n }))} /></div>
      <div className="card"><h2>Incidents per route</h2><Bars items={data.routes.map((r: any) => ({ label: r.route_code, n: r.total_incidents }))} /></div>
    </div>
    <div className="card"><h2>Route performance</h2>
      <Table rows={data.routes} cols={[
        { key: "route_code", label: "Route" }, { key: "route_name", label: "Name" }, { key: "total_trips", label: "Trips" },
        { key: "total_incidents", label: "Incidents" }, { key: "incidents_per_trip", label: "Per trip" }, { key: "avg_resolution_hrs", label: "Avg hours to resolve" }]} />
    </div>
    <div className="card"><h2>Fleet utilisation</h2>
      <Table rows={data.fleet} cols={[{ key: "reg_number", label: "Bus" }, { key: "status", label: "Status" }, { key: "completed_trips", label: "Completed trips" }, { key: "incident_count", label: "Incidents" }]} />
    </div>
    <div className="cols">
      <div className="card"><h2>Most common problem tags</h2>
        {data.mongoAvailable ? <Bars items={(data.topTags ?? []).map((t: any) => ({ label: t._id, n: t.count }))} /> : <p className="empty">MongoDB is not reachable, so tag statistics are unavailable.</p>}</div>
      <div className="card"><h2>Overheating alerts (engine above 110 C)</h2>
        {data.mongoAvailable ? <Table rows={data.overheating ?? []} empty="No overheating readings." cols={[{ key: "_id", label: "Bus id" }, { key: "alerts", label: "Alerts" }, { key: "maxTemp", label: "Peak C" }]} /> : <p className="empty">MongoDB is not reachable, so telemetry is unavailable.</p>}</div>
    </div>
  </>);
}
