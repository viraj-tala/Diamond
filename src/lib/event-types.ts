// Shared between server (event-bus.ts emitters) and client (LiveActivityFeed,
// LiveStats). Kept node-import-free so it's safe to use from "use client" files.

export type LiveEvent =
  | {
      type: "stone:advanced";
      stoneId: string;
      qrCode: string;
      from: string;
      to: string;
      weightAfter: number;
      lossCt: number;
      actor: string;
      ts: string;
    }
  | {
      type: "stone:created";
      stoneId: string;
      qrCode: string;
      startWeightCt: number;
      actor: string;
      ts: string;
    }
  | {
      type: "qc:inspected";
      stoneId: string;
      qrCode: string;
      recommendation: "PASS" | "REWORK" | "REJECT";
      score: number;
      ts: string;
    }
  | {
      type: "stone:rework";
      stoneId: string;
      qrCode: string;
      fromStage: string;
      reworkCount: number;
      score: number;
      actor: string;
      ts: string;
    }
  | {
      type: "inventory:sold";
      itemId: string;
      sku: string;
      totalPrice: number;
      caratWeight: number;
      ts: string;
    };
