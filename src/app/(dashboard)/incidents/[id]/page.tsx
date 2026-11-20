"use client";
import { use, useState } from "react";
import { Badge, Msg, Table, fmt, send, useApi } from "@/components/ui";

export default function IncidentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, error, reload } = useApi(`/api/incidents/${id}`);
  const [res, setRes] = useState<{ err?: string; good?: string }>({});
  const done = (r: { ok: boolean; data: any }, good: string) => { setRes(r.ok ? { good } : { err: r.data.error }); reload(); };
  if (!data) return <Msg error={error || "Loading..."} />;
  const i = data.incident; const rep = data.report; const open = i.status === "REPORTED" || i.status === "IN_PROGRESS";
  return (<>
    <h1>Incident #{i.incident_id}</h1>
    <p className="sub"><Badge v={i.incident_type} /> <Badge v={i.severity} /> <Badge v={i.status} /> on {i.route_code}, bus {i.reg_number}, driver {i.driver_name}</p>
    <Msg error={res.err} good={res.good} />
    <div className="card"><h2>Details</h2><p>{i.description}</p><p className="hint">Location: {i.location_desc}. Reported {fmt(i.reported_at)}. Resolved {fmt(i.resolved_at)}.</p></div>
    {open && <div className="card"><h2>Assign maintenance</h2>
      <form className="f" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); done(await send(`/api/incidents/${id}/assign`, "POST", { description: f.get("d"), cost: Number(f.get("c")) }), "Maintenance assigned."); }}>
        <label className="wide">Work to be done<input name="d" required minLength={5} /></label><label>Estimated cost (INR)<input name="c" type="number" min={0} step="0.01" defaultValue={0} required /></label>
        <button className="btn">Assign maintenance</button></form>
      <div className="row" style={{ marginTop: 14 }}><button className="btn ghost" onClick={async () => done(await send(`/api/incidents/${id}/resolve`, "POST"), "Incident resolved.")}>Mark resolved</button></div></div>}
    <div className="cols">
      <div className="card"><h2>Status history</h2><ul className="timeline">{data.log.map((l: any, n: number) => <li key={n}>{l.old_status ? `${l.old_status.toLowerCase()} to ` : "reported as "}<b>{l.new_status.toLowerCase()}</b><br /><span className="hint">{fmt(l.changed_at)}</span></li>)}</ul></div>
      <div className="card"><h2>Maintenance actions</h2><Table rows={data.actions} empty="None yet." cols={[{ key: "action_desc", label: "Work", wrap: true }, { key: "cost", label: "Cost" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} /></div>
    </div>
    <div className="card"><h2>Detail report (MongoDB)</h2>
      {!rep ? <p className="empty">{data.mongoAvailable ? "No detail report was saved for this incident." : "MongoDB is not reachable right now."}</p> : <>
        <form className="f" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); done(await send(`/api/incidents/${id}/report`, "PUT", { narrative: f.get("n"), tags: String(f.get("t")).split(",").map((x) => x.trim().toLowerCase()).filter(Boolean) }), "Report updated."); }}>
          <label className="wide">Narrative<textarea name="n" defaultValue={rep.narrative} minLength={10} required /></label>
          <label className="wide">Tags<input name="t" defaultValue={(rep.tags ?? []).join(", ")} /></label>
          <button className="btn">Save report</button></form>
        <h2 style={{ marginTop: 20 }}>Comments</h2>
        <ul className="timeline">{(rep.comments ?? []).map((c: any, n: number) => <li key={n}>{c.text}<br /><span className="hint">user #{c.by}, {fmt(c.at)}</span></li>)}</ul>
        <form className="row" onSubmit={async (e) => { e.preventDefault(); const f = new FormData(e.currentTarget); const r = await send(`/api/incidents/${id}/comments`, "POST", { text: f.get("c") }); (e.target as HTMLFormElement).reset(); done(r, "Comment added."); }}>
          <input name="c" style={{ maxWidth: 380 }} required minLength={2} aria-label="Comment" placeholder="Add a comment" /><button className="btn">Add comment</button></form>
        <div className="row" style={{ marginTop: 14 }}><button className="btn danger" onClick={async () => { if (confirm("Delete this detail report? Admin only.")) done(await send(`/api/incidents/${id}/report`, "DELETE"), "Report deleted."); }}>Delete detail report</button></div></>}
    </div></>);
}
