"use client"

import { useMemo, useState, type ReactNode } from "react"
import {
  ArrowRight,
  ChevronDown,
  Pencil,
  Plus,
  Search,
} from "lucide-react"

import { Money } from "@/components/system/money"
import { Percentage } from "@/components/system/percentage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  DomainObjectReference,
  DrawdownEvidenceReadModel,
  PortfolioEquityObservation,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts"

import { WorkspacePageHeader } from "./workspace-page-header"
import { WorkspaceHeaderBreadcrumbs } from "./workspace-header-breadcrumbs"

export type PaperRunFixture = {
  readonly id: string
  readonly label: string
  readonly status: string
  readonly completedAt: string
  readonly decision?: string
  readonly evaluated?: number
  readonly orders?: number
  readonly duration?: string
  readonly startedAt?: string
  readonly dataCutoff?: string
  readonly accountValue?: number
  readonly buyingPower?: number
  readonly beforeAccountValue?: number
  readonly beforeBuyingPower?: number
  readonly afterAccountValue?: number
  readonly afterBuyingPower?: number
  readonly portfolioReference?: string
  readonly strategyReference?: string
  readonly scheduleReference?: string
  readonly freshness?: string
  readonly failureReason?: string
  readonly cancellationReason?: string
  readonly decisions?: readonly {
    readonly id: string
    readonly label: string
    readonly detail?: string
  }[]
  readonly activity?: readonly {
    readonly id: string
    readonly time: string
    readonly title: string
    readonly detail: string
  }[]
}

export type PaperAccountFacts = {
  readonly accountValue?: number
  readonly cash?: number
  readonly buyingPower?: number
  readonly reservedCash?: number
  readonly positionsMarketValue?: number
  readonly deployedValue?: number
  readonly grossExposure?: number
  readonly totalPnl?: number
  readonly realizedPnl?: number
  readonly unrealizedPnl?: number
  readonly income?: number
  readonly fees?: number
  readonly dailyPnl?: number
  readonly totalReturn?: number
  readonly timeWeightedReturn?: number
}

export type PaperRecordProvenance = {
  readonly source?: string
  readonly recordedAt?: string
  readonly runId?: string
  readonly runLabel?: string
  readonly decisionId?: string
  readonly decisionLabel?: string
}

export type PaperPositionRow = {
  readonly id?: string
  readonly symbol: string
  readonly name?: string
  readonly quantity?: number
  readonly averageCost?: number
  readonly markPrice?: number
  readonly marketValue?: number
  readonly weight?: number
  readonly unrealizedPnl?: number
  readonly unrealizedReturn?: number
  readonly dailyPnl?: number
  readonly provenance?: PaperRecordProvenance
}

export type PaperOrderRow = {
  readonly id: string
  readonly symbol: string
  readonly side: string
  readonly orderType?: string
  readonly quantity?: number
  readonly filledQuantity?: number
  readonly averageFillPrice?: number
  readonly limitPrice?: number
  readonly stopPrice?: number
  readonly timeInForce?: string
  readonly status: string
  readonly createdAt?: string
  readonly updatedAt?: string
  readonly provenance?: PaperRecordProvenance
}

export type PaperOperationalState =
  | "active"
  | "paused"
  | "degraded"
  | "disconnected"
  | "recovering"
  | "failed"
  | "unauthorized"
  | "stopping"
  | "stopped"
  | "archived"

export type PaperLifecycleAction = "stop" | "archive" | "unarchive"

export type PaperWorkspaceFixture = {
  readonly label: string
  readonly status: string
  readonly strategy: string
  readonly source: string
  readonly portfolioValue: number
  readonly totalReturn: number
  readonly dailyPnl: number
  readonly buyingPower: number
  readonly exposure: number
  readonly maxDrawdown: number
  readonly positions: number
  readonly openOrders: number
  readonly nextRun: string
  readonly runCadence: string
  readonly freshness: string
  readonly operationalState?: PaperOperationalState
  readonly account?: PaperAccountFacts
  readonly currency?: string
  readonly timeZone?: string
  readonly equityHistory?: readonly {
    readonly timestamp: string
    readonly value: number
    readonly quality?: "confirmed" | "estimated"
    readonly runId?: string
    readonly decisionIds?: readonly string[]
  }[]
  readonly benchmark?: {
    readonly symbol: string
    readonly label: string
    readonly methodology: string
    readonly history: readonly {
      readonly timestamp: string
      readonly value: number | null
      readonly quality?: "confirmed" | "estimated"
    }[]
  }
  readonly performanceModel?: PortfolioEquityReadModel
  readonly drawdownModel?: DrawdownEvidenceReadModel
  readonly runs?: readonly PaperRunFixture[]
  readonly positionRows?: readonly PaperPositionRow[]
  readonly orderRows?: readonly PaperOrderRow[]
  readonly strategyRules?: readonly {
    readonly label: string
    readonly value: string
  }[]
}

