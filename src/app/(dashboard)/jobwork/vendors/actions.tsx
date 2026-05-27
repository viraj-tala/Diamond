"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TextInput } from "@/components/Form";

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
    setName("");
    setContact("");
    setPhone("");
    setAddress("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-2 text-sm">
      <TextInput
        value={name}
        onChange={setName}
        placeholder="Vendor name"
        required
        monospace={false}
      />
      <TextInput
        value={contact}
        onChange={setContact}
        placeholder="Contact person"
        monospace={false}
      />
      <TextInput
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="Phone"
        monospace={false}
      />
      <TextInput
        value={address}
        onChange={setAddress}
        placeholder="Address"
        monospace={false}
      />
      {err && <div className="text-xs text-red-600">{err}</div>}
      <button className="btn-primary w-full text-xs" disabled={busy}>
        {busy ? "Saving..." : "Add vendor"}
      </button>
    </form>
  );
}
