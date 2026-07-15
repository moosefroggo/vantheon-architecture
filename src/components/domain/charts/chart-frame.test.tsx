import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChartFrame } from "@/components/domain/charts/chart-frame";
import {
  createPortfolioEquitySummary,
  createPortfolioEquityTable,
} from "@/lib/charts/accessible-summary";
import { portfolioEquityFixture } from "@/lib/charts/fixtures";
import { normalizeChartPoints } from "@/lib/charts/normalization";

describe("ChartFrame", () => {
  it("exposes identity, status, keyboard range controls, summary, and a table path", () => {
    const model = portfolioEquityFixture;
    const points = normalizeChartPoints(model.series.points, model.maxPoints);
    const onRangeChange = vi.fn();

    render(
      <ChartFrame
        identity={model.identity}
        range={model.range}
        availableRanges={model.availableRanges}
        freshness={model.freshness}
        status={model.status}
        summary={createPortfolioEquitySummary(
          points,
          model.identity,
          model.freshness,
          model.range.timeZone,
        )}
        table={createPortfolioEquityTable(
          points,
          model.identity,
          model.range.timeZone,
        )}
        onRangeChange={onRangeChange}
      >
        <div data-testid="plot" />
      </ChartFrame>,
    );

    expect(screen.getByRole("heading", { name: "Paper portfolio equity" })).toBeVisible();
    expect(screen.getByText("Paper data current")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.getByText(/increased by 5.20 percent/)).toBeVisible();
    expect(screen.getByTestId("plot")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "1 week" }));
    expect(onRangeChange).toHaveBeenCalledWith("1w");

    fireEvent.click(screen.getByText(/View accessible data table/));
    expect(screen.getByRole("table", {
      name: "Portfolio equity observations for Growth Champion · Paper V5",
    })).toBeVisible();
  });
});
