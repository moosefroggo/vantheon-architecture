"use client"

import { type ReactNode } from "react"
import { ArrowRight, ChevronDown, LockKeyhole } from "lucide-react"

import { PortfolioEquityChart } from "@/components/domain/charts/portfolio-equity-chart"
import { Money } from "@/components/system/money"
import { Percentage } from "@/components/system/percentage"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type {
  DomainObjectReference,
  PortfolioEquityObservation,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts"

import { WorkspacePageHeader } from "./workspace-page-header"

export type PaperRunFixture = {
  readonly id: string
  readonly label: string
  readonly status: string
  readonly completedAt: string
  readonly decision: string
  readonly evaluated?: number
  readonly orders?: number
  readonly duration?: string
  readonly dataCutoff?: string
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
  readonly currency?: string
  readonly timeZone?: string
  readonly equityHistory?: readonly {
    readonly timestamp: string
    readonly value: number
    readonly quality?: "confirmed" | "estimated"
    readonly runId: string
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
  readonly runs?: readonly PaperRunFixture[]
  readonly positionRows?: readonly {
    readonly symbol: string
    readonly marketValue: number
    readonly weight: number
    readonly dailyPnl: number
  }[]
  readonly orderRows?: readonly {
    readonly id: string
    readonly symbol: string
    readonly side: string
    readonly quantity: number
    readonly status: string
  }[]
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
  onRunTabChange: (tab: PaperRunTab) => void
  onSelectedReferenceChange: (
    reference: DomainObjectReference | null
  ) => void
}

export type PaperDetailsTab = "runs" | "positions" | "orders" | "strategy"
export type PaperRunTab = "summary" | "activity"

export function PaperPortfolioWorkspace({
  paper,
  selectedReference,
  runTab,
  onOpenDraft,
  onRunTabChange,
  onSelectedReferenceChange,
}: PaperPortfolioWorkspaceProps) {
  const currency = paper.currency ?? "USD"
  const startingValue =
    paper.totalReturn > -1
      ? paper.portfolioValue / (1 + paper.totalReturn)
      : paper.portfolioValue
  const totalPnl = paper.portfolioValue - startingValue
  const deployedValue = Math.max(0, paper.portfolioValue - paper.buyingPower)
  const cashRatio = paper.portfolioValue
    ? paper.buyingPower / paper.portfolioValue
    : 0
  const equityPresentation = createPaperEquityPresentation(paper)
  const equityChartHeight = getEquityChartHeight(paper.equityHistory?.length ?? 0)
  const selectedRun = selectedReference
    ? findRunForReference(paper.runs ?? [], selectedReference)
    : null
  const selectedDecision =
    selectedRun && selectedReference?.kind === "decision"
      ? selectedRun.decisions?.find((decision) => decision.id === selectedReference.id)
      : null

  function openEvidenceReference(reference: DomainObjectReference) {
    onSelectedReferenceChange(reference)
  }

  if (selectedRun) {
    return (
      <PaperRunWorkspace
        paper={paper}
        run={selectedRun}
        selectedDecisionId={selectedDecision?.id ?? null}
        activeTab={runTab}
        onActiveTabChange={onRunTabChange}
      />
    )
  }

  return (
    <section aria-labelledby="paper-workspace-title" className="space-y-4">
      <WorkspacePageHeader
        title={paper.label}
        titleId="paper-workspace-title"
        badges={[
          { label: paper.status, variant: "secondary" },
          { label: "Simulated" },
        ]}
        details={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              {paper.strategy}
            </span>
            <span>{paper.source}</span>
          </div>
        }
        action={
          <Button type="button" onClick={onOpenDraft}>
            Open Draft
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Button>
        }
        className="pb-3"
      />

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-4">
        <Metric label="Portfolio value">
          <Money value={paper.portfolioValue} currency={currency} />
        </Metric>
        <Metric
          label="Profit & loss"
          detail={
            <>
              <Percentage value={paper.totalReturn} showSign /> total · Today{" "}
              <Money value={paper.dailyPnl} currency={currency} showSign />
            </>
          }
        >
          <Money value={totalPnl} currency={currency} showSign />
        </Metric>
        <Metric
          label="Buying power"
          detail={
            <>
              <Percentage value={cashRatio} /> cash
            </>
          }
        >
          <Money value={paper.buyingPower} currency={currency} />
        </Metric>
        <Metric
          label="Deployed"
          detail={
            <>
              <Percentage value={paper.exposure} /> of portfolio
            </>
          }
        >
          <Money value={deployedValue} currency={currency} />
        </Metric>
      </dl>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y py-2 text-xs">
        <OperationalFact label="Max drawdown">
          <Percentage value={Math.abs(paper.maxDrawdown)} />
        </OperationalFact>
        <OperationalFact label="Positions">{paper.positions}</OperationalFact>
        <OperationalFact label="Open orders">{paper.openOrders}</OperationalFact>
        {equityPresentation.state === "ready" ? (
          <OperationalFact label="Next run">{paper.nextRun}</OperationalFact>
        ) : null}
        <OperationalFact label="Freshness">{paper.freshness}</OperationalFact>
      </dl>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.65fr)]">
        {equityPresentation.state === "ready" ? (
          <PortfolioEquityChart
            model={equityPresentation.model}
            height={equityChartHeight}
            onOpenReference={openEvidenceReference}
          />
        ) : equityPresentation.state === "invalid" ? (
          <InvalidHistorySurface reason={equityPresentation.reason} />
        ) : (
          <ZeroHistorySurface
            portfolioValue={paper.portfolioValue}
            currency={currency}
            nextRun={paper.nextRun}
          />
        )}

        <LatestRunOverview
          paper={paper}
          onOpenRun={(run) =>
            onSelectedReferenceChange({ kind: "run", id: run.id, label: run.label })
          }
        />
      </div>
    </section>
  )
}

