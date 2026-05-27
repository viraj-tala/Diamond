"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Factory,
  Gem,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { LiveEvent } from "@/lib/event-types";

export interface InitialStats {
  rough: number;
  totalStones: number;
  active: number;
  inventory: {
    count: number;
    totalPrice: number;
    caratWeight: number;
  };
  workers: number;
  qc: {
    pass: number;
    rework: number;
    reject: number;
  };
}

type CardKey =
  | "active"
  | "inventoryCount"
  | "inventoryValue"
  | "qcPass"
  | "qcRework"
  | "qcReject";

export function LiveStats({ initial }: { initial: InitialStats }) {
  const [stats, setStats] = useState<InitialStats>(initial);
  const [flashing, setFlashing] = useState<Set<CardKey>>(new Set());
  const flashTimers = useRef<Map<CardKey, ReturnType<typeof setTimeout>>>(new Map());

  function flash(key: CardKey) {
    setFlashing((prev) => {
      const next = new Set(prev);
      next.add(key);
      return next;
    });
    const prevTimer = flashTimers.current.get(key);
    if (prevTimer) clearTimeout(prevTimer);
    const timer = setTimeout(() => {
      setFlashing((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      flashTimers.current.delete(key);
    }, 1500);
    flashTimers.current.set(key, timer);
  }

  useEffect(() => {
    const src = new EventSource("/api/events");
    src.onmessage = (e) => {
      let data: LiveEvent | { type: "connected" };
      try {
        data = JSON.parse(e.data);
      } catch {
        return;
      }
      if (data.type === "connected") return;

      setStats((s) => applyEvent(s, data, flash));
    };
    return () => {
      src.close();
      for (const t of flashTimers.current.values()) clearTimeout(t);
      flashTimers.current.clear();
    };
  }, []);

  const cardClass = (key: CardKey) =>
    flashing.has(key)
      ? "transition-shadow duration-300 shadow-[0_0_0_3px_rgba(79,70,229,0.18)]"
      : "transition-shadow duration-700";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <StatCard label="Rough stones" value={stats.rough} icon={Gem} tone="brand" />
      <div className={cardClass("active")}>
        <StatCard
          label="Active in factory"
          value={stats.active}
          icon={Factory}
          tone="amber"
          hint={`${stats.totalStones} total`}
        />
      </div>
      <div className={cardClass("inventoryCount")}>
        <StatCard
          label="Inventory items"
          value={stats.inventory.count}
          icon={Boxes}
          tone="green"
          hint={`${formatNumber(stats.inventory.caratWeight)} ct`}
        />
      </div>
      <div className={cardClass("inventoryValue")}>
        <StatCard
          label="Inventory value"
          value={formatCurrency(stats.inventory.totalPrice)}
          icon={LineChart}
          tone="brand"
        />
      </div>
      <StatCard label="Workers" value={stats.workers} icon={Users} />
      <div className={cardClass("qcPass")}>
        <StatCard label="QC passes" value={stats.qc.pass} icon={ShieldCheck} tone="green" />
      </div>
      <div className={cardClass("qcRework")}>
        <StatCard
          label="QC reworks"
          value={stats.qc.rework}
          icon={AlertTriangle}
          tone="amber"
        />
      </div>
      <div className={cardClass("qcReject")}>
        <StatCard
          label="QC rejects"
          value={stats.qc.reject}
          icon={AlertTriangle}
          tone="red"
        />
      </div>
    </div>
  );
}

function applyEvent(
  s: InitialStats,
  event: LiveEvent,
  flash: (k: CardKey) => void,
): InitialStats {
  switch (event.type) {
    case "stone:created":
      flash("active");
      return {
        ...s,
        totalStones: s.totalStones + 1,
        active: s.active + 1,
      };
    case "stone:advanced":
      if (event.to === "COMPLETED") {
        flash("active");
        return { ...s, active: Math.max(0, s.active - 1) };
      }
      return s;
    case "stone:rework":
      // Rework regression: if the stone was COMPLETED, it's now active again.
      flash("active");
      if (event.fromStage === "COMPLETED") {
        return { ...s, active: s.active + 1 };
      }
      return s;
    case "qc:inspected":
      if (event.recommendation === "PASS") {
        flash("qcPass");
        return { ...s, qc: { ...s.qc, pass: s.qc.pass + 1 } };
      }
      if (event.recommendation === "REWORK") {
        flash("qcRework");
        return { ...s, qc: { ...s.qc, rework: s.qc.rework + 1 } };
      }
      flash("qcReject");
      return { ...s, qc: { ...s.qc, reject: s.qc.reject + 1 } };
    case "inventory:sold":
      flash("inventoryCount");
      flash("inventoryValue");
      return {
        ...s,
        inventory: {
          count: Math.max(0, s.inventory.count - 1),
          totalPrice: Math.max(0, s.inventory.totalPrice - event.totalPrice),
          caratWeight: Math.max(0, s.inventory.caratWeight - event.caratWeight),
        },
      };
  }
}
