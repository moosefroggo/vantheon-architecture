"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCheckpointLabel } from "@/lib/version-labels"

import type {
  StrategyRuleFixture,
  WorkspaceEvaluationFixture,
} from "./workspace-fixtures"
import { WorkspaceHeaderBreadcrumbs } from "./workspace-header-breadcrumbs"

export type DryRunTab = "summary" | "activity"

type DryRunWorkspaceProps = {
  run: WorkspaceEvaluationFixture
  activeTab: DryRunTab
  onActiveTabChange: (tab: DryRunTab) => void
  onBack: () => void
  onOpenRuns: () => void
  onOpenSource?: (sourceArtifactId: string) => void
}

export function DryRunWorkspace({
  run,
  activeTab,
  onActiveTabChange,
  onBack,
  onOpenRuns,
  onOpenSource,
}: DryRunWorkspaceProps) {
  const eligibleDecisions = run.decisions.filter(
    (decision) => decision.outcome.toLowerCase() === "eligible"
  )
  const rejectedDecisions = run.decisions.filter(
    (decision) => decision.outcome.toLowerCase() !== "eligible"
  )
  const simulatedCapital =
    run.setup.find((item) => item.label === "Capital")?.value ?? "Not recorded"
  const dataCutoff =
    run.setup.find((item) => item.label === "Data cutoff")?.value ?? "Not recorded"

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label={`${run.label} details`}
    >
      <div className="shrink-0 border-b px-5 py-2">
        <WorkspaceHeaderBreadcrumbs
          items={[
            { label: "Drafting", onSelect: onBack },
            { label: "Dry Runs", onSelect: onOpenRuns },
            { label: run.label },
          ]}
        />
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as DryRunTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Completed</Badge>
            <p className="text-sm text-muted-foreground tabular-nums">
              {formatCheckpointLabel(run.checkpoint)} · {run.duration} ·{" "}
              {eligibleDecisions.length} eligible{" "}
              {eligibleDecisions.length === 1 ? "decision" : "decisions"} ·{" "}
              {run.orders?.length ?? 0} {(run.orders?.length ?? 0) === 1 ? "order" : "orders"} ·{" "}
              {simulatedCapital}
            </p>
          </div>
        </header>
        <div className="shrink-0 border-b px-5 py-3">
          <TabsList aria-label={`${run.label} details`}>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            <TabsContent value="summary" className="space-y-4">
              <SummaryTab
                run={run}
                eligibleDecisions={eligibleDecisions}
                rejectedDecisions={rejectedDecisions}
                dataCutoff={dataCutoff}
                onOpenSource={onOpenSource}
              />
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <ActivityTab run={run} dataCutoff={dataCutoff} />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </section>
  )
}

