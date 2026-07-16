import type { ReactNode } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import type {
  DrawdownEvidenceReadModel,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts"

import {
  PaperPortfolioWorkspace,
  PaperWorkspaceBottomPanel,
  type PaperPortfolioWorkspaceProps,
  type PaperWorkspaceFixture,
} from "./paper-portfolio-workspace"

vi.mock("@/components/domain/charts/portfolio-equity-chart", () => ({
  PortfolioEquityChart: ({ model }: { model: PortfolioEquityReadModel }) => (
    <div data-testid="portfolio-equity-chart">{model.identity.title}</div>
  ),
}))

vi.mock("@/components/domain/charts/drawdown-evidence-chart", () => ({
  DrawdownEvidenceChart: ({ model }: { model: DrawdownEvidenceReadModel }) => (
    <div data-testid="drawdown-evidence-chart">{model.identity.title}</div>
  ),
}))

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}))

const completedRun = {
  id: "run-1",
  label: "Run 1",
  status: "Completed",
  completedAt: "Jul 17, 2026 · 4:18 PM ET",
  decision: "No trade",
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
    totalReturn: 0.1,
    dailyPnl: 120,
    buyingPower: 25_000,
    exposure: 0.75,
    maxDrawdown: -0.02,
    positions: 1,
    openOrders: 0,
    nextRun: "Jul 24 · 4:15 PM ET",
    runCadence: "Friday after market close",
    freshness: "Current",
    ...overrides,
  }
}

function workspaceProps(
  paper: PaperWorkspaceFixture,
  overrides: Partial<PaperPortfolioWorkspaceProps> = {}
): PaperPortfolioWorkspaceProps {
  return {
    paper,
    selectedReference: null,
    runTab: "summary",
    onOpenDraft: vi.fn(),
    onRunTabChange: vi.fn(),
    onSelectedReferenceChange: vi.fn(),
    ...overrides,
  }
}

describe("Paper portfolio presentation facts", () => {
  it("renders one operational-status badge without stray chevron text", () => {
    const { container } = render(
      <PaperPortfolioWorkspace {...workspaceProps(createPaper())} />
    )
    const header = screen.getByRole("heading", { name: "Paper V1" }).closest("header")
    const elementsWithStrayChevronText = Array.from(
      container.querySelectorAll("*")
    ).filter((element) =>
      Array.from(element.childNodes).some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim() === ">"
      )
    )

    expect(header).not.toBeNull()
    expect(header!.querySelectorAll('[data-slot="badge"]')).toHaveLength(1)
    expect(within(header!).getByText("Running")).toBeVisible()
    expect(within(header!).queryByText("Simulated")).not.toBeInTheDocument()
    expect(elementsWithStrayChevronText).toHaveLength(0)
  })

  it("keeps cash, buying power, deployed value, exposure, and P&L distinct", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({
          account: {
            accountValue: 112_500,
            totalPnl: 12_500,
            realizedPnl: 4_500,
            unrealizedPnl: 8_000,
            dailyPnl: 375,
            totalReturn: 0.125,
            cash: 12_000,
            buyingPower: 37_000,
            reservedCash: 2_500,
            deployedValue: 100_500,
            grossExposure: 0.91,
          },
        }))}
      />
    )

    expect(
      within(screen.getByText("Account value").parentElement!).getByText("$112,500")
    ).toBeVisible()
    expect(screen.getByText("+$12,500")).toBeVisible()
    expect(screen.getByText("$12,000")).toBeVisible()
    expect(screen.getByText("$37,000")).toBeVisible()
    expect(screen.getByText("$100,500")).toBeVisible()
    expect(screen.getByText("91%")).toBeVisible()
    expect(screen.getByText(/Reserved/)).toHaveTextContent("Reserved $2,500")
    expect(screen.getByText("+$4,500")).toBeVisible()
    expect(screen.getByText("+$8,000")).toBeVisible()
  })

  it("does not reverse-engineer missing cash, deployed value, or total P&L", () => {
    render(<PaperPortfolioWorkspace {...workspaceProps(createPaper())} />)

    expect(
      within(screen.getByText("Total P&L").parentElement!).getByText("Unavailable")
    ).toBeVisible()
    expect(
      within(screen.getByText("Cash").parentElement!).getByText("Unavailable")
    ).toBeVisible()
    expect(
      within(screen.getByText("Deployed").parentElement!).getByText("Unavailable")
    ).toBeVisible()
    expect(screen.queryByText("+$9,091")).not.toBeInTheDocument()
  })
})

