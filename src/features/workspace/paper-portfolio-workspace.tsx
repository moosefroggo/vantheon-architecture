"use client"

import { useState, type ReactNode } from "react"
import { ArrowRight, ChevronDown, LockKeyhole } from "lucide-react"

import { DrawdownEvidenceChart } from "@/components/domain/charts/drawdown-evidence-chart"
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
  DrawdownEvidenceReadModel,
  PortfolioEquityObservation,
  PortfolioEquityReadModel,
} from "@/lib/charts/contracts"

import { WorkspacePageHeader } from "./workspace-page-header"

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
  lifecycleOperation?: PaperLifecycleAction | null
  onStop?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
  onRunTabChange: (tab: PaperRunTab) => void
  onSelectedReferenceChange: (
    reference: DomainObjectReference | null
  ) => void
}

export type PaperDetailsTab = "runs" | "positions" | "orders" | "strategy"
export type PaperRunTab = "summary" | "activity"
export type PaperChartView = "value" | "performance" | "drawdown"

export function PaperPortfolioWorkspace({
  paper,
  selectedReference,
  runTab,
  onOpenDraft,
  lifecycleOperation = null,
  onStop,
  onArchive,
  onUnarchive,
  onRunTabChange,
  onSelectedReferenceChange,
}: PaperPortfolioWorkspaceProps) {
  const currency = paper.currency ?? "USD"
  const accountValue = paper.account?.accountValue ?? paper.portfolioValue
  const totalPnl = paper.account?.totalPnl
  const dailyPnl = paper.account?.dailyPnl ?? paper.dailyPnl
  const totalReturn = paper.account?.totalReturn ?? paper.totalReturn
  const cash = paper.account?.cash
  const buyingPower = paper.account?.buyingPower ?? paper.buyingPower
  const deployedValue =
    paper.account?.deployedValue ?? paper.account?.positionsMarketValue
  const grossExposure = paper.account?.grossExposure ?? paper.exposure
  const equityPresentation = createPaperEquityPresentation(paper)
  const equityChartHeight = getEquityChartHeight(paper.equityHistory?.length ?? 0)
  const operationalState =
    paper.operationalState ?? inferPaperOperationalState(paper.status)
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
          { label: availableText(paper.status), variant: "secondary" },
        ]}
        details={
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              {availableText(paper.strategy)}
            </span>
            <span>{availableText(paper.source)}</span>
          </div>
        }
        action={
          <div className="flex items-center gap-2">
            <PaperLifecycleControl
              state={operationalState}
              operation={lifecycleOperation}
              onStop={onStop}
              onArchive={onArchive}
              onUnarchive={onUnarchive}
            />
            <Button type="button" onClick={onOpenDraft}>
              Open Draft
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          </div>
        }
        className="pb-3"
      />

      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border sm:grid-cols-3 xl:grid-cols-6">
        <Metric label="Account value">
          <Money value={accountValue} currency={currency} />
        </Metric>
        <Metric
          label="Total P&amp;L"
          detail={
            <>
              <Percentage value={totalReturn} showSign /> return · Today{" "}
              <Money value={dailyPnl} currency={currency} showSign />
            </>
          }
        >
          <OptionalMoney value={totalPnl} currency={currency} showSign />
        </Metric>
        <Metric label="Cash">
          <OptionalMoney value={cash} currency={currency} />
        </Metric>
        <Metric
          label="Buying power"
          detail={paper.account?.reservedCash !== undefined ? (
            <>
              Reserved <Money value={paper.account.reservedCash} currency={currency} />
            </>
          ) : undefined}
        >
          <Money value={buyingPower} currency={currency} />
        </Metric>
        <Metric
          label="Deployed"
        >
          <OptionalMoney value={deployedValue} currency={currency} />
        </Metric>
        <Metric label="Gross exposure">
          <Percentage value={grossExposure} />
        </Metric>
      </dl>

      <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 border-y py-2 text-xs">
        {paper.account?.realizedPnl !== undefined ? (
          <OperationalFact label="Realized P&amp;L">
            <Money
              value={paper.account.realizedPnl}
              currency={currency}
              showSign
            />
          </OperationalFact>
        ) : null}
        {paper.account?.unrealizedPnl !== undefined ? (
          <OperationalFact label="Unrealized P&amp;L">
            <Money
              value={paper.account.unrealizedPnl}
              currency={currency}
              showSign
            />
          </OperationalFact>
        ) : null}
        {paper.account?.income !== undefined ? (
          <OperationalFact label="Income">
            <Money value={paper.account.income} currency={currency} showSign />
          </OperationalFact>
        ) : null}
        {paper.account?.fees !== undefined ? (
          <OperationalFact label="Fees">
            <Money value={paper.account.fees} currency={currency} />
          </OperationalFact>
        ) : null}
        {paper.account?.timeWeightedReturn !== undefined ? (
          <OperationalFact label="Time-weighted return">
            <Percentage value={paper.account.timeWeightedReturn} showSign />
          </OperationalFact>
        ) : null}
        <OperationalFact label="Max drawdown">
          <Percentage value={Math.abs(paper.maxDrawdown)} />
        </OperationalFact>
        <OperationalFact label="Positions">{paper.positions}</OperationalFact>
        <OperationalFact label="Open orders">{paper.openOrders}</OperationalFact>
        {equityPresentation.state === "ready" || paper.performanceModel || paper.drawdownModel ? (
          <OperationalFact label="Next run">
            {availableText(paper.nextRun)}
          </OperationalFact>
        ) : null}
        <OperationalFact label="Freshness">
          {availableText(paper.freshness)}
        </OperationalFact>
      </dl>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.65fr)]">
        <PaperChartViews
          paper={paper}
          valuePresentation={equityPresentation}
          height={equityChartHeight}
          onOpenReference={openEvidenceReference}
        />

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

