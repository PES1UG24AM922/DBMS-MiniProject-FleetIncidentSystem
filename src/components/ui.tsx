"use client";
import { useCallback, useEffect, useState } from "react";

export const Badge = ({ v }: { v: string }) => <span className={`badge s-${v}`}>{v.replace("_", " ").toLowerCase()}</span>;
export const fmt = (v: any) => (v ? new Date(v).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

export function useApi<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    const r = await fetch(url);
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setError(j.error ?? "Request failed"); setData(null); } else { setError(""); setData(j); }
    setLoading(false);
  }, [url]);
  useEffect(() => { load(); }, [load]);
  return { data, error, loading, reload: load };
}

export async function send(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  const details = data.details ? " " + Object.entries(data.details).map(([k, v]) => `${k}: ${(v as string[]).join(", ")}`).join("; ") : "";
  return { ok: r.ok, data: r.ok ? data : { ...data, error: (data.error ?? "Request failed") + details } };
}

export function Msg({ error, good }: { error?: string; good?: string }) {
  if (error) return <p className="msg err" role="alert">{error}</p>;
  if (good) return <p className="msg good" role="status">{good}</p>;
  return null;
}

export function Table({ cols, rows, empty = "Nothing here yet." }: { cols: { key: string; label: string; render?: (r: any) => React.ReactNode; wrap?: boolean }[]; rows: any[]; empty?: string }) {
  if (!rows.length) return <p className="empty">{empty}</p>;
  return (
    <div className="tablewrap"><table>
      <thead><tr>{cols.map((c) => <th key={c.key}>{c.label}</th>)}</tr></thead>
      <tbody>{rows.map((r, i) => (<tr key={i}>{cols.map((c) => <td key={c.key} className={c.wrap ? "wrap" : ""}>{c.render ? c.render(r) : String(r[c.key] ?? "-")}</td>)}</tr>))}</tbody>
    </table></div>
  );
}

export function Bars({ items, hot }: { items: { label: string; n: number }[]; hot?: boolean }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  if (!items.length) return <p className="empty">No data yet.</p>;
  return (<div className="bars">{items.map((i) => (
    <div className="bar" key={i.label}><span>{i.label}</span><i className={hot ? "warn" : ""} style={{ width: `${(i.n / max) * 100}%` }} /><b>{i.n}</b></div>
  ))}</div>);
}
