import crypto from "node:crypto";

// Deterministic stub that mimics an image-based defect detector.
// In production this would call an actual CV pipeline (YOLO / SAM / custom).
export function detectDefects(seed: string): {
  defects: string[];
  defectCount: number;
  overallScore: number;
  recommendation: "PASS" | "REWORK" | "REJECT";
} {
  const hash = crypto.createHash("sha256").update(seed).digest();
  const score = 35 + (hash[0] % 65);
  const possible = ["surface_scratch", "cloud_inclusion", "feather", "natural", "indented_natural", "extra_facet", "polish_mark"];
  const defects: string[] = [];
  const defectCount = hash[1] % 4;
  for (let i = 0; i < defectCount; i++) defects.push(possible[hash[2 + i] % possible.length]);
  const recommendation = score >= 80 ? "PASS" : score >= 55 ? "REWORK" : "REJECT";
  return { defects: Array.from(new Set(defects)), defectCount, overallScore: score, recommendation };
}