function PaperChartViews({
  paper,
  valuePresentation,
  height,
  onOpenReference,
}: {
  paper: PaperWorkspaceFixture
  valuePresentation: PaperEquityPresentation
  height: number
  onOpenReference: (reference: DomainObjectReference) => void
}) {
  const valueModel = valuePresentation.state === "ready"
    ? {
        ...valuePresentation.model,
        identity: {
          ...valuePresentation.model.identity,
          title: "Portfolio value by completed run",
        },
        benchmark: undefined,
      }
    : null
  const performanceModel = paper.performanceModel ?? (
    valuePresentation.state === "ready" && valuePresentation.model.benchmark
      ? valuePresentation.model
      : null
  )
  const [activeView, setActiveView] = useState<PaperChartView>(() =>
    performanceModel ? "performance" : "value"
  )
  const resolvedActiveView =
    activeView === "performance" && !performanceModel
      ? "value"
      : activeView === "drawdown" && !paper.drawdownModel
        ? "value"
        : activeView

  return (
    <Tabs
      value={resolvedActiveView}
      onValueChange={(value) => setActiveView(value as PaperChartView)}
      className="gap-3"
    >
      <TabsList aria-label={`${paper.label} portfolio chart view`}>
        <TabsTrigger value="value">Value</TabsTrigger>
        <TabsTrigger value="performance" disabled={!performanceModel}>
          Performance
        </TabsTrigger>
        <TabsTrigger value="drawdown" disabled={!paper.drawdownModel}>
          Drawdown
        </TabsTrigger>
      </TabsList>

      <TabsContent value="value">
        {valueModel ? (
          <PortfolioEquityChart
            model={valueModel}
            height={height}
            onOpenReference={onOpenReference}
          />
        ) : valuePresentation.state === "invalid" ? (
          <InvalidHistorySurface reason={valuePresentation.reason} />
        ) : (
          <ZeroHistorySurface
            portfolioValue={paper.account?.accountValue ?? paper.portfolioValue}
            currency={paper.currency ?? "USD"}
            nextRun={paper.nextRun}
            benchmarkLabel={
              paper.benchmark?.label?.trim() || paper.benchmark?.symbol?.trim()
            }
          />
        )}
      </TabsContent>

      <TabsContent value="performance">
        {performanceModel ? (
          <PortfolioEquityChart
            model={performanceModel}
            height={height}
            onOpenReference={onOpenReference}
          />
        ) : (
          <UnavailableChartSurface
            title="Performance unavailable"
            detail="No traceable performance or benchmark read model was supplied."
          />
        )}
      </TabsContent>

      <TabsContent value="drawdown">
        {paper.drawdownModel ? (
          <DrawdownEvidenceChart model={paper.drawdownModel} height={height} />
        ) : (
          <UnavailableChartSurface
            title="Drawdown unavailable"
            detail="No drawdown evidence read model was supplied."
          />
        )}
      </TabsContent>
    </Tabs>
  )
}

