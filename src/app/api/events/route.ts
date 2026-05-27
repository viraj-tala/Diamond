import { eventBus, type LiveEvent } from "@/lib/event-bus";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // SSE is session-only — IoT devices use their own scan endpoint, not this.
  const session = await getSession();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let onEvent: ((e: LiveEvent) => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          // controller already closed — listener will be detached by cancel()
        }
      };

      // Tell the client we're live.
      send(`data: ${JSON.stringify({ type: "connected", ts: new Date().toISOString() })}\n\n`);

      onEvent = (e: LiveEvent) => send(`data: ${JSON.stringify(e)}\n\n`);
      eventBus.on("event", onEvent);

      // Keepalive comment so intermediate proxies don't close the connection.
      heartbeat = setInterval(() => send(`: ping\n\n`), 25_000);

      // Detect client disconnect (browser tab closed, network drop).
      req.signal.addEventListener("abort", () => {
        cleanup();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
    cancel() {
      cleanup();
    },
  });

  function cleanup() {
    if (onEvent) {
      eventBus.off("event", onEvent);
      onEvent = null;
    }
    if (heartbeat) {
      clearInterval(heartbeat);
      heartbeat = null;
    }
  }

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
