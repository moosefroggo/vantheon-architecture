import { describe, expect, it } from "vitest"

import {
  changeSetHref,
  draftHref,
  evaluationHref,
  paperCompareHref,
  paperRunHref,
  parseWorkspaceRoute,
} from "./workspace-route"

describe("workspace route contract", () => {
  it("parses stable Draft resources and shareable tabs", () => {
    expect(
      parseWorkspaceRoute(
        "/champions/mara/draft/evaluations/evaluation-2",
        new URLSearchParams("tab=activity&panel=dry-runs")
      )
    ).toEqual({
      championId: "mara",
      evaluationId: "evaluation-2",
      kind: "evaluation",
      panel: "dry-runs",
      tab: "activity",
    })

    expect(draftHref("mara", "document")).toBe(
      "/champions/mara/draft?view=document"
    )
    expect(evaluationHref("mara", "evaluation-2", "activity")).toBe(
      "/champions/mara/draft/evaluations/evaluation-2?tab=activity"
    )
    expect(changeSetHref("mara", "change 2")).toBe(
      "/champions/mara/draft/changes/change%202"
    )
  })

  it("parses Paper portfolios, runs, decisions, and comparisons", () => {
    expect(
      parseWorkspaceRoute(
        "/champions/iris/paper/portfolio-1/runs/run-6",
        new URLSearchParams("tab=activity&decision=decision-4")
      )
    ).toEqual({
      championId: "iris",
      decisionId: "decision-4",
      kind: "paper-run",
      panel: undefined,
      portfolioId: "portfolio-1",
      runId: "run-6",
      tab: "activity",
    })

    expect(
      paperRunHref("iris", "portfolio-1", "run-6", "activity", "decision-4")
    ).toBe(
      "/champions/iris/paper/portfolio-1/runs/run-6?tab=activity&decision=decision-4"
    )
    expect(paperCompareHref("iris", ["one", "one", "two", "three"])).toBe(
      "/champions/iris/paper/compare?portfolios=one%2Ctwo"
    )
  })

  it("does not turn unknown paths into another Champion's workspace", () => {
    expect(parseWorkspaceRoute("/champions/unknown/not-a-surface")).toEqual({
      championId: "unknown",
      kind: "unavailable",
      panel: undefined,
      requestedPath: "/champions/unknown/not-a-surface",
    })
  })
})