function PaperLifecycleControl({
  state,
  operation,
  onStop,
  onArchive,
  onUnarchive,
}: {
  state: PaperOperationalState | null
  operation: PaperLifecycleAction | null
  onStop?: () => void
  onArchive?: () => void
  onUnarchive?: () => void
}) {
  if (state === "stopping") {
    return (
      <Button type="button" variant="destructive" disabled>
        Stopping…
      </Button>
    )
  }

  if ((state === "active" || state === "paused" || state === "degraded") && onStop) {
    return (
      <Button
        type="button"
        variant="destructive"
        disabled={operation === "stop"}
        onClick={onStop}
      >
        {operation === "stop" ? "Stopping…" : "Stop"}
      </Button>
    )
  }

  if (state === "stopped" && onArchive) {
    return (
      <Button
        type="button"
        variant="outline"
        disabled={operation === "archive"}
        onClick={onArchive}
      >
        {operation === "archive" ? "Archiving…" : "Archive"}
      </Button>
    )
  }

  if (state === "archived" && onUnarchive) {
    return (
      <Button
        type="button"
        variant="secondary"
        disabled={operation === "unarchive"}
        onClick={onUnarchive}
      >
        {operation === "unarchive" ? "Unarchiving…" : "Unarchive"}
      </Button>
    )
  }

  return null
}

function inferPaperOperationalState(status: string): PaperOperationalState | null {
  const normalized = status.trim().toLowerCase()

  if (normalized.includes("archived")) return "archived"
  if (normalized.includes("stopping")) return "stopping"
  if (normalized.includes("stopped") || normalized.includes("inactive")) {
    return "stopped"
  }
  if (normalized.includes("paused")) return "paused"
  if (normalized.includes("degraded")) return "degraded"
  if (normalized.includes("running") || normalized.includes("active")) {
    return "active"
  }

  return null
}

