"use client";
import { useState } from "react";
import { Badge, Msg, Table, send, useApi } from "@/components/ui";

export default function Drivers() {
  const { data, error, reload } = useApi<any[]>("/api/drivers");
  const [res, setRes] = useState<{ err?: string; good?: string }>({});
  async function add(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const r = await send("/api/drivers", "POST", { fullName: f.get("name"), licenseNo: f.get("lic"), phone: f.get("phone"), experienceYears: Number(f.get("exp")) });
    if (r.ok) { setRes({ good: "Driver added." }); (e.target as HTMLFormElement).reset(); reload(); } else setRes({ err: r.data.error });
  }
  return (<>
    <h1>Drivers</h1><p className="sub">Only administrators can add drivers.</p>
    <Msg error={res.err ?? error} good={res.good} />
    <div className="card"><h2>Add a driver</h2>
      <form className="f" onSubmit={add}>
        <label>Full name<input name="name" required /></label>
        <label>Licence number<input name="lic" required minLength={6} /></label>
        <label>Mobile number<input name="phone" required pattern="[6-9][0-9]{9}" title="10-digit mobile number" /></label>
        <label>Experience (years)<input name="exp" type="number" min={0} max={50} required /></label>
        <button className="btn">Add driver</button>
      </form></div>
    <div className="card"><Table rows={data ?? []} cols={[
      { key: "full_name", label: "Name" }, { key: "license_no", label: "Licence" }, { key: "phone", label: "Mobile" },
      { key: "experience_years", label: "Years" }, { key: "status", label: "Status", render: (r) => <Badge v={r.status} /> }]} /></div></>);
}