describe("Paper run presentation facts", () => {
  it("shows unavailable instead of invented duration, counts, and historical buying power", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ runs: [completedRun] }), {
          selectedReference: { kind: "run", id: completedRun.id },
        })}
      />
    )

    expect(screen.queryByText("8m 54s")).not.toBeInTheDocument()
    expect(screen.getAllByText("Unavailable").length).toBeGreaterThanOrEqual(6)
    for (const label of screen.getAllByText("Run buying power")) {
      expect(label.parentElement).toHaveTextContent("Unavailable")
      expect(label.parentElement).not.toHaveTextContent("$25,000")
    }
  })

  it("does not synthesize an activity stream", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ runs: [completedRun] }), {
          selectedReference: { kind: "run", id: completedRun.id },
          runTab: "activity",
        })}
      />
    )

    expect(screen.getByText("Activity unavailable")).toBeVisible()
    expect(screen.getByText("No event records were supplied for this run.")).toBeVisible()
    expect(screen.queryByText("Run started")).not.toBeInTheDocument()
    expect(screen.queryByText("Evaluated 0 candidates")).not.toBeInTheDocument()
  })

  it("presents supplied immutable run context without borrowing current Paper metadata", () => {
    const contextualRun = {
      ...completedRun,
      portfolioReference: "Portfolio snapshot · ps-17",
      strategyReference: "Strategy V1 · immutable",
      scheduleReference: "Schedule · Fridays 4:15 PM ET",
      freshness: "Confirmed at market close",
    }

    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ runs: [contextualRun] }), {
          selectedReference: { kind: "run", id: contextualRun.id },
        })}
      />
    )

    expect(screen.getByRole("heading", { name: "Run context" })).toBeVisible()
    expect(screen.getByText("Portfolio snapshot · ps-17")).toBeVisible()
    expect(screen.getByText("Strategy V1 · immutable")).toBeVisible()
    expect(screen.getByText("Schedule · Fridays 4:15 PM ET")).toBeVisible()
  })
})

describe("Paper evidence tables", () => {
  it("shows expanded position and order facts with run provenance", () => {
    const onOpenRun = vi.fn()
    const paper = createPaper({
      runs: [completedRun],
      positionRows: [
        {
          id: "position-aapl",
          symbol: "AAPL",
          name: "Apple Inc.",
          quantity: 12.5,
          averageCost: 100,
          markPrice: 110,
          marketValue: 1_375,
          weight: 0.1375,
          unrealizedPnl: 125,
          unrealizedReturn: 0.1,
          dailyPnl: 5,
          provenance: {
            source: "Execution ledger",
            runId: completedRun.id,
            decisionLabel: "Buy AAPL",
          },
        },
      ],
      orderRows: [
        {
          id: "order-1",
          symbol: "AAPL",
          side: "Buy",
          orderType: "Limit",
          quantity: 10,
          filledQuantity: 4,
          averageFillPrice: 108.25,
          limitPrice: 109,
          timeInForce: "DAY",
          status: "Partially filled",
          createdAt: "Jul 17 · 4:18 PM ET",
          provenance: {
            runId: completedRun.id,
            decisionLabel: "Buy AAPL",
          },
        },
      ],
    })
    const { rerender } = render(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="positions"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={onOpenRun}
      />
    )

    expect(screen.getByRole("columnheader", { name: "Avg cost" })).toBeVisible()
    expect(screen.getByRole("columnheader", { name: "Unrealized P&L" })).toBeVisible()
    expect(screen.getByText("Apple Inc.")).toBeVisible()
    expect(screen.getByText("Decision: Buy AAPL")).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Run 1" }))
    expect(onOpenRun).toHaveBeenCalledWith(completedRun)

    rerender(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="orders"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={onOpenRun}
      />
    )

    expect(
      screen.getByRole("columnheader", { name: "Filled / quantity" })
    ).toBeVisible()
    expect(
      screen.getByRole("cell", { name: /Avg fill \$108\.25/ })
    ).toBeVisible()
    expect(screen.getByRole("cell", { name: /Limit \$109/ })).toBeVisible()
    expect(screen.getByText("Partially filled")).toBeVisible()
  })
})