export type PaperPortfolioWorkspaceProps = {
  paper: PaperWorkspaceFixture
  selectedReference: DomainObjectReference | null
  runTab: PaperRunTab
  onOpenDraft: () => void
  onOpenPortfolio: () => void
  onOpenRuns: () => void
  onDeployLive?: () => void
  lifecycleOperation?: PaperLifecycleAction | null
  onStop?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onRunTabChange: (tab: PaperRunTab) => void
  onSelectedReferenceChange: (reference: DomainObjectReference | null) => void
}

export type PaperDetailsTab = "runs" | "positions" | "orders"
export type PaperRunTab = "summary" | "activity"
export type PaperChartView = "value" | "performance" | "drawdown"

const portfolioRanges = ["1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"] as const
type PortfolioRange = (typeof portfolioRanges)[number]

export function PaperPortfolioWorkspace(props: PaperPortfolioWorkspaceProps) {
  const { paper, selectedReference } = props
  const selectedRun = selectedReference
    ? findRunForReference(paper.runs ?? [], selectedReference)
    : null

  if (selectedRun) {
    return (
      <PaperRunWorkspace
        run={selectedRun}
        activeTab={props.runTab}
        onActiveTabChange={props.onRunTabChange}
        onOpenPortfolio={props.onOpenPortfolio}
        onOpenRuns={props.onOpenRuns}
      />
    )
  }

  return (
    <PortfolioOverview
      paper={paper}
      onDeployLive={props.onDeployLive}
      lifecycleOperation={props.lifecycleOperation}
      onArchive={props.onArchive}
      onUnarchive={props.onUnarchive}
    />
  )
}

