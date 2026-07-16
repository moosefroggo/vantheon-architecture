import { describe, expect, it } from "vitest";

import {
  createDrawdownSummary,
  createDrawdownTable,
  createPortfolioEquitySummary,
  createPortfolioEquityTable,
} from "@/lib/charts/accessible-summary";
import {
  drawdownEvidenceFixture,
  portfolioEquityFixture,
} from "@/lib/charts/fixtures";
import {
  normalizeChartPoints,
  normalizeDrawdownPoints,
} from "@/lib/charts/normalization";

describe("accessible chart projections", () => {
  it("derives portfolio summary and table from the same bounded observations", () => {
    const model = portfolioEquityFixture;
    const points = normalizeChartPoints(model.series.points, model.maxPoints);
    const summary = createPortfolioEquitySummary(
      points,
      model.identity,
      model.freshness,
      model.range.timeZone,
    );
    const table = createPortfolioEquityTable(
      points,
      model.identity,
      model.range.timeZone,
      model.benchmark,
    );

    expect(summary.headline).toContain("increased by 5.20 percent");
    expect(summary.details.join(" ")).toContain("negative 0.63 percent");
    expect(table.rows).toHaveLength(points.length);
    expect(table.rows[4].values).toContain("Missing");
    expect(table.rows.at(-1)?.values[1]).toBe("$105,200.00 USD");
    expect(table.columns.map((column) => column.label)).toContain(
      "SPY normalized value (USD)",
    );
    expect(table.rows.at(-1)?.values[2]).toBe("$104,100.00 USD");
  });

  it("describes the common-window SPY comparison without verdict color", () => {
    const model = portfolioEquityFixture;
    const points = normalizeChartPoints(model.series.points, model.maxPoints);
    const summary = createPortfolioEquitySummary(
      points,
      model.identity,
      model.freshness,
      model.range.timeZone,
      model.benchmark,
    );

    expect(summary.details.join(" ")).toContain("SPY return was 4.10 percent")
    expect(summary.details.join(" ")).toContain("portfolio minus benchmark was 1.10 percent")
  });

  it("treats one completed run as evidence without claiming a trend", () => {
    const model = portfolioEquityFixture;
    const point = model.series.points[0];
    const summary = createPortfolioEquitySummary(
      [point],
      model.identity,
      { ...model.freshness, cutoff: point.timestamp },
      model.range.timeZone,
    );

    expect(summary.headline).toContain("One completed-run portfolio equity observation");
    expect(summary.details).toContain("One observation is evidence, but it is not a performance trend.");
    expect(summary.details.join(" ")).toContain("Run 1");
  });

  it("keeps typed evidence labels in both the summary and table projection", () => {
    const model = drawdownEvidenceFixture;
    const points = normalizeDrawdownPoints(model.points, model.maxPoints);
    const summary = createDrawdownSummary(
      points,
      model.identity,
      model.freshness,
      model.range.timeZone,
    );
    const table = createDrawdownTable(
      points,
      model.identity,
      model.range.timeZone,
    );

    expect(summary.details[0]).toContain("2 evidence markers");
    expect(table.rows.flatMap((row) => row.values)).toContain(
      "Volatility cap reduced exposure",
    );
  });
});
