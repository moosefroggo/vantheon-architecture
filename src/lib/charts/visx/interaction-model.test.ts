import { describe, expect, it } from "vitest";

import type { ChartPoint } from "@/lib/charts/contracts";
import {
  nearestPointIndex,
  nextInspectionIndex,
} from "@/lib/charts/visx/interaction-model";

const points: ChartPoint[] = [
  { timestamp: "2026-07-01T00:00:00.000Z", value: 0, quality: "confirmed" },
  { timestamp: "2026-07-02T00:00:00.000Z", value: -2, quality: "confirmed" },
  { timestamp: "2026-07-03T00:00:00.000Z", value: -1, quality: "confirmed" },
];

describe("Visx inspection model", () => {
  it("supports bounded arrow, Home, and End navigation", () => {
    expect(nextInspectionIndex(0, 3, "ArrowLeft")).toBe(0);
    expect(nextInspectionIndex(0, 3, "ArrowRight")).toBe(1);
    expect(nextInspectionIndex(1, 3, "Home")).toBe(0);
    expect(nextInspectionIndex(1, 3, "End")).toBe(2);
  });

  it("selects the nearest deterministic observation for pointer inspection", () => {
    expect(nearestPointIndex(points, Date.parse("2026-07-02T08:00:00Z"))).toBe(1);
    expect(nearestPointIndex([], Date.parse("2026-07-02T08:00:00Z"))).toBe(-1);
  });
});
