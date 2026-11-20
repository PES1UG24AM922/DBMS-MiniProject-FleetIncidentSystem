"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Msg, send, fmt, useApi } from "@/components/ui";
import { useRole } from "@/components/RoleProvider";

export default function NewIncident() {
  const role = useRole();
  const router = useRouter();
  const staffTrips = useApi<any[]>(role === "DRIVER" ? null : "/api/trips");
  const myTrips = useApi<any>(role === "DRIVER" ? "/api/my" : null);
  const trips: any[] = role === "DRIVER" ? myTrips.data?.trips ?? [] : staffTrips.data ?? [];
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const tags = String(f.get("tags") ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    setBusy(true);
    const r = await send("/api/incidents", "POST", { tripId: Number(f.get("trip")), type: f.get("type"), severity: f.get("severity"), location: f.get("location"), description: f.get("desc"), tags });
    setBusy(false);
    if (!r.ok) return setErr(r.data.error);
    router.push(role === "DRIVER" ? "/my-trips" : `/incidents/${r.data.incidentId}`);
  }
  return (<>
    <h1>Report an incident</h1><p className="sub">Pick the trip it happened on. Bus and driver are filled in from the trip.</p>
    <Msg error={err} />
    <div className="card"><form className="f" onSubmit={submit}>
      <label>Trip<select name="trip" required>{trips.map((t) => <option key={t.trip_id} value={t.trip_id}>#{t.trip_id} - {t.route_code} - {t.reg_number} - {fmt(t.scheduled_start)}</option>)}</select></label>
      <label>Type<select name="type"><option>BREAKDOWN</option><option>ACCIDENT</option><option>DELAY</option><option>OVERCROWDING</option><option>COMPLAINT</option></select></label>
      <label>Severity<select name="severity"><option>LOW</option><option>MEDIUM</option><option>HIGH</option><option>CRITICAL</option></select></label>
      <label>Location<input name="location" required minLength={3} maxLength={150} /></label>
      <label className="wide">What happened<textarea name="desc" required minLength={10} maxLength={2000} /></label>
      <label className="wide">Tags (comma separated)<input name="tags" placeholder="brake, engine" /></label>
      <button className="btn" disabled={busy}>{busy ? "Submitting..." : "Submit report"}</button>
    </form></div></>);
}