export function PaperWorkspaceBottomPanel({
  paper,
  activeTab,
  expanded,
  onActiveTabChange,
  onExpandedChange,
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  activeTab: PaperDetailsTab
  expanded: boolean
  onActiveTabChange: (tab: PaperDetailsTab) => void
  onExpandedChange: (expanded: boolean) => void
  onOpenRun: (run: PaperRunFixture) => void
}) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        onActiveTabChange(value as PaperDetailsTab)
        onExpandedChange(true)
      }}
      className="shrink-0 gap-0 border-t"
    >
      <div className="flex h-11 items-center justify-between gap-3 px-3">
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
          <TabsTrigger value="strategy" onClick={() => onExpandedChange(true)}>
            Strategy
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
        <ScrollArea className="h-52 border-t px-3 py-3">
          <TabsContent value="runs">
            <RunsPanel paper={paper} onOpenRun={onOpenRun} />
          </TabsContent>
          <TabsContent value="positions">
            <PositionsPanel paper={paper} currency={paper.currency ?? "USD"} />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersPanel paper={paper} />
          </TabsContent>
          <TabsContent value="strategy">
            <StrategyPanel paper={paper} />
          </TabsContent>
        </ScrollArea>
      ) : null}
    </Tabs>
  )
}

function LatestRunOverview({
  paper,
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  onOpenRun: (run: PaperRunFixture) => void
}) {
  const latestRun = paper.runs?.at(-1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest run</CardTitle>
        <CardDescription>{paper.runCadence}</CardDescription>
      </CardHeader>
      <CardContent>
        {latestRun ? (
          <Button
            type="button"
            variant="outline"
            className="h-auto w-full justify-between px-3 py-3 text-left"
            onClick={() => onOpenRun(latestRun)}
          >
            <span>
              <span className="block text-sm font-medium">{latestRun.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {latestRun.decision} · {latestRun.completedAt}
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        ) : (
          <div className="rounded-lg border border-dashed px-3 py-4">
            <p className="text-sm font-medium">No completed runs</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Next run {paper.nextRun}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function Metric({
  label,
  detail,
  children,
}: {
  label: string
  detail?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="min-w-0 border-b border-r p-3 nth-[2n]:border-r-0 sm:border-b-0 sm:nth-[2n]:border-r sm:nth-[4n]:border-r-0">
      <dt className="truncate text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 truncate text-base font-semibold tabular-nums">
        {children}
      </dd>
      {detail ? (
        <dd className="mt-0.5 truncate text-[0.6875rem] text-muted-foreground tabular-nums">
          {detail}
        </dd>
      ) : null}
    </div>
  )
}

function OperationalFact({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}

function ZeroHistorySurface({
  portfolioValue,
  currency,
  nextRun,
}: {
  portfolioValue: number
  currency: string
  nextRun: string
}) {
  return (
    <figure aria-labelledby="paper-equity-title">
      <Card>
        <CardHeader>
          <CardTitle id="paper-equity-title">Portfolio vs SPY</CardTitle>
          <CardDescription>No completed runs</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">First run {nextRun}</p>
        </CardContent>
      </Card>
      <p className="sr-only">
        The portfolio has no return history. Its current and starting value is{" "}
        <Money value={portfolioValue} currency={currency} />. SPY comparison begins
        after the first completed run.
      </p>
    </figure>
  )
}

function InvalidHistorySurface({ reason }: { reason: string }) {
  return (
    <section
      aria-labelledby="paper-equity-unavailable-title"
      className="grid min-h-40 place-items-center rounded-lg border border-dashed p-5 text-center"
    >
      <div className="max-w-sm">
        <h2 id="paper-equity-unavailable-title" className="text-sm font-semibold">
          Equity evidence unavailable
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">{reason}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          No curve is shown without a traceable completed-run record.
        </p>
      </div>
    </section>
  )
}

function RunsPanel({
  paper,
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  onOpenRun: (run: PaperRunFixture) => void
}) {
  if (!paper.runs?.length) {
    return (
      <section className="grid min-h-28 place-items-center rounded-lg border border-dashed p-5 text-center">
        <div>
          <p className="text-sm font-medium">No completed runs</p>
          <p className="mt-1 text-xs text-muted-foreground">Next run {paper.nextRun}</p>
        </div>
      </section>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="border-b px-4 py-3 text-sm font-medium">
        Completed runs ({paper.runs.length})
      </div>
      <div className="divide-y">
        {[...paper.runs].reverse().map((run) => (
          <Button
            key={run.id}
            type="button"
            variant="ghost"
            className="h-auto w-full justify-between rounded-none px-4 py-3 text-left"
            onClick={() => onOpenRun(run)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">{run.label}</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {run.completedAt} · {run.decision}
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </Button>
        ))}
      </div>
    </div>
  )
}

function PaperRunWorkspace({
  paper,
  run,
  selectedDecisionId,
  activeTab,
  onActiveTabChange,
}: {
  paper: PaperWorkspaceFixture
  run: PaperRunFixture
  selectedDecisionId: string | null
  activeTab: PaperRunTab
  onActiveTabChange: (tab: PaperRunTab) => void
}) {
  const activity =
    run.activity ??
    [
      {
        id: `${run.id}-started`,
        time: run.completedAt,
        title: "Run started",
        detail: `Loaded ${paper.strategy} and the current Paper portfolio state.`,
      },
      {
        id: `${run.id}-evaluated`,
        time: run.completedAt,
        title: `Evaluated ${run.evaluated ?? 0} candidates`,
        detail: "Applied universe, entry, portfolio, and risk rules in order.",
      },
      {
        id: `${run.id}-completed`,
        time: run.completedAt,
        title: run.orders ? `Created ${run.orders} orders` : "No orders created",
        detail: `Completed with decision: ${run.decision}.`,
      },
    ]

  return (
    <section aria-labelledby="paper-run-title" className="space-y-4">
      <header className="border-b pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 id="paper-run-title" className="text-2xl font-semibold tracking-tight">
                {run.label}
              </h1>
              <Badge variant="secondary">{run.status}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{run.completedAt}</p>
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <OperationalFact label="Elapsed">{run.duration ?? "8m 54s"}</OperationalFact>
            <OperationalFact label="Orders">{run.orders ?? 0}</OperationalFact>
            <OperationalFact label="Buying power">
              <Money value={paper.buyingPower} currency={paper.currency ?? "USD"} />
            </OperationalFact>
          </dl>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as PaperRunTab)}
        className="mt-4 gap-4"
      >
        <TabsList aria-label={`${run.label} details`}>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <dl className="grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-4">
            <CompactFact label="Decision" value={run.decision} />
            <CompactFact label="Evaluated" value={run.evaluated ?? 0} />
            <CompactFact label="Orders" value={run.orders ?? 0} />
            <CompactFact label="Data cutoff" value={run.dataCutoff ?? "Unavailable"} />
          </dl>
          <DecisionTrace run={run} selectedDecisionId={selectedDecisionId} />
        </TabsContent>

        <TabsContent value="activity">
          <ol className="divide-y rounded-lg border">
            {activity.map((event) => (
              <li key={event.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr]">
                <time className="text-xs text-muted-foreground">{event.time}</time>
                <div>
                  <p className="text-sm font-medium">{event.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                </div>
              </li>
            ))}
          </ol>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function DecisionTrace({
  run,
  selectedDecisionId,
}: {
  run: PaperRunFixture
  selectedDecisionId: string | null
}) {
  if (!run.decisions?.length) {
    return (
      <EmptyTableState
        title="No individual decision records"
        detail="This run completed without an expanded candidate trace."
      />
    )
  }

  return (
    <section aria-labelledby={`${run.id}-decisions-title`} className="rounded-lg border">
      <h2 id={`${run.id}-decisions-title`} className="border-b px-4 py-3 text-sm font-medium">
        Decision trace
      </h2>
      <ul className="divide-y">
        {run.decisions.map((decision) => (
          <li
            key={decision.id}
            className={selectedDecisionId === decision.id ? "bg-muted/50 px-4 py-3" : "px-4 py-3"}
          >
            <p className="text-sm font-medium">{decision.label}</p>
            {decision.detail ? (
              <p className="mt-1 text-sm text-muted-foreground">{decision.detail}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

function findRunForReference(
  runs: readonly PaperRunFixture[],
  reference: DomainObjectReference,
) {
  if (reference.kind === "run") {
    return runs.find((run) => run.id === reference.id) ?? null
  }

  if (reference.kind === "decision") {
    return runs.find((run) =>
      run.decisions?.some((decision) => decision.id === reference.id)
    ) ?? null
  }

  return null
}

function PositionsPanel({
  paper,
  currency,
}: {
  paper: PaperWorkspaceFixture
  currency: string
}) {
  if (!paper.positionRows?.length) {
    return <EmptyTableState title="No positions" detail="Exposure is 0%." />
  }

  return (
    <TableShell label={`${paper.label} positions`}>
      <thead className="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <TableHeading>Symbol</TableHeading>
          <TableHeading align="right">Market value</TableHeading>
          <TableHeading align="right">Weight</TableHeading>
          <TableHeading align="right">Daily P&amp;L</TableHeading>
        </tr>
      </thead>
      <tbody>
        {paper.positionRows.map((position) => (
          <tr key={position.symbol} className="border-t">
            <th scope="row" className="px-3 py-2 text-left font-medium">{position.symbol}</th>
            <td className="px-3 py-2 text-right tabular-nums"><Money value={position.marketValue} currency={currency} /></td>
            <td className="px-3 py-2 text-right tabular-nums"><Percentage value={position.weight} /></td>
            <td className="px-3 py-2 text-right tabular-nums"><Money value={position.dailyPnl} currency={currency} showSign maximumFractionDigits={2} /></td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function OrdersPanel({ paper }: { paper: PaperWorkspaceFixture }) {
  if (!paper.orderRows?.length) {
    return <EmptyTableState title="No orders" detail="There are no open or historical orders." />
  }

  return (
    <TableShell label={`${paper.label} orders`}>
      <thead className="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <TableHeading>Symbol</TableHeading>
          <TableHeading>Side</TableHeading>
          <TableHeading align="right">Quantity</TableHeading>
          <TableHeading>Status</TableHeading>
        </tr>
      </thead>
      <tbody>
        {paper.orderRows.map((order) => (
          <tr key={order.id} className="border-t">
            <th scope="row" className="px-3 py-2 text-left font-medium">{order.symbol}</th>
            <td className="px-3 py-2">{order.side}</td>
            <td className="px-3 py-2 text-right tabular-nums">{order.quantity}</td>
            <td className="px-3 py-2">{order.status}</td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function StrategyPanel({ paper }: { paper: PaperWorkspaceFixture }) {
  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <LockKeyhole aria-hidden="true" className="size-3.5" />
          {paper.strategy}
        </span>
        <span className="text-xs text-muted-foreground">{paper.source}</span>
      </div>
      {paper.strategyRules?.length ? (
        <dl className="divide-y">
          {paper.strategyRules.map((rule) => (
            <div key={rule.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr] sm:gap-4">
              <dt className="text-xs font-medium text-muted-foreground">{rule.label}</dt>
              <dd className="text-sm">{rule.value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-4 py-5 text-sm text-muted-foreground">
          The frozen strategy remains available by exact source reference.
        </p>
      )}
    </div>
  )
}

function CompactFact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="bg-background px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium tabular-nums">{value}</dd>
    </div>
  )
}

function EmptyTableState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-28 place-items-center rounded-lg border border-dashed p-5 text-center">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  )
}

function TableShell({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-lg text-sm">
        <caption className="sr-only">{label}</caption>
        {children}
      </table>
    </div>
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
    <th scope="col" className={`px-3 py-2 font-medium ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  )
}

export type PaperEquityPresentation =
  | { readonly state: "empty" }
  | { readonly state: "invalid"; readonly reason: string }
  | { readonly state: "ready"; readonly model: PortfolioEquityReadModel }

export function createPaperEquityPresentation(
  paper: PaperWorkspaceFixture
): PaperEquityPresentation {
  if (!paper.equityHistory?.length) return { state: "empty" }

  if (!paper.runs?.length) {
    return {
      state: "invalid",
      reason: "Portfolio observations are present, but their completed run traces are missing.",
    }
  }

  const runsById = new Map(paper.runs.map((run) => [run.id, run]))
  const observations: PortfolioEquityObservation[] = []

  for (const point of paper.equityHistory) {
    const run = runsById.get(point.runId)

    if (!run) {
      return {
        state: "invalid",
        reason: `The observation at ${point.timestamp} does not resolve to a completed run trace.`,
      }
    }

    const decisionsById = new Map(
      run.decisions?.map((decision) => [decision.id, decision]) ?? []
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
      reference: {
        kind: "run" as const,
        id: run.id,
        label: run.label,
      },
      decisionReferences,
    })
  }

  const first = paper.equityHistory[0]
  const last = paper.equityHistory.at(-1) ?? first
  const timeZone = paper.timeZone ?? "America/Chicago"
  const benchmarkByTimestamp = new Map(
    paper.benchmark?.history.map((point) => [point.timestamp, point]) ?? []
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
            quality: point?.value == null ? "missing" as const : point.quality ?? "confirmed" as const,
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
        timeZone,
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
        disclosure: "Each point is recorded after a completed scheduled run. The dashed guide shows observation order and does not imply prices or portfolio values between runs.",
      },
      maxPoints: 240,
      series: {
        id: "paper-equity",
        label: paper.label,
        points: observations,
      },
      benchmark,
    },
  }
}

function getEquityChartHeight(completedPoints: number) {
  if (completedPoints <= 4) return 192
  if (completedPoints <= 12) return 208
  return 224
}