function PortfolioOverview({
  paper,
  onDeployLive,
  lifecycleOperation,
  onArchive,
  onUnarchive,
}: {
  paper: PaperWorkspaceFixture
  onDeployLive?: () => void
  lifecycleOperation?: PaperLifecycleAction | null
  onArchive?: () => void
  onUnarchive?: () => void
}) {
  const currency = paper.currency ?? "USD"
  const [range, setRange] = useState<PortfolioRange>("ALL")
  const [chartView, setChartView] = useState<PaperChartView>("value")
  const [fundsOpen, setFundsOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [deposit, setDeposit] = useState("1,000")
  const [addedFunds, setAddedFunds] = useState(0)
  const [schedule, setSchedule] = useState(paper.runCadence)
  const positions = paper.positionRows ?? []
  const orders = paper.orderRows ?? []
  const accountValue =
    (paper.account?.accountValue ?? paper.portfolioValue) + addedFunds
  const buyingPower =
    (paper.account?.buyingPower ?? paper.buyingPower) + addedFunds
  const deployed =
    accountValue > 0
      ? (paper.account?.positionsMarketValue ?? 0) / accountValue
      : 0
  const benchmark = benchmarkFact(paper, accountValue)
  const gainers = positions.filter(
    (position) => (position.unrealizedPnl ?? 0) > 0,
  )
  const detractors = positions.filter(
    (position) => (position.unrealizedPnl ?? 0) < 0,
  )
  const canDeployLive =
    paper.operationalState === "active" ||
    (paper.operationalState === undefined && paper.status === "Running")

  function addFunds() {
    const amount = Number(deposit.replaceAll(",", ""))
    if (Number.isFinite(amount) && amount >= 1 && amount <= 100_000) {
      setAddedFunds((current) => current + amount)
      setFundsOpen(false)
    }
  }

  return (
    <section aria-labelledby="paper-workspace-title" className="space-y-4">
      <WorkspacePageHeader
        title="Portfolio"
        titleId="paper-workspace-title"
        titleLevel={2}
        action={
          <div className="flex flex-wrap gap-2">
            {paper.operationalState === "archived" ? (
              <Button
                type="button"
                variant="outline"
                disabled={lifecycleOperation !== null && lifecycleOperation !== undefined}
                onClick={onUnarchive}
              >
                Unarchive
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                disabled={
                  !onArchive ||
                  (lifecycleOperation !== null && lifecycleOperation !== undefined)
                }
                onClick={onArchive}
              >
                {lifecycleOperation === "archive" ? "Archiving…" : "Archive"}
              </Button>
            )}
            <Button
              type="button"
              disabled={!canDeployLive}
              title={canDeployLive ? undefined : "Only an active Paper portfolio can deploy Live"}
              onClick={onDeployLive}
            >
              Deploy Live
            </Button>
          </div>
        }
      />

      {positions.length === 0 ? (
        <section className="rounded-lg border px-4 py-3">
          <h2 className="text-sm font-semibold">No positions yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            No completed run has created a filled order yet. Positions will
            appear here when that evidence exists.
          </p>
        </section>
      ) : null}

      <section
        className="rounded-lg border p-4"
        aria-labelledby="account-value-title"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              id="account-value-title"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              Account value
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              <Money
                value={accountValue}
                currency={currency}
                maximumFractionDigits={2}
              />
            </p>
            <p className="mt-1 text-sm tabular-nums">
              <Money
                value={paper.account?.dailyPnl ?? paper.dailyPnl}
                currency={currency}
                showSign
                maximumFractionDigits={2}
              />{" "}
              (
              <Percentage
                value={paper.account?.totalReturn ?? paper.totalReturn}
                showSign
              />
              )
            </p>
            {benchmark ? (
              <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>
                  {benchmark.symbol}{" "}
                  <Percentage value={benchmark.returnValue} showSign /> (
                  <Money
                    value={benchmark.amount}
                    currency={currency}
                    showSign
                    maximumFractionDigits={2}
                  />
                  )
                </span>
                <Badge variant={benchmark.ahead ? "secondary" : "destructive"}>
                  {benchmark.ahead ? "Ahead" : "Behind"}
                </Badge>
              </p>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap justify-end gap-1" aria-label="Chart mode">
              {(["value", "performance", "drawdown"] as const).map((view) => (
                <Button
                  key={view}
                  type="button"
                  size="xs"
                  variant={chartView === view ? "secondary" : "ghost"}
                  aria-pressed={chartView === view}
                  onClick={() => setChartView(view)}
                >
                  {view === "value" ? "Value" : view === "performance" ? "Performance vs SPY" : "Drawdown"}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap justify-end gap-1" aria-label="Portfolio range">
              {portfolioRanges.map((candidate) => (
                <Button
                  key={candidate}
                  type="button"
                  size="xs"
                  variant={range === candidate ? "secondary" : "ghost"}
                  aria-pressed={range === candidate}
                  onClick={() => setRange(candidate)}
                >
                  {candidate}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <MirrorPortfolioChart paper={paper} range={range} view={chartView} />
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <MirrorPanel
          title="Buying power"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setFundsOpen(true)}
            >
              <Plus aria-hidden="true" /> Add funds
            </Button>
          }
        >
          <div className="flex items-end justify-between gap-4">
            <p className="text-2xl font-semibold tabular-nums">
              <Money
                value={buyingPower}
                currency={currency}
                maximumFractionDigits={0}
              />
            </p>
            <p className="text-sm text-muted-foreground">
              <Percentage value={deployed} /> deployed
            </p>
          </div>
        </MirrorPanel>

        <MirrorPanel
          title="Schedule"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setScheduleOpen(true)}
            >
              <Pencil aria-hidden="true" /> Edit
            </Button>
          }
        >
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Next run
          </p>
          <p className="mt-1 text-xl font-semibold">{paper.nextRun}</p>
          <p className="mt-1 text-sm text-muted-foreground">{schedule}</p>
        </MirrorPanel>

        <MovementPanel
          title="Gainers"
          positions={gainers}
          empty="No gainers yet."
        />
        <MovementPanel
          title="Detractors"
          positions={detractors}
          empty="No detractors yet."
        />

        <MirrorPanel title="Assets">
          <div className="grid min-h-44 place-items-center">
            <div className="grid size-40 place-items-center rounded-full bg-muted shadow-[inset_0_0_0_2.2rem_hsl(var(--background))]">
              <div className="text-center">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total
                </p>
                <p className="mt-1 font-semibold tabular-nums">
                  <Money
                    value={accountValue}
                    currency={currency}
                    maximumFractionDigits={0}
                  />
                </p>
              </div>
            </div>
          </div>
        </MirrorPanel>

        <MirrorPanel title="Orders">
          {orders.length ? (
            <ul className="divide-y">
              {orders
                .slice(-3)
                .reverse()
                .map((order) => (
                  <li
                    key={order.id}
                    className="flex items-center justify-between gap-4 py-3 text-sm"
                  >
                    <span className="font-medium">{order.symbol}</span>
                    <span className="text-muted-foreground">
                      {order.side} · {order.status}
                    </span>
                  </li>
                ))}
            </ul>
          ) : (
            <EmptyLine>No orders yet.</EmptyLine>
          )}
        </MirrorPanel>
      </div>

      <Dialog open={fundsOpen} onOpenChange={setFundsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add funds</DialogTitle>
            <DialogDescription>
              Deposit capital into your portfolio.
            </DialogDescription>
          </DialogHeader>
          <label className="grid gap-2 text-sm font-medium">
            Amount
            <span className="font-normal text-muted-foreground">
              $1 – $100,000 per deposit.
            </span>
            <span className="flex items-center rounded-md border">
              <span className="px-3 text-muted-foreground">$</span>
              <Input
                aria-label="Amount"
                inputMode="decimal"
                value={deposit}
                onChange={(event) => setDeposit(event.target.value)}
                className="border-0"
              />
            </span>
          </label>
          <DialogFooter>
            <Button type="button" onClick={addFunds}>
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit schedule</DialogTitle>
            <DialogDescription>When the bot runs.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium">Schedule</p>
              <p className="text-sm text-muted-foreground">
                Trades daily at 9:30am ET.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                aria-label="Frequency"
                defaultValue="daily"
              >
                <option value="daily">Daily</option>
              </select>
              <select
                className="h-9 rounded-md border bg-background px-3 text-sm"
                aria-label="Run time"
                defaultValue="market-open"
              >
                <option value="market-open">Market Open 9:30am ET</option>
              </select>
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-1" />
              <span>
                <span className="block font-medium">
                  Run on market holidays
                </span>
                <span className="block text-muted-foreground">
                  When off, runs that land on a US market holiday are skipped.
                </span>
              </span>
            </label>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                setSchedule("Trades daily at 9:30am ET.")
                setScheduleOpen(false)
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}

function MirrorPanel({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="min-h-40 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  )
}

function MovementPanel({
  title,
  positions,
  empty,
}: {
  title: string
  positions: readonly PaperPositionRow[]
  empty: string
}) {
  return (
    <MirrorPanel title={title}>
      {positions.length ? (
        <ul className="divide-y">
          {positions.slice(0, 3).map((position) => (
            <li
              key={position.id ?? position.symbol}
              className="flex items-center justify-between gap-4 py-3 text-sm"
            >
              <span className="font-medium">{position.symbol}</span>
              <span className="tabular-nums">
                <OptionalPercentage
                  value={position.unrealizedReturn}
                  showSign
                />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyLine>{empty}</EmptyLine>
      )}
    </MirrorPanel>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p className="grid min-h-20 place-items-center text-sm italic text-muted-foreground">
      {children}
    </p>
  )
}

function benchmarkFact(paper: PaperWorkspaceFixture, accountValue: number) {
  const benchmarkValues = paper.benchmark?.history
    .map((point) => point.value)
    .filter((value): value is number => value !== null)
  const firstBenchmark = benchmarkValues?.[0]
  const lastBenchmark = benchmarkValues?.at(-1)
  if (!paper.benchmark || !firstBenchmark || !lastBenchmark) return null
  const benchmarkReturn = lastBenchmark / firstBenchmark - 1
  const portfolioReturn = paper.account?.totalReturn ?? paper.totalReturn
  const startingValue =
    portfolioReturn === -1 ? accountValue : accountValue / (1 + portfolioReturn)
  return {
    symbol: paper.benchmark.symbol,
    returnValue: benchmarkReturn,
    amount: startingValue * benchmarkReturn,
    ahead: portfolioReturn >= benchmarkReturn,
  }
}

function MirrorPortfolioChart({
  paper,
  range,
  view,
}: {
  paper: PaperWorkspaceFixture
  range: PortfolioRange
  view: PaperChartView
}) {
  const portfolioPoints = useMemo(
    () => filterRange(paper.equityHistory ?? [], range),
    [paper.equityHistory, range],
  )
  const benchmarkPoints = useMemo(
    () => filterRange(paper.benchmark?.history ?? [], range),
    [paper.benchmark?.history, range],
  )
  const firstPortfolioValue = paper.equityHistory?.[0]?.value ?? paper.portfolioValue
  const firstBenchmarkValue = paper.benchmark?.history.find((point) => point.value !== null)?.value ?? null
  const plottedPortfolio = portfolioPoints.map((point, index) => {
    const normalized = point.value / firstPortfolioValue - 1
    const peak = Math.max(
      firstPortfolioValue,
      ...portfolioPoints.slice(0, index + 1).map((candidate) => candidate.value),
    )
    return {
      timestamp: point.timestamp,
      value:
        view === "value"
          ? point.value
          : view === "performance"
            ? normalized
            : point.value / peak - 1,
    }
  })
  const plottedBenchmark = view === "drawdown" || !firstBenchmarkValue
    ? []
    : benchmarkPoints.flatMap((point) => point.value === null ? [] : [{
        timestamp: point.timestamp,
        value: view === "value"
          ? firstPortfolioValue * (point.value / firstBenchmarkValue)
          : point.value / firstBenchmarkValue - 1,
      }])
  const values = [...plottedPortfolio, ...plottedBenchmark].map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = Math.max(max - min, 1)
  const polyline = chartPolyline(plottedPortfolio, min, span)
  const benchmarkPolyline = chartPolyline(plottedBenchmark, min, span)

  const hasPortfolioEvidence = (paper.runs?.length ?? 0) > 0

  return (
    <div className="mt-5">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" />Paper</span>
        {view !== "drawdown" ? (
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-blue-500" />SPY</span>
        ) : null}
      </div>
      <div
        className="mt-2 h-52"
        role="img"
        aria-label={`${view === "value" ? "Account value" : view === "performance" ? "Performance versus SPY" : "Portfolio drawdown"} history`}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="size-full"
          aria-hidden="true"
        >
          <line
            x1="0"
            y1="88"
            x2="100"
            y2="88"
            stroke="currentColor"
            strokeOpacity="0.16"
            strokeDasharray="1 1"
          />
          <polyline
            points={polyline || "0,50 100,50"}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
          {benchmarkPolyline ? (
            <polyline
              points={benchmarkPolyline}
              fill="none"
              stroke="rgb(59 130 246)"
              strokeWidth="1.2"
              strokeDasharray="3 2"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
        </svg>
      </div>
      {!hasPortfolioEvidence ? (
        <p className="mt-2 text-sm text-muted-foreground">
          No completed runs yet. Paper remains flat from launch; SPY continues from the same launch baseline.
        </p>
      ) : null}
    </div>
  )
}

function chartPolyline(
  points: readonly { timestamp: string; value: number }[],
  min: number,
  span: number,
) {
  if (points.length === 1) return "0,50 100,50"
  return points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * 100
      const y = 88 - ((point.value - min) / span) * 68
      return `${x},${y}`
    })
    .join(" ")
}

function filterRange<TPoint extends { readonly timestamp: string }>(
  points: readonly TPoint[],
  range: PortfolioRange,
): TPoint[] {
  if (range === "ALL" || points.length < 2) return [...points]
  const end = new Date(points.at(-1)!.timestamp)
  const start = new Date(end)
  if (range === "1D") start.setDate(start.getDate() - 1)
  if (range === "1W") start.setDate(start.getDate() - 7)
  if (range === "1M") start.setMonth(start.getMonth() - 1)
  if (range === "3M") start.setMonth(start.getMonth() - 3)
  if (range === "YTD") start.setMonth(0, 1)
  if (range === "1Y") start.setFullYear(start.getFullYear() - 1)
  const filtered = points.filter((point) => new Date(point.timestamp) >= start)
  return filtered.length ? filtered : [points.at(-1)!]
}

export function PaperWorkspaceBottomPanel(props: {
  paper: PaperWorkspaceFixture
  activeTab: PaperDetailsTab
  expanded: boolean
  onActiveTabChange: (tab: PaperDetailsTab) => void
  onExpandedChange: (expanded: boolean) => void
  onOpenRun: (run: PaperRunFixture) => void
}) {
  const {
    paper,
    activeTab,
    expanded,
    onActiveTabChange,
    onExpandedChange,
    onOpenRun,
  } = props
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        onActiveTabChange(value as PaperDetailsTab)
        onExpandedChange(true)
      }}
      className="shrink-0 gap-0 border-t"
    >
      <div className="flex h-10 items-center justify-between gap-3 px-5 sm:h-11">
        <TabsList aria-label={`${paper.label} workspace panel`}>
          <TabsTrigger value="runs" onClick={() => onExpandedChange(true)}>
            Runs
          </TabsTrigger>
          <TabsTrigger value="positions" onClick={() => onExpandedChange(true)}>
            Positions
          </TabsTrigger>
          <TabsTrigger value="orders" onClick={() => onExpandedChange(true)}>
            Orders
          </TabsTrigger>
        </TabsList>
        {expanded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse Paper workspace panel"
            onClick={() => onExpandedChange(false)}
          >
            <ChevronDown />
          </Button>
        ) : null}
      </div>
      {expanded ? (
        <ScrollArea className="h-[min(18rem,42vh)] border-t px-5 py-3">
          <TabsContent value="runs">
            <RunsPanel paper={paper} onOpenRun={onOpenRun} />
          </TabsContent>
          <TabsContent value="positions">
            <PositionsPanel paper={paper} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersPanel paper={paper} />
          </TabsContent>
        </ScrollArea>
      ) : null}
    </Tabs>
  )
}

function RunsPanel({
  paper,
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  onOpenRun: (run: PaperRunFixture) => void
}) {
  const runs = [...(paper.runs ?? [])].reverse()
  return (
    <section>
      <p className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">
        Your strategy in action: researching and trading.
      </p>
      {runs.length ? (
        <div className="mt-3 divide-y rounded-lg border">
          {runs.map((run) => (
            <Button
              key={run.id}
              type="button"
              variant="ghost"
              className="h-auto w-full justify-between rounded-none px-4 py-3 text-left"
              onClick={() => onOpenRun(run)}
            >
              <span className="font-medium">{run.label}</span>
              <span className="text-xs font-normal text-muted-foreground">
                {run.completedAt}
              </span>
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          ))}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border px-4 py-6 text-center">
          <p className="text-sm font-medium">No completed runs yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The portfolio is tracking from launch. Its first completed schedule
            event will add a numbered run with decisions, orders, and account evidence.
          </p>
        </div>
      )}
    </section>
  )
}

function PaperRunWorkspace({
  run,
  activeTab,
  onActiveTabChange,
  onOpenPortfolio,
  onOpenRuns,
}: {
  run: PaperRunFixture
  activeTab: PaperRunTab
  onActiveTabChange: (tab: PaperRunTab) => void
  onOpenPortfolio: () => void
  onOpenRuns: () => void
}) {
  return (
    <section aria-labelledby="paper-run-title" className="space-y-3">
      <div className="-mx-5 -mt-5 border-b px-5 py-1.5 sm:py-2">
        <WorkspaceHeaderBreadcrumbs
          items={[
            { label: "Paper", onSelect: onOpenPortfolio },
            { label: "Runs", onSelect: onOpenRuns },
            { label: run.label },
          ]}
        />
      </div>
      <WorkspacePageHeader
        title={run.label}
        titleId="paper-run-title"
        badges={[{ label: run.status, variant: "secondary" }]}
        details={`Completed ${run.completedAt}`}
      />
      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as PaperRunTab)}
      >
        <div className="border-b pb-2 sm:pb-3">
          <TabsList aria-label={`${run.label} details`}>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="summary" className="space-y-4 pt-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <RunFact label="Started" value={run.startedAt ?? "Unavailable"} />
            <RunFact label="Duration" value={run.duration ?? "Unavailable"} />
            <RunFact label="Data cutoff" value={run.dataCutoff ?? "Unavailable"} />
            <RunFact
              label="Evaluated"
              value={run.evaluated === undefined ? "Unavailable" : String(run.evaluated)}
            />
          </div>

          <section className="overflow-hidden rounded-lg border" aria-labelledby="run-account-title">
            <div className="border-b px-4 py-3">
              <h2 id="run-account-title" className="text-sm font-semibold">Account change</h2>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <TableHeading>Measure</TableHeading>
                  <TableHeading>Before</TableHeading>
                  <TableHeading>After</TableHeading>
                </tr>
              </thead>
              <tbody>
                <AccountChangeRow
                  label="Account value"
                  before={run.beforeAccountValue}
                  after={run.afterAccountValue}
                />
                <AccountChangeRow
                  label="Buying power"
                  before={run.beforeBuyingPower}
                  after={run.afterBuyingPower}
                />
              </tbody>
            </table>
          </section>

          <section className="rounded-lg border" aria-labelledby="run-decisions-title">
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <h2 id="run-decisions-title" className="text-sm font-semibold">Decisions</h2>
              <span className="text-xs text-muted-foreground">
                {run.orders ?? 0} {(run.orders ?? 0) === 1 ? "order" : "orders"}
              </span>
            </div>
            {run.decisions?.length ? (
              <ul className="divide-y">
                {run.decisions.map((decision) => (
                  <li key={decision.id} className="px-4 py-3">
                    <p className="text-sm font-medium">{decision.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {decision.detail ?? "No additional detail was recorded."}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-5 text-sm text-muted-foreground">
                No expanded decisions were recorded for this run.
              </p>
            )}
          </section>
        </TabsContent>
        <TabsContent value="activity" className="pt-2">
          <section className="rounded-lg border" aria-labelledby="run-activity-title">
            <div className="border-b px-4 py-3">
              <h2 id="run-activity-title" className="text-sm font-semibold">Run activity</h2>
            </div>
            {run.activity?.length ? (
              <ol className="divide-y">
                {run.activity.map((event) => (
                  <li key={event.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
                    <time className="text-xs text-muted-foreground">{event.time}</time>
                    <div>
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="px-4 py-5 text-sm text-muted-foreground">
                No activity events were recorded for this run.
              </p>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function RunFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border px-3 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm leading-snug font-medium [text-wrap:balance]">{value}</p>
    </div>
  )
}

function AccountChangeRow({
  label,
  before,
  after,
}: {
  label: string
  before?: number
  after?: number
}) {
  return (
    <tr className="border-t">
      <th scope="row" className="px-3 py-3 text-left font-medium">{label}</th>
      <td className="px-3 py-3">
        {before === undefined ? "Unavailable" : <Money value={before} currency="USD" />}
      </td>
      <td className="px-3 py-3">
        {after === undefined ? "Unavailable" : <Money value={after} currency="USD" />}
      </td>
    </tr>
  )
}

function findRunForReference(
  runs: readonly PaperRunFixture[],
  reference: DomainObjectReference,
) {
  if (reference.kind === "run")
    return runs.find((run) => run.id === reference.id) ?? null
  if (reference.kind === "decision") {
    return (
      runs.find((run) =>
        run.decisions?.some((decision) => decision.id === reference.id),
      ) ?? null
    )
  }
  return null
}

function PositionsPanel({ paper }: { paper: PaperWorkspaceFixture }) {
  const [query, setQuery] = useState("")
  const currency = paper.currency ?? "USD"
  const positions = (paper.positionRows ?? []).filter((position) =>
    `${position.symbol} ${position.name ?? ""}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  return (
    <section aria-labelledby="positions-title" className="space-y-3">
      <div>
        <h2 id="positions-title" className="text-lg font-semibold">
          Positions
        </h2>
        <p className="text-sm text-muted-foreground">
          Open positions currently held by your champion.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <p className="text-sm">
            <strong>{paper.positionRows?.length ?? 0}</strong> open positions
          </p>
          <SearchField
            label="Search positions..."
            value={query}
            onChange={setQuery}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <TableHeading>Asset</TableHeading>
              <TableHeading>Position</TableHeading>
              <TableHeading align="right">Value</TableHeading>
              <TableHeading align="right">Return</TableHeading>
              <TableHeading align="right">Profit</TableHeading>
              <TableHeading align="right">Allocation</TableHeading>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr key={position.id ?? position.symbol} className="border-t">
                <th scope="row" className="px-3 py-3 text-left font-medium">
                  {position.symbol}
                </th>
                <td className="px-3 py-3 tabular-nums">
                  <OptionalNumber value={position.quantity} />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <OptionalMoney
                    value={position.marketValue}
                    currency={currency}
                  />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <OptionalPercentage
                    value={position.unrealizedReturn}
                    showSign
                  />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <OptionalMoney
                    value={position.unrealizedPnl}
                    currency={currency}
                    showSign
                  />
                </td>
                <td className="px-3 py-3 text-right tabular-nums">
                  <OptionalPercentage value={position.weight} />
                </td>
              </tr>
            ))}
            {!positions.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No open positions.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function OrdersPanel({ paper }: { paper: PaperWorkspaceFixture }) {
  const [query, setQuery] = useState("")
  const runsById = new Map((paper.runs ?? []).map((run) => [run.id, run]))
  const orders = (paper.orderRows ?? []).filter((order) =>
    `${order.symbol} ${order.side} ${order.status}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )
  return (
    <section aria-labelledby="orders-title" className="space-y-3">
      <div>
        <h2 id="orders-title" className="text-lg font-semibold">
          Orders
        </h2>
        <p className="text-sm text-muted-foreground">
          Orders placed by your champion.
        </p>
      </div>
      <div className="overflow-hidden rounded-lg border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <p className="text-sm">
            <strong>{paper.orderRows?.length ?? 0}</strong> orders
          </p>
          <SearchField
            label="Search orders..."
            value={query}
            onChange={setQuery}
          />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <TableHeading>Asset</TableHeading>
              <TableHeading>Order</TableHeading>
              <TableHeading>Status</TableHeading>
              <TableHeading>Expires</TableHeading>
              <TableHeading>Run</TableHeading>
              <TableHeading>Created</TableHeading>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <th scope="row" className="px-3 py-3 text-left font-medium">
                  {order.symbol}
                </th>
                <td className="px-3 py-3">
                  {order.side}
                  {order.quantity === undefined ? "" : ` · ${order.quantity}`}
                </td>
                <td className="px-3 py-3">{order.status}</td>
                <td className="px-3 py-3">
                  {order.timeInForce ?? "Unavailable"}
                </td>
                <td className="px-3 py-3">
                  {order.provenance?.runId
                    ? (runsById.get(order.provenance.runId)?.label ??
                      order.provenance.runId)
                    : "Unavailable"}
                </td>
                <td className="px-3 py-3">
                  {order.createdAt ?? "Unavailable"}
                </td>
              </tr>
            ))}
            {!orders.length ? (
              <tr>
                <td
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function SearchField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="relative block w-full max-w-64">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        aria-label={label}
        placeholder={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="pl-9"
      />
    </label>
  )
}

function OptionalMoney({
  value,
  currency,
  showSign = false,
}: {
  value: number | undefined
  currency: string
  showSign?: boolean
}) {
  if (value === undefined) return <>Unavailable</>
  return (
    <Money
      value={value}
      currency={currency}
      showSign={showSign}
      maximumFractionDigits={2}
    />
  )
}

function OptionalPercentage({
  value,
  showSign = false,
}: {
  value: number | undefined
  showSign?: boolean
}) {
  if (value === undefined) return <>Unavailable</>
  return <Percentage value={value} showSign={showSign} />
}

function OptionalNumber({ value }: { value: number | undefined }) {
  if (value === undefined) return <>Unavailable</>
  return (
    <>
      {new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(
        value,
      )}
    </>
  )
}

function TableHeading({
  children,
  align = "left",
}: {
  children: ReactNode
  align?: "left" | "right"
}) {
  return (
    <th
      scope="col"
      className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      {children}
    </th>
  )
}

export type PaperEquityPresentation =
  | { readonly state: "empty" }
  | { readonly state: "invalid"; readonly reason: string }
  | { readonly state: "ready"; readonly model: PortfolioEquityReadModel }

export function createPaperEquityPresentation(
  paper: PaperWorkspaceFixture,
): PaperEquityPresentation {
  if (!paper.equityHistory?.length) return { state: "empty" }
  if (!paper.runs?.length) {
    return {
      state: "invalid",
      reason:
        "Portfolio observations are present, but their completed run traces are missing.",
    }
  }
  const runsById = new Map(paper.runs.map((run) => [run.id, run]))
  const observations: PortfolioEquityObservation[] = []
  for (const point of paper.equityHistory) {
    const run = point.runId ? runsById.get(point.runId) : undefined
    if (!run) {
      return {
        state: "invalid",
        reason: `The observation at ${point.timestamp} does not resolve to a completed run trace.`,
      }
    }
    const decisionsById = new Map(
      run.decisions?.map((decision) => [decision.id, decision]) ?? [],
    )
    const decisionReferences = []
    for (const decisionId of point.decisionIds ?? []) {
      const decision = decisionsById.get(decisionId)
      if (!decision) {
        return {
          state: "invalid",
          reason: `${run.label} references a decision that is unavailable in its trace.`,
        }
      }
      decisionReferences.push({
        kind: "decision" as const,
        id: decision.id,
        label: decision.label,
      })
    }
    observations.push({
      timestamp: point.timestamp,
      value: point.value,
      quality: point.quality ?? "confirmed",
      reference: { kind: "run" as const, id: run.id, label: run.label },
      decisionReferences,
    })
  }
  const first = paper.equityHistory[0]
  const last = paper.equityHistory.at(-1) ?? first
  const benchmarkByTimestamp = new Map(
    paper.benchmark?.history.map((point) => [point.timestamp, point]) ?? [],
  )
  const benchmark = paper.benchmark
    ? {
        id: `${paper.label.toLowerCase().replaceAll(" ", "-")}-${paper.benchmark.symbol.toLowerCase()}`,
        symbol: paper.benchmark.symbol,
        label: paper.benchmark.label,
        methodology: paper.benchmark.methodology,
        points: observations.map((observation) => {
          const point = benchmarkByTimestamp.get(observation.timestamp)
          return {
            timestamp: observation.timestamp,
            value: point?.value ?? null,
            quality:
              point?.value == null
                ? ("missing" as const)
                : (point.quality ?? ("confirmed" as const)),
          }
        }),
      }
    : undefined
  return {
    state: "ready",
    model: {
      identity: {
        id: `${paper.label.toLowerCase().replaceAll(" ", "-")}-equity`,
        title: benchmark
          ? `Portfolio value vs ${benchmark.symbol}`
          : "Portfolio value by completed run",
        metric: "Portfolio equity",
        entity: paper.label,
        unit: {
          kind: "currency",
          currency: paper.currency ?? "USD",
          fractionDigits: 2,
        },
      },
      range: {
        id: "all",
        label: "Completed runs since launch",
        start: first.timestamp,
        end: last.timestamp,
        timeZone: paper.timeZone ?? "America/Chicago",
      },
      freshness: {
        state: last.quality === "estimated" ? "estimated" : "current",
        cutoff: last.timestamp,
      },
      status: {
        state: "ready",
        message: `${observations.length} completed ${observations.length === 1 ? "run" : "runs"}`,
      },
      cadence: {
        kind: "completed-run",
        label: `${paper.runCadence} observations`,
        disclosure:
          "Each point is recorded after a completed scheduled run. The dashed guide shows observation order and does not imply prices or portfolio values between runs.",
      },
      maxPoints: 240,
      series: { id: "paper-equity", label: paper.label, points: observations },
      benchmark,
    },
  }
}
