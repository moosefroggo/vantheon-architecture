import { describe, expect, it } from "vitest";

import type { ChartPoint } from "@/lib/charts/contracts";
import { normalizeChartPoints } from "@/lib/charts/normalization";

describe("normalizeChartPoints", () => {
  it("sorts, de-duplicates, bounds, and preserves zero separately from missing", () => {
    const points: ChartPoint[] = [
      { timestamp: "2026-07-03T00:00:00Z", value: 3, quality: "confirmed" },
      { timestamp: "not-a-time", value: 99, quality: "confirmed" },
      { timestamp: "2026-07-01T00:00:00Z", value: 1, quality: "confirmed" },
      { timestamp: "2026-07-02T00:00:00Z", value: 2, quality: "confirmed" },
      { timestamp: "2026-07-02T00:00:00.000Z", value: 0, quality: "confirmed" },
      { timestamp: "2026-07-04T00:00:00Z", value: null, quality: "estimated" },
    ];

    const normalized = normalizeChartPoints(points, 3);

    expect(normalized.map((point) => point.timestamp)).toEqual([
      "2026-07-02T00:00:00.000Z",
      "2026-07-03T00:00:00.000Z",
      "2026-07-04T00:00:00.000Z",
    ]);
    expect(normalized[0]).toMatchObject({ value: 0, quality: "confirmed" });
    expect(normalized[2]).toMatchObject({ value: null, quality: "missing" });
  });
});