describe("Paper portfolio chart and lifecycle controls", () => {
  it("uses the supplied benchmark name in the zero-history state", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({
          benchmark: {
            symbol: "R1000V",
            label: "Russell 1000 Value",
            methodology: "Sampled after each completed run.",
            history: [],
          },
        }))}
      />
    )

    const figure = screen.getByRole("figure", {
      name: "Portfolio vs Russell 1000 Value",
    })

    expect(within(figure).getByText("Benchmark Russell 1000 Value")).toBeVisible()
    expect(within(figure).queryByText(/SPY/)).not.toBeInTheDocument()
  })

  it("marks an absent benchmark and next-run fact as unavailable", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ nextRun: "" }))}
      />
    )

    const figure = screen.getByRole("figure", { name: "Portfolio value" })

    expect(within(figure).getByText("Benchmark Unavailable")).toBeVisible()
    expect(within(figure).getByText("First run Unavailable")).toBeVisible()
    expect(within(figure).queryByText(/SPY/)).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Performance" })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("offers Value, Performance, and the existing Drawdown evidence view", () => {
    const timestamp = "2026-07-17T20:18:00.000Z"
    const paper = createPaper({
      runs: [completedRun],
      equityHistory: [
        { timestamp, value: 100_000, runId: completedRun.id },
      ],
      benchmark: {
        symbol: "SPY",
        label: "SPY",
        methodology: "Normalized at portfolio launch.",
        history: [{ timestamp, value: 100_200 }],
      },
      drawdownModel: {
        identity: {
          id: "paper-drawdown",
          title: "Paper drawdown evidence",
          metric: "Drawdown",
          entity: "Paper V1",
          unit: { kind: "percent", fractionDigits: 2 },
        },
        range: {
          id: "all",
          label: "All completed runs",
          start: timestamp,
          end: timestamp,
          timeZone: "America/Chicago",
        },
        freshness: { state: "current", cutoff: timestamp },
        status: { state: "ready" },
        points: [{ timestamp, value: -0.5, quality: "confirmed" }],
      },
    })

    render(<PaperPortfolioWorkspace {...workspaceProps(paper)} />)

    expect(screen.getByRole("tab", { name: "Value" })).toBeEnabled()
    expect(screen.getByRole("tab", { name: "Performance" })).toBeEnabled()
    expect(screen.getByRole("tab", { name: "Drawdown" })).toBeEnabled()
    expect(screen.getByTestId("portfolio-equity-chart")).toHaveTextContent(
      "Portfolio value vs SPY"
    )

    fireEvent.click(screen.getByRole("tab", { name: "Drawdown" }))
    expect(screen.getByTestId("drawdown-evidence-chart")).toHaveTextContent(
      "Paper drawdown evidence"
    )
  })

  it("gates Stop, Archive, and Unarchive by operational state", () => {
    const onStop = vi.fn()
    const onArchive = vi.fn()
    const onUnarchive = vi.fn()
    const { rerender } = render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ operationalState: "active" }), {
          onStop,
          onArchive,
          onUnarchive,
        })}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Stop" }))
    expect(onStop).toHaveBeenCalledOnce()
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument()

    rerender(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ operationalState: "stopped" }), {
          onStop,
          onArchive,
          onUnarchive,
        })}
      />
    )
    expect(screen.getByRole("button", { name: "Archive" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument()

    rerender(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ operationalState: "archived" }), {
          onStop,
          onArchive,
          onUnarchive,
        })}
      />
    )
    expect(screen.getByRole("button", { name: "Unarchive" })).toBeVisible()
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument()
  })
})