function UnavailableChartSurface({
  title,
  detail,
}: {
  title: string
  detail: string
}) {
  return (
    <section className="grid min-h-40 place-items-center rounded-lg border border-dashed p-5 text-center">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
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
            <PositionsPanel
              paper={paper}
              currency={paper.currency ?? "USD"}
              onOpenRun={onOpenRun}
            />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersPanel paper={paper} onOpenRun={onOpenRun} />
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
                {latestRun.decision ?? "Decision unavailable"} · {latestRun.completedAt}
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
    <div className="min-w-0 border-b border-r p-3 nth-[2n]:border-r-0 sm:nth-[2n]:border-r sm:nth-[3n]:border-r-0 xl:border-b-0 xl:nth-[3n]:border-r xl:nth-[6n]:border-r-0">
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

function OptionalMoney({
  value,
  currency,
  showSign = false,
  maximumFractionDigits,
}: {
  value: number | undefined
  currency: string
  showSign?: boolean
  maximumFractionDigits?: number
}) {
  if (value === undefined) return <>Unavailable</>

  return (
    <Money
      value={value}
      currency={currency}
      showSign={showSign}
      maximumFractionDigits={maximumFractionDigits}
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

function availableText(value: string | undefined) {
  return value?.trim() || "Unavailable"
}

function ZeroHistorySurface({
  portfolioValue,
  currency,
  nextRun,
  benchmarkLabel,
}: {
  portfolioValue: number
  currency: string
  nextRun: string
  benchmarkLabel?: string
}) {
  const benchmark = benchmarkLabel?.trim() || null
  const title = benchmark ? `Portfolio vs ${benchmark}` : "Portfolio value"

  return (
    <figure aria-labelledby="paper-equity-title">
      <Card>
        <CardHeader>
          <CardTitle id="paper-equity-title">{title}</CardTitle>
          <CardDescription>No completed runs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm">First run {availableText(nextRun)}</p>
          <p className="text-xs text-muted-foreground">
            Benchmark {benchmark ?? "Unavailable"}
          </p>
        </CardContent>
      </Card>
      <p className="sr-only">
        The portfolio has no return history. Its current and starting value is{" "}
        <Money value={portfolioValue} currency={currency} />.{" "}
        {benchmark
          ? `${benchmark} comparison begins after the first completed run.`
          : "Benchmark comparison is unavailable because no benchmark was supplied."}
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
                {run.status} · {run.completedAt} ·{" "}
                {run.decision ?? "Decision unavailable"}
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
  const hasRunContext = Boolean(
    run.portfolioReference ||
    run.strategyReference ||
    run.scheduleReference ||
    run.freshness ||
    run.failureReason ||
    run.cancellationReason
  )

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
            <p className="mt-1 text-sm text-muted-foreground">
              Completed {run.completedAt}
              {run.startedAt ? ` · Started ${run.startedAt}` : null}
            </p>
          </div>
          <dl className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <OperationalFact label="Elapsed">
              {run.duration ?? "Unavailable"}
            </OperationalFact>
            <OperationalFact label="Orders">
              {run.orders ?? "Unavailable"}
            </OperationalFact>
            <OperationalFact label="Run buying power">
              <OptionalMoney
                value={run.buyingPower}
                currency={paper.currency ?? "USD"}
              />
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
          <dl className="grid gap-px overflow-hidden rounded-lg bg-border sm:grid-cols-2 xl:grid-cols-4">
            <CompactFact label="Decision" value={run.decision ?? "Unavailable"} />
            <CompactFact label="Evaluated" value={run.evaluated ?? "Unavailable"} />
            <CompactFact label="Orders" value={run.orders ?? "Unavailable"} />
            <CompactFact
              label="Before account value"
              value={
                <OptionalMoney
                  value={run.beforeAccountValue}
                  currency={paper.currency ?? "USD"}
                />
              }
            />
            <CompactFact
              label="After account value"
              value={
                <OptionalMoney
                  value={run.afterAccountValue ?? run.accountValue}
                  currency={paper.currency ?? "USD"}
                />
              }
            />
            <CompactFact
              label="Before buying power"
              value={
                <OptionalMoney
                  value={run.beforeBuyingPower}
                  currency={paper.currency ?? "USD"}
                />
              }
            />
            <CompactFact
              label="After buying power"
              value={
                <OptionalMoney
                  value={run.afterBuyingPower ?? run.buyingPower}
                  currency={paper.currency ?? "USD"}
                />
              }
            />
            <CompactFact label="Started" value={run.startedAt ?? "Unavailable"} />
            <CompactFact label="Data cutoff" value={run.dataCutoff ?? "Unavailable"} />
          </dl>
          {hasRunContext ? (
            <section aria-labelledby={`${run.id}-context-title`} className="rounded-lg border">
              <h2
                id={`${run.id}-context-title`}
                className="border-b px-4 py-3 text-sm font-medium"
              >
                Run context
              </h2>
              <dl className="grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
                <CompactFact
                  label="Portfolio snapshot"
                  value={run.portfolioReference ?? "Unavailable"}
                />
                <CompactFact
                  label="Strategy snapshot"
                  value={run.strategyReference ?? "Unavailable"}
                />
                <CompactFact
                  label="Schedule"
                  value={run.scheduleReference ?? "Unavailable"}
                />
                <CompactFact
                  label="Freshness"
                  value={run.freshness ?? "Unavailable"}
                />
                {run.failureReason ? (
                  <CompactFact label="Failure reason" value={run.failureReason} />
                ) : null}
                {run.cancellationReason ? (
                  <CompactFact
                    label="Cancellation reason"
                    value={run.cancellationReason}
                  />
                ) : null}
              </dl>
            </section>
          ) : null}
          <DecisionTrace run={run} selectedDecisionId={selectedDecisionId} />
        </TabsContent>

        <TabsContent value="activity">
          {run.activity?.length ? (
            <ol className="divide-y rounded-lg border">
              {run.activity.map((event) => (
                <li key={event.id} className="grid gap-2 px-4 py-4 sm:grid-cols-[7rem_1fr]">
                  <time className="text-xs text-muted-foreground">{event.time}</time>
                  <div>
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{event.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyTableState
              title="Activity unavailable"
              detail="No event records were supplied for this run."
            />
          )}
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
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  currency: string
  onOpenRun: (run: PaperRunFixture) => void
}) {
  if (!paper.positionRows?.length) {
    return (
      <EmptyTableState
        title="No positions"
        detail="No position records were supplied."
      />
    )
  }

  return (
    <TableShell label={`${paper.label} positions`}>
      <thead className="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <TableHeading>Position</TableHeading>
          <TableHeading align="right">Quantity</TableHeading>
          <TableHeading align="right">Avg cost</TableHeading>
          <TableHeading align="right">Mark</TableHeading>
          <TableHeading align="right">Market value</TableHeading>
          <TableHeading align="right">Weight</TableHeading>
          <TableHeading align="right">Unrealized P&amp;L</TableHeading>
          <TableHeading align="right">Daily P&amp;L</TableHeading>
          <TableHeading>Evidence</TableHeading>
        </tr>
      </thead>
      <tbody>
        {paper.positionRows.map((position, index) => (
          <tr key={position.id ?? `${position.symbol}-${index}`} className="border-t align-top">
            <th scope="row" className="px-3 py-2 text-left font-medium">
              <span className="block">{position.symbol}</span>
              {position.name ? (
                <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                  {position.name}
                </span>
              ) : null}
            </th>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalNumber value={position.quantity} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalMoney
                value={position.averageCost}
                currency={currency}
                maximumFractionDigits={2}
              />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalMoney
                value={position.markPrice}
                currency={currency}
                maximumFractionDigits={2}
              />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalMoney value={position.marketValue} currency={currency} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalPercentage value={position.weight} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <span className="block">
                <OptionalMoney
                  value={position.unrealizedPnl}
                  currency={currency}
                  showSign
                  maximumFractionDigits={2}
                />
              </span>
              {position.unrealizedReturn !== undefined ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  <Percentage value={position.unrealizedReturn} showSign />
                </span>
              ) : null}
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalMoney
                value={position.dailyPnl}
                currency={currency}
                showSign
                maximumFractionDigits={2}
              />
            </td>
            <td className="px-3 py-2">
              <ProvenanceCell
                provenance={position.provenance}
                runs={paper.runs ?? []}
                onOpenRun={onOpenRun}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function OrdersPanel({
  paper,
  onOpenRun,
}: {
  paper: PaperWorkspaceFixture
  onOpenRun: (run: PaperRunFixture) => void
}) {
  if (!paper.orderRows?.length) {
    return <EmptyTableState title="No orders" detail="There are no open or historical orders." />
  }

  return (
    <TableShell label={`${paper.label} orders`}>
      <thead className="bg-muted/50 text-xs text-muted-foreground">
        <tr>
          <TableHeading>Order</TableHeading>
          <TableHeading>Side / type</TableHeading>
          <TableHeading align="right">Filled / quantity</TableHeading>
          <TableHeading align="right">Pricing</TableHeading>
          <TableHeading>Time in force</TableHeading>
          <TableHeading>Status</TableHeading>
          <TableHeading>Evidence</TableHeading>
          <TableHeading>Created</TableHeading>
        </tr>
      </thead>
      <tbody>
        {paper.orderRows.map((order) => (
          <tr key={order.id} className="border-t align-top">
            <th scope="row" className="px-3 py-2 text-left font-medium">
              <span className="block">{order.symbol}</span>
              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                {order.id}
              </span>
            </th>
            <td className="px-3 py-2">
              <span className="block">{order.side}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {order.orderType ?? "Unavailable"}
              </span>
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OptionalNumber value={order.filledQuantity} /> /{" "}
              <OptionalNumber value={order.quantity} />
            </td>
            <td className="px-3 py-2 text-right tabular-nums">
              <OrderPricing order={order} currency={paper.currency ?? "USD"} />
            </td>
            <td className="px-3 py-2">{order.timeInForce ?? "Unavailable"}</td>
            <td className="px-3 py-2">{order.status}</td>
            <td className="px-3 py-2">
              <ProvenanceCell
                provenance={order.provenance}
                runs={paper.runs ?? []}
                onOpenRun={onOpenRun}
              />
            </td>
            <td className="px-3 py-2">
              <span className="block">{order.createdAt ?? "Unavailable"}</span>
              {order.updatedAt ? (
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Updated {order.updatedAt}
                </span>
              ) : null}
            </td>
          </tr>
        ))}
      </tbody>
    </TableShell>
  )
}

function OptionalNumber({ value }: { value: number | undefined }) {
  if (value === undefined) return <>Unavailable</>

  return <>{new Intl.NumberFormat("en-US", { maximumFractionDigits: 6 }).format(value)}</>
}

function OrderPricing({
  order,
  currency,
}: {
  order: PaperOrderRow
  currency: string
}) {
  const hasPricing =
    order.averageFillPrice !== undefined ||
    order.limitPrice !== undefined ||
    order.stopPrice !== undefined

  if (!hasPricing) return <>Unavailable</>

  return (
    <span className="space-y-0.5">
      {order.averageFillPrice !== undefined ? (
        <span className="block">
          Avg fill{" "}
          <Money
            value={order.averageFillPrice}
            currency={currency}
            maximumFractionDigits={2}
          />
        </span>
      ) : null}
      {order.limitPrice !== undefined ? (
        <span className="block">
          Limit{" "}
          <Money
            value={order.limitPrice}
            currency={currency}
            maximumFractionDigits={2}
          />
        </span>
      ) : null}
      {order.stopPrice !== undefined ? (
        <span className="block">
          Stop{" "}
          <Money
            value={order.stopPrice}
            currency={currency}
            maximumFractionDigits={2}
          />
        </span>
      ) : null}
    </span>
  )
}

function ProvenanceCell({
  provenance,
  runs,
  onOpenRun,
}: {
  provenance: PaperRecordProvenance | undefined
  runs: readonly PaperRunFixture[]
  onOpenRun: (run: PaperRunFixture) => void
}) {
  const run = provenance?.runId
    ? runs.find((candidate) => candidate.id === provenance.runId)
    : undefined
  const runLabel = run?.label ?? provenance?.runLabel ?? provenance?.runId
  const decisionLabel = provenance?.decisionLabel ?? provenance?.decisionId
  const hasProvenance = Boolean(
    provenance?.source || provenance?.recordedAt || runLabel || decisionLabel
  )

  if (!hasProvenance) return <>Unavailable</>

  return (
    <span className="block min-w-28">
      {provenance?.source ? (
        <span className="block text-xs text-muted-foreground">
          {provenance.source}
        </span>
      ) : null}
      {runLabel ? (
        run ? (
          <Button
            type="button"
            variant="link"
            size="xs"
            className="h-auto justify-start p-0 text-left"
            onClick={() => onOpenRun(run)}
          >
            {runLabel}
          </Button>
        ) : (
          <span className="block">{runLabel}</span>
        )
      ) : null}
      {decisionLabel ? (
        <span className="block text-xs text-muted-foreground">
          Decision: {decisionLabel}
        </span>
      ) : null}
      {provenance?.recordedAt ? (
        <span className="block text-xs text-muted-foreground">
          Recorded {provenance.recordedAt}
        </span>
      ) : null}
    </span>
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
      <table className="w-full min-w-[72rem] text-sm">
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
