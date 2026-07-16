import type { ReactNode } from "react"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import {
  PaperPortfolioWorkspace,
  PaperWorkspaceBottomPanel,
  type PaperPortfolioWorkspaceProps,
  type PaperWorkspaceFixture,
} from "./paper-portfolio-workspace"

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({
    children,
    className,
  }: {
    children: ReactNode
    className?: string
  }) => <div className={className}>{children}</div>,
}))

const completedRun = {
  id: "run-1",
  label: "Run 1",
  status: "Completed",
  completedAt: "Jul 17, 2026 · 4:18 PM ET",
  decision: "No trade",
} as const

function createPaper(
  overrides: Partial<PaperWorkspaceFixture> = {},
): PaperWorkspaceFixture {
  return {
    label: "Paper V1",
    status: "Running",
    strategy: "Strategy V1",
    source: "Checkpoint 2",
    portfolioValue: 100_000,
    totalReturn: 0,
    dailyPnl: 0,
    buyingPower: 100_000,
    exposure: 0,
    maxDrawdown: 0,
    positions: 0,
    openOrders: 0,
    nextRun: "Tomorrow 8:30 AM",
    runCadence: "Trades daily at 9:30am ET.",
    freshness: "Current",
    ...overrides,
  }
}

function workspaceProps(
  paper: PaperWorkspaceFixture,
  overrides: Partial<PaperPortfolioWorkspaceProps> = {},
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

describe("mirror-aligned Paper portfolio", () => {
  it("renders only the portfolio facts evidenced in the mirror", () => {
    render(<PaperPortfolioWorkspace {...workspaceProps(createPaper())} />)

    expect(screen.getByRole("heading", { name: "Portfolio" })).toBeVisible()
    expect(
      screen.getByRole("heading", { name: "No positions yet" }),
    ).toBeVisible()
    expect(screen.getByText("Account value")).toBeVisible()
    expect(
      screen.getByRole("img", { name: "Account value history" }),
    ).toBeVisible()
    for (const range of ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"]) {
      expect(screen.getByRole("button", { name: range })).toBeVisible()
    }
    for (const section of [
      "Buying power",
      "Schedule",
      "Gainers",
      "Detractors",
      "Assets",
      "Orders",
    ]) {
      expect(screen.getByRole("heading", { name: section })).toBeVisible()
    }

    expect(screen.queryByText("Total P&L")).not.toBeInTheDocument()
    expect(screen.queryByText("Gross exposure")).not.toBeInTheDocument()
    expect(screen.queryByText("Max drawdown")).not.toBeInTheDocument()
    expect(screen.queryByText("Time-weighted return")).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Stop" }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: "Open Draft" }),
    ).not.toBeInTheDocument()
  })

  it("reproduces the captured Add funds and Edit schedule dialogs", () => {
    render(<PaperPortfolioWorkspace {...workspaceProps(createPaper())} />)

    fireEvent.click(screen.getByRole("button", { name: "Add funds" }))
    expect(screen.getByRole("heading", { name: "Add funds" })).toBeVisible()
    expect(
      screen.getByText("Deposit capital into your portfolio."),
    ).toBeVisible()
    expect(screen.getByLabelText("Amount")).toBeVisible()
    expect(screen.getByText("$1 – $100,000 per deposit.")).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))

    fireEvent.click(screen.getByRole("button", { name: "Edit" }))
    expect(screen.getByRole("heading", { name: "Edit schedule" })).toBeVisible()
    expect(screen.getByText("When the bot runs.")).toBeVisible()
    expect(screen.getByLabelText("Frequency")).toHaveValue("daily")
    expect(screen.getByLabelText("Run time")).toHaveValue("market-open")
    expect(screen.getByText("Run on market holidays")).toBeVisible()
  })
})

