"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectPlanButton({
  planId,
  roughId,
  selected,
}: {
  planId: string;
  roughId: string;
  selected: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function select() {
    setBusy(true);
    await fetch(`/api/yield/rough/${roughId}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId }),
    });
    setBusy(false);
    router.refresh();
  }

  if (selected) {
    return <button disabled className="btn-secondary w-full text-xs">Selected plan</button>;
  }

  return (
    <button onClick={select} disabled={busy} className="btn-primary w-full text-xs">
      {busy ? "..." : "Choose this plan"}
    </button>
  );
}
