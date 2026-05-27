import { EventEmitter } from "node:events";
import type { LiveEvent } from "@/lib/event-types";

export type { LiveEvent } from "@/lib/event-types";

declare global {
  // eslint-disable-next-line no-var
  var __eventBus: EventEmitter | undefined;
}

// In dev, HMR re-evaluates the module on every change. Bind the emitter to
// globalThis so listeners survive hot reload and stay connected to the SSE
// subscribers attached at first load.
export const eventBus =
  global.__eventBus ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(1000);
    return e;
  })();

if (process.env.NODE_ENV !== "production") global.__eventBus = eventBus;

// Distributive Omit so each branch of LiveEvent keeps its own discriminator.
type EmitInput = LiveEvent extends infer E
  ? E extends { ts: string }
    ? Omit<E, "ts"> & { ts?: string }
    : never
  : never;

export function emit(event: EmitInput) {
  const full = { ...event, ts: event.ts ?? new Date().toISOString() } as LiveEvent;
  eventBus.emit("event", full);
}
