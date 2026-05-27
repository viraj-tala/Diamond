"use client";

import { useEffect, useState } from "react";
import { TextInput } from "@/components/Form";
import { formatDateTime } from "@/lib/utils";

interface Device {
  id: string;
  name: string;
  location: string | null;
  active: boolean;
  lastSeenAt: string | null;
  createdAt: string;
}

export function DevicesPanel() {
  const [items, setItems] = useState<Device[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);
  const [newToken, setNewToken] = useState<{ name: string; token: string } | null>(null);

  async function refresh() {
    const res = await fetch("/api/devices");
    if (res.status === 401 || res.status === 403) {
      setErr("Admins only");
      setItems([]);
      return;
    }
    const d = await res.json();
    setItems(d.items ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createDevice(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/devices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, location: location || undefined }),
    });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(d.error ?? "Failed");
      return;
    }
    setNewToken({ name: d.name, token: d.token });
    setName("");
    setLocation("");
    refresh();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this device? Its token will stop working.")) return;
    const res = await fetch(`/api/devices/${id}/revoke`, { method: "POST" });
    if (res.ok) refresh();
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">IoT devices</h2>
        <span className="text-xs text-slate-400">ESP32 readers, USB scanners on Pi, etc.</span>
      </div>

      {newToken && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">
          <div className="font-semibold text-amber-900">
            Token for {newToken.name} (shown ONCE — copy now)
          </div>
          <div className="mt-2 font-mono text-xs break-all bg-white border border-amber-200 rounded p-2 select-all">
            {newToken.token}
          </div>
          <button
            className="mt-2 text-xs text-amber-900 underline"
            onClick={() => setNewToken(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <form onSubmit={createDevice} className="flex flex-wrap gap-2 items-end mb-4 text-sm">
        <div className="flex-1 min-w-[160px]">
          <label className="label">Name</label>
          <TextInput
            value={name}
            onChange={setName}
            placeholder="Polishing station 3"
            required
            monospace={false}
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="label">Location</label>
          <TextInput
            value={location}
            onChange={setLocation}
            placeholder="Floor 2 / east wing"
            monospace={false}
          />
        </div>
        <button className="btn-primary text-sm" disabled={busy || !name}>
          {busy ? "Adding..." : "+ Device"}
        </button>
      </form>

      {err && <div className="text-xs text-red-600 mb-2">{err}</div>}

      {items === null ? (
        <div className="text-xs text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-slate-500 py-4 text-center">No devices yet.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Location</th>
                <th>Last seen</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td className="text-xs">{d.location ?? "—"}</td>
                  <td className="text-xs text-slate-500">
                    {d.lastSeenAt ? formatDateTime(d.lastSeenAt as unknown as Date) : "never"}
                  </td>
                  <td>
                    <span
                      className={
                        d.active
                          ? "text-xs text-emerald-700"
                          : "text-xs text-slate-400"
                      }
                    >
                      {d.active ? "active" : "revoked"}
                    </span>
                  </td>
                  <td>
                    {d.active && (
                      <button
                        onClick={() => revoke(d.id)}
                        className="text-xs text-red-600 font-medium"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
