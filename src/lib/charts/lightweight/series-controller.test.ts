import { describe, expect, it } from "vitest";

import type { ChartPoint } from "@/lib/charts/contracts";
import { BoundedSeriesController } from "@/lib/charts/lightweight/series-controller";

const point = (day: number, value: number): ChartPoint => ({
  timestamp: `2026-07-${String(day).padStart(2, "0")}T00:00:00.000Z`,
  value,
  quality: "confirmed",
});

describe("BoundedSeriesController", () => {
  it("uses terminal updates until the bound requires a replacement", () => {
    const controller = new BoundedSeriesController(3);
    controller.replace([point(1, 1), point(2, 2)]);

    expect(controller.apply(point(3, 3))).toMatchObject({ kind: "update" });
    expect(controller.apply(point(4, 4))).toMatchObject({ kind: "replace" });
    expect(controller.points.map((item) => item.value)).toEqual([2, 3, 4]);
  });

  it("replaces a corrected historical point but updates the terminal point", () => {
    const controller = new BoundedSeriesController(4);
    controller.replace([point(1, 1), point(2, 2), point(3, 3)]);

    expect(controller.apply(point(2, 20))).toMatchObject({ kind: "replace" });
    expect(controller.apply(point(3, 30))).toMatchObject({ kind: "update" });
    expect(controller.points.map((item) => item.value)).toEqual([1, 20, 30]);
  });
});