describe("mirror-aligned Paper sections", () => {
  it("uses the captured Positions fields and search", () => {
    const paper = createPaper({
      positionRows: [
        {
          id: "position-aapl",
          symbol: "AAPL",
          quantity: 10,
          marketValue: 1_100,
          unrealizedReturn: 0.1,
          unrealizedPnl: 100,
          weight: 0.11,
          averageCost: 100,
          markPrice: 110,
          dailyPnl: 5,
          provenance: { source: "not shown" },
        },
        {
          id: "position-msft",
          symbol: "MSFT",
          quantity: 5,
          marketValue: 2_000,
          unrealizedReturn: 0.04,
          unrealizedPnl: 80,
          weight: 0.2,
        },
      ],
    })

    render(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="positions"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )

    for (const column of [
      "Asset",
      "Position",
      "Value",
      "Return",
      "Profit",
      "Allocation",
    ]) {
      expect(screen.getByRole("columnheader", { name: column })).toBeVisible()
    }
    expect(
      screen.queryByRole("columnheader", { name: "Avg cost" }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText("not shown")).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText("Search positions..."), {
      target: { value: "MSFT" },
    })
    expect(screen.getByRole("rowheader", { name: "MSFT" })).toBeVisible()
    expect(
      screen.queryByRole("rowheader", { name: "AAPL" }),
    ).not.toBeInTheDocument()
  })

  it("uses the captured Orders fields and search", () => {
    const paper = createPaper({
      runs: [completedRun],
      orderRows: [
        {
          id: "order-1",
          symbol: "AAPL",
          side: "Buy",
          quantity: 10,
          status: "Filled",
          timeInForce: "DAY",
          createdAt: "Jul 17 · 4:18 PM ET",
          averageFillPrice: 108.25,
          provenance: { runId: completedRun.id, decisionLabel: "not shown" },
        },
      ],
    })

    render(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="orders"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={vi.fn()}
      />,
    )

    for (const column of [
      "Asset",
      "Order",
      "Status",
      "Expires",
      "Run",
      "Created",
    ]) {
      expect(screen.getByRole("columnheader", { name: column })).toBeVisible()
    }
    expect(screen.getByRole("cell", { name: "Run 1" })).toBeVisible()
    expect(screen.queryByText("Avg fill")).not.toBeInTheDocument()
    expect(screen.queryByText("not shown")).not.toBeInTheDocument()
  })

  it("keeps Runs to the captured list and Strategy to its read-only marker", () => {
    const paper = createPaper({ runs: [completedRun] })
    const onOpenRun = vi.fn()
    const { rerender } = render(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="runs"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={onOpenRun}
      />,
    )

    expect(
      screen.getByText("Your strategy in action: researching and trading."),
    ).toBeVisible()
    fireEvent.click(screen.getByRole("button", { name: /Run 1/ }))
    expect(onOpenRun).toHaveBeenCalledWith(completedRun)
    expect(screen.queryByText("No trade")).not.toBeInTheDocument()

    rerender(
      <PaperWorkspaceBottomPanel
        paper={paper}
        activeTab="strategy"
        expanded
        onActiveTabChange={vi.fn()}
        onExpandedChange={vi.fn()}
        onOpenRun={onOpenRun}
      />,
    )
    const strategy = screen.getByText("Read-only").parentElement!
    expect(within(strategy).getByText("Strategy")).toBeVisible()
    expect(screen.queryByText("Checkpoint 2")).not.toBeInTheDocument()
  })

  it("does not invent a run-detail body when the mirror did not capture one", () => {
    render(
      <PaperPortfolioWorkspace
        {...workspaceProps(createPaper({ runs: [completedRun] }), {
          selectedReference: { kind: "run", id: completedRun.id },
        })}
      />,
    )

    expect(screen.getByRole("heading", { name: "Run 1" })).toBeVisible()
    expect(screen.getByText(completedRun.completedAt)).toBeVisible()
    expect(screen.queryByText("Decision trace")).not.toBeInTheDocument()
    expect(screen.queryByText("Before account value")).not.toBeInTheDocument()
    expect(screen.queryByText("Activity")).not.toBeInTheDocument()
  })
})
