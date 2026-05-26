"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleListingForm({ itemId, listed, listPrice }: { itemId: string; listed: boolean; listPrice: number }) {
  const router = useRouter();
  const [price, setPrice] = useState(String(listPrice));
  const [busy, setBusy] = useState(false);

  async function action(listIt: boolean) {
    setBusy(true);
    await fetch(`/api/inventory/${itemId}/listing`, {
      method: listIt ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: listIt ? JSON.stringify({ listPrice: parseFloat(price) }) : undefined,
    });
    setBusy(false);
    router.refresh();
  }

  if (listed) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-slate-500">Currently listed on the marketplace.</p>
        <button onClick={() => action(false)} disabled={busy} className="btn-secondary w-full text-xs">
          {busy ? "..." : "Remove from marketplace"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        action(true);
      }}
      className="space-y-2 text-sm"
    >
      <input
        type="number"
        step="1"
        min="0"
        className="input"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Asking price"
        required
      />
      <button className="btn-primary w-full text-xs" disabled={busy}>
        {busy ? "Publishing..." : "Publish listing"}
      </button>
    </form>
  );
}

export function MarkSoldForm({ itemId, sold }: { itemId: string; sold: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function action(newStatus: "SOLD" | "IN_STOCK") {
    setBusy(true);
    await fetch(`/api/inventory/${itemId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  if (sold) {
    return (
      <button onClick={() => action("IN_STOCK")} disabled={busy} className="btn-secondary w-full text-xs">
        Mark as available
      </button>
    );
  }
  return (
    <button onClick={() => action("SOLD")} disabled={busy} className="btn-primary w-full text-xs">
      {busy ? "..." : "Mark as sold"}
    </button>
  );
}