function SummaryTab({
  run,
  eligibleDecisions,
  rejectedDecisions,
  dataCutoff,
  onOpenSource,
}: {
  run: WorkspaceEvaluationFixture
  eligibleDecisions: WorkspaceEvaluationFixture["decisions"]
  rejectedDecisions: WorkspaceEvaluationFixture["decisions"]
  dataCutoff: string
  onOpenSource?: (sourceArtifactId: string) => void
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {`${eligibleDecisions.length} eligible decision${eligibleDecisions.length === 1 ? "" : "s"} and ${rejectedDecisions.length} rejected decision${rejectedDecisions.length === 1 ? "" : "s"} were recorded. ${run.orders?.length ?? 0} Evaluation order${(run.orders?.length ?? 0) === 1 ? " was" : "s were"} created.`}
          </p>
        </CardContent>
      </Card>

      <section className="rounded-lg border" aria-labelledby={`${run.id}-orders-title`}>
        <div className="border-b px-4 py-3">
          <h2 id={`${run.id}-orders-title`} className="text-sm font-semibold">
            Per-order breakdown
          </h2>
        </div>
        {run.orders?.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Simulated order</TableHead>
                <TableHead>Qualification</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {run.orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.symbol}</TableCell>
                  <TableCell>
                    {order.side} · {order.requestedQuantity} requested
                  </TableCell>
                  <TableCell>
                    Decision {order.decisionId} · {order.filledQuantity} filled
                  </TableCell>
                  <TableCell>{order.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-5 text-sm text-muted-foreground">
            No Evaluation orders were created. Eligible decisions remain decisions
            and are not counted as orders.
          </p>
        )}
      </section>

      {rejectedDecisions.length ? (
        <section className="rounded-lg border" aria-labelledby={`${run.id}-near-miss-title`}>
          <div className="border-b px-4 py-3">
            <h2 id={`${run.id}-near-miss-title`} className="text-sm font-semibold">
              What almost happened
            </h2>
          </div>
          <ul className="divide-y">
            {rejectedDecisions.map((decision) => (
              <li key={decision.id} className="px-4 py-3">
                <p className="text-sm font-medium">
                  {decision.symbol} · {decision.outcome}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {decision.evidence}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Data integrity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">Inputs were evaluated at the recorded cutoff.</p>
            <p className="mt-1 text-xs text-muted-foreground">{dataCutoff}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Takeaway</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              The run shows which candidates survived the strategy and where portfolio
              constraints prevented action. It did not change any deployed portfolio.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="rounded-lg border" aria-labelledby={`${run.id}-metrics-title`}>
        <div className="border-b px-4 py-3">
          <h2 id={`${run.id}-metrics-title`} className="text-sm font-semibold">
            Evidence versus {formatCheckpointLabel(run.baseline.checkpoint)}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>{formatCheckpointLabel(run.checkpoint)}</TableHead>
              <TableHead>{formatCheckpointLabel(run.baseline.checkpoint)}</TableHead>
              <TableHead>Delta</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.metrics.map((metric) => (
              <TableRow key={metric.id}>
                <TableCell className="font-medium">{metric.label}</TableCell>
                <TableCell>{metric.value}</TableCell>
                <TableCell>
                  {run.baseline.metrics.find((item) => item.id === metric.id)?.value ?? "—"}
                </TableCell>
                <TableCell>{metric.delta.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Immutable source artifacts</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {run.sourceArtifactIds?.length ? (
            run.sourceArtifactIds.map((sourceId) => (
              <Button
                key={sourceId}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenSource?.(sourceId)}
              >
                {sourceId}
              </Button>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">Unavailable</span>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function ActivityTab({
  run,
  dataCutoff,
}: {
  run: WorkspaceEvaluationFixture
  dataCutoff: string
}) {
  return (
    <>
      <ol className="divide-y rounded-lg border" aria-label="Dry Run activity">
        {run.events?.length ? (
          run.events.map((event) => (
            <ActivityStep
              key={event.id}
              title={`${titleCase(event.phase)} · ${titleCase(event.status)}`}
              detail={`${event.message} · ${event.occurredAt}`}
            />
          ))
        ) : (
          <ActivityStep
            title="Activity unavailable"
            detail={`No event stream was recorded. Data cutoff: ${dataCutoff}.`}
          />
        )}
      </ol>

      <section className="rounded-lg border" aria-labelledby={`${run.id}-conditions-title`}>
        <div className="border-b px-4 py-3">
          <h2 id={`${run.id}-conditions-title`} className="text-sm font-semibold">
            Entry condition checklist
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Condition</TableHead>
              <TableHead>Observed</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Result</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {run.ruleSnapshot.map((rule) => (
              <ConditionRow key={rule.id} rule={rule} run={run} />
            ))}
          </TableBody>
        </Table>
      </section>

      <section className="rounded-lg border" aria-labelledby={`${run.id}-inputs-title`}>
        <div className="border-b px-4 py-3">
          <h2 id={`${run.id}-inputs-title`} className="text-sm font-semibold">
            Inputs and assumptions
          </h2>
        </div>
        <dl className="divide-y">
          {run.setup.map((item) => (
            <div key={item.label} className="grid gap-1 px-4 py-3 sm:grid-cols-[10rem_1fr]">
              <dt className="text-xs font-medium text-muted-foreground">{item.label}</dt>
              <dd className="text-sm">{item.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  )
}

function ConditionRow({
  rule,
  run,
}: {
  rule: StrategyRuleFixture
  run: WorkspaceEvaluationFixture
}) {
  const result = run.ruleEvaluations?.find(
    (evaluation) => evaluation.ruleId === rule.id
  )

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{rule.group}</p>
        <p className="text-xs text-muted-foreground">{rule.name}</p>
      </TableCell>
      <TableCell>{rule.value}</TableCell>
      <TableCell>{result?.sourceArtifactId ?? "Unavailable"}</TableCell>
      <TableCell>
        <Badge variant={result?.status === "passed" ? "secondary" : "outline"}>
          {result ? titleCase(result.status) : "Unavailable"}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

function ActivityStep({ title, detail }: { title: string; detail: string }) {
  return (
    <li className="grid gap-1 px-4 py-4 sm:grid-cols-[12rem_1fr] sm:gap-4">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-sm text-muted-foreground">{detail}</p>
    </li>
  )
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ")
}
