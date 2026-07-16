import { describe, expect, it } from "vitest"

import {
  createPaperEquityPresentation,
  type PaperWorkspaceFixture,
} from "./paper-portfolio-workspace"

const completedRun = {
  id: "run-1",
  label: "Run 1",
  status: "Completed",
  completedAt: "Jul 17, 2026 · 4:18 PM ET",
  decision: "No trade",
  dataCutoff: "Jul 17, 2026 · 4:00 PM ET",
  decisions: [
    {
      id: "decision-1",
      label: "Hold cash",
      detail: "No candidate passed every entry rule.",
    },
  ],
} as const

function createPaper(
  overrides: Partial<PaperWorkspaceFixture> = {}
): PaperWorkspaceFixture {
  return {
    label: "Paper V1",
    status: "Running",
    strategy: "Strategy V1",
    source: "Draft V1 · checkpoint V1.2",
    portfolioValue: 100_000,
    totalReturn: 0,
    dailyPnl: 0,
    buyingPower: 100_000,
    exposure: 0,
    maxDrawdown: 0,
    positions: 0,
    openOrders: 0,
    nextRun: "Jul 24 · 4:15 PM ET",
    runCadence: "Friday after market close",
    freshness: "Current",
    ...overrides,
  }
}

describe("Paper equity evidence contract", () => {
  it("keeps an empty Paper portfolio in the honest zero-history state", () => {
    expect(createPaperEquityPresentation(createPaper())).toEqual({ state: "empty" })
  })

  it("renders one completed run as a traceable observation", () => {
    const presentation = createPaperEquityPresentation(createPaper({
      runs: [completedRun],
      equityHistory: [
        {
          timestamp: "2026-07-17T20:18:00.000Z",
          value: 100_000,
          runId: "run-1",
          decisionIds: ["decision-1"],
        },
      ],
    }))

    expect(presentation.state).toBe("ready")

    if (presentation.state !== "ready") return

    expect(presentation.model.series.points).toHaveLength(1)
    expect(presentation.model.series.points[0].reference).toMatchObject({
      kind: "run",
      id: "run-1",
      label: "Run 1",
    })
    expect(presentation.model.series.points[0].decisionReferences).toEqual([
      { kind: "decision", id: "decision-1", label: "Hold cash" },
    ])
    expect(presentation.model.cadence.disclosure).toContain("does not imply")
  })

  it("aligns the SPY benchmark to completed-run observations", () => {
    const timestamp = "2026-07-17T20:18:00.000Z"
    const presentation = createPaperEquityPresentation(createPaper({
      runs: [completedRun],
      equityHistory: [{ timestamp, value: 100_000, runId: "run-1" }],
      benchmark: {
        symbol: "SPY",
        label: "SPY",
        methodology: "Normalized at portfolio launch.",
        history: [{ timestamp, value: 100_240 }],
      },
    }))

    expect(presentation.state).toBe("ready")
    if (presentation.state !== "ready") return

    expect(presentation.model.identity.title).toBe("Portfolio value vs SPY")
    expect(presentation.model.benchmark?.points).toEqual([
      { timestamp, value: 100_240, quality: "confirmed" },
    ])
  })

  it("refuses to draw portfolio history that cannot resolve to a run trace", () => {
    const presentation = createPaperEquityPresentation(createPaper({
      runs: [completedRun],
      equityHistory: [
        {
          timestamp: "2026-07-17T20:18:00.000Z",
          value: 100_000,
          runId: "missing-run",
        },
      ],
    }))

    expect(presentation).toMatchObject({
      state: "invalid",
    })
  })
})
