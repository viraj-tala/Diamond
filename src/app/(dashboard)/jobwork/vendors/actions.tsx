"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AddVendorForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/jobwork/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, contact, phone, address }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setErr(d.error ?? "Failed");
      setBusy(false);
      return;
    }
    setName(""); setContact(""); setPhone(""); setAddress("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <input className="input" placeholder="Vendor name" value={name} onChange={(e) => setName(e.target.value)} required />
      <input className="input" placeholder="Contact person" value={contact} onChange={(e) => setContact(e.target.value)} />
      <input className="input" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      <input className="input" placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
      {err && <div className="text-xs text-red-600">{err}</div>}
      <button className="btn-primary w-full text-xs" disabled={busy}>{busy ? "Saving..." : "Add vendor"}</button>
    </form>
  );
}
