"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Gem,
  RotateCcw,
  ScanSearch,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { StageBadge, Badge } from "@/components/Badge";
import { formatCurrency } from "@/lib/utils";
import type { LiveEvent } from "@/lib/event-types";

const MAX_BUFFER = 30;

interface Props {
  /** Recent events from the audit chain, server-rendered so the panel is never empty on load. */
  initialEvents?: LiveEvent[];
}

export function LiveActivityFeed({ initialEvents = [] }: Props) {
  const [events, setEvents] = useState<LiveEvent[]>(initialEvents);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const src = new EventSource("/api/events");
    src.onopen = () => setConnected(true);
    src.onerror = () => setConnected(false);
    src.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "connected") {
          setConnected(true);
          return;
        }
        // Dedupe: skip if we already have an event with the same ts +
        // type + stoneId (handles the rare race between hydration and SSE).
        setEvents((prev) => {
          const incomingKey = eventKey(data);
          if (prev.some((p) => eventKey(p) === incomingKey)) return prev;
          return [data, ...prev].slice(0, MAX_BUFFER);
        });
      } catch {
        /* ignore malformed event */
      }
    };
    return () => src.close();
  }, []);

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-iris-50 text-iris-600">
            <Activity className="w-3.5 h-3.5" />
          </span>
          Live activity
        </h2>
        <div
          className={`flex items-center gap-2 text-xs rounded-full px-3 py-1 transition border ${
            connected
              ? "bg-iris-50 border-iris-200 text-iris-700"
              : "bg-slate-100 border-slate-200 text-slate-500"
          }`}
        >
          {connected ? (
            <span className="live-dot h-2 w-2">
              <span />
            </span>
          ) : (
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
          )}
          <span className="font-semibold uppercase tracking-wider text-[10px]">
            {connected ? "Live" : "Connecting…"}
          </span>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 px-6 text-center">
          <Activity className="w-5 h-5 mx-auto text-slate-300 mb-2" />
          <div className="text-sm text-slate-600 font-medium mb-0.5">
            Waiting for activity
          </div>
          <div className="text-xs text-slate-500">
            Try registering a stone, scanning one, or running a QC — events
            appear here instantly.
          </div>
        </div>
      ) : (
        <div className="-mx-2 divide-y divide-slate-100">
          {events.map((e, i) => (
            <EventRow key={`${e.ts}-${i}`} event={e} fresh={i === 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function eventKey(e: LiveEvent): string {
  switch (e.type) {
    case "stone:advanced":
    case "stone:created":
    case "qc:inspected":
    case "stone:rework":
      return `${e.ts}:${e.type}:${e.stoneId}`;
    case "inventory:sold":
      return `${e.ts}:${e.type}:${e.itemId}`;
  }
}

function EventRow({ event, fresh }: { event: LiveEvent; fresh: boolean }) {
  const time = new Date(event.ts).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return (
    <div
      className={`flex items-center gap-3 px-2 py-2.5 text-sm rounded-lg transition hover:bg-slate-50 ${
        fresh ? "animate-[fadeIn_0.4s_ease-out]" : ""
      }`}
    >
      <div className="shrink-0">{eventIcon(event)}</div>
      <div className="flex-1 min-w-0">{eventBody(event)}</div>
      <span className="text-[11px] text-slate-400 shrink-0 font-mono tabular-nums">
        {time}
      </span>
    </div>
  );
}

function eventIcon(event: LiveEvent) {
  switch (event.type) {
    case "stone:advanced":
      return <ArrowRight className="w-4 h-4 text-iris-500" />;
    case "stone:created":
      return <Gem className="w-4 h-4 text-iris-500" />;
    case "qc:inspected":
      return event.recommendation === "PASS" ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : event.recommendation === "REWORK" ? (
        <AlertTriangle className="w-4 h-4 text-amber-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      );
    case "stone:rework":
      return <RotateCcw className="w-4 h-4 text-amber-600" />;
    case "inventory:sold":
      return <DollarSign className="w-4 h-4 text-emerald-600" />;
  }
}

function eventBody(event: LiveEvent) {
  switch (event.type) {
    case "stone:advanced":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/manufacturing/${event.stoneId}`}
            className="font-mono text-xs text-slate-700 hover:text-iris-600"
          >
            {event.qrCode}
          </Link>
          <StageBadge stage={event.from} />
          <ArrowRight className="w-3 h-3 text-slate-400" />
          <StageBadge stage={event.to} />
          {event.lossCt > 0 && (
            <span className="text-xs text-red-600">−{event.lossCt.toFixed(3)} ct</span>
          )}
          <span className="text-xs text-slate-500">by {event.actor}</span>
        </div>
      );
    case "stone:created":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-700">Registered</span>
          <Link
            href={`/manufacturing/${event.stoneId}`}
            className="font-mono text-xs hover:text-iris-600"
          >
            {event.qrCode}
          </Link>
          <span className="text-xs text-slate-500">
            {event.startWeightCt.toFixed(2)} ct · by {event.actor}
          </span>
        </div>
      );
    case "qc:inspected":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <ScanSearch className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href={`/manufacturing/${event.stoneId}`}
            className="font-mono text-xs hover:text-iris-600"
          >
            {event.qrCode}
          </Link>
          <Badge
            tone={
              event.recommendation === "PASS"
                ? "green"
                : event.recommendation === "REWORK"
                ? "amber"
                : "red"
            }
          >
            {event.recommendation}
          </Badge>
          <span className="text-xs text-slate-500">score {Math.round(event.score)}</span>
        </div>
      );
    case "stone:rework":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/manufacturing/${event.stoneId}`}
            className="font-mono text-xs text-slate-700 hover:text-iris-600"
          >
            {event.qrCode}
          </Link>
          <Badge tone="amber">REWORK #{event.reworkCount}</Badge>
          <span className="text-xs text-slate-600">
            sent back from <span className="font-semibold">{event.fromStage}</span> → POLISHING
          </span>
          <span className="text-xs text-slate-500">score {Math.round(event.score)}</span>
        </div>
      );
    case "inventory:sold":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-700">Sold</span>
          <Link
            href={`/inventory/${event.itemId}`}
            className="font-mono text-xs hover:text-iris-600"
          >
            {event.sku}
          </Link>
          <span className="text-xs font-semibold text-emerald-700">
            {formatCurrency(event.totalPrice)}
          </span>
        </div>
      );
  }
}
