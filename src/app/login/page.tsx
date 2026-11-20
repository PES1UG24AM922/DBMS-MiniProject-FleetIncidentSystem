"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Msg, send } from "@/components/ui";

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    const r = await send("/api/auth/login", "POST", { username: f.get("username"), password: f.get("password") });
    setBusy(false);
    if (!r.ok) return setError(r.data.error);
    router.push(r.data.role === "DRIVER" ? "/my-trips" : "/dashboard");
    router.refresh();
  }
  return (
    <div className="login"><div className="card">
      <div className="strip" />
      <h1>Fleet &amp; Incident Console</h1>
      <p className="sub">Sign in to manage buses, trips and incidents.</p>
      <Msg error={error} />
      <form className="f" onSubmit={submit} style={{ gridTemplateColumns: "1fr" }}>
        <label>Username<input name="username" autoComplete="username" required minLength={3} /></label>
        <label>Password<input name="password" type="password" autoComplete="current-password" required minLength={6} /></label>
        <button className="btn" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
      </form>
      <p className="hint">Demo accounts: admin, manager1, ravi (driver). Password: Demo@1234</p>
    </div></div>
  );
}
