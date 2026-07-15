"use client"

import type { ReactNode } from "react"
import { ArrowLeft, MessageSquareText } from "lucide-react"

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

import type {
  StrategyRuleFixture,
  WorkspaceEvaluationFixture,
} from "./workspace-fixtures"

export type DryRunTab = "summary" | "activity"

type DryRunWorkspaceProps = {
  run: WorkspaceEvaluationFixture
  draftLabel: string
  activeTab: DryRunTab
  onActiveTabChange: (tab: DryRunTab) => void
  onBack: () => void
  onAskAtlas: () => void
}

export function DryRunWorkspace({
  run,
  draftLabel,
  activeTab,
  onActiveTabChange,
  onBack,
  onAskAtlas,
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
    <section className="flex h-full min-h-0 flex-col" aria-labelledby="dry-run-title">
      <header className="shrink-0 border-b px-5 py-4">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft />
          {draftLabel} · Dry Runs
        </Button>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="dry-run-title" className="text-2xl font-semibold tracking-tight">
                {run.label}
              </h1>
              <Badge variant="secondary">Completed</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {draftLabel} · Checkpoint {run.checkpoint}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" onClick={onAskAtlas}>
              <MessageSquareText />
              Ask Atlas
            </Button>
          </div>
        </div>

        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <RunFact label="Elapsed">{run.duration}</RunFact>
          <RunFact label="Simulated orders">{eligibleDecisions.length}</RunFact>
          <RunFact label="Simulated capital">{simulatedCapital}</RunFact>
        </dl>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as DryRunTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="shrink-0 border-b px-5 py-2">
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
}: {
  run: WorkspaceEvaluationFixture
  eligibleDecisions: WorkspaceEvaluationFixture["decisions"]
  rejectedDecisions: WorkspaceEvaluationFixture["decisions"]
  dataCutoff: string
}) {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Outcome</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {eligibleDecisions.length
              ? `${eligibleDecisions.length} candidate${eligibleDecisions.length === 1 ? "" : "s"} qualified for simulated orders. ${rejectedDecisions.length} did not pass every constraint.`
              : `No simulated orders qualified. ${rejectedDecisions.length} candidate${rejectedDecisions.length === 1 ? "" : "s"} were rejected by the strategy.`}
          </p>
        </CardContent>
      </Card>

      <section className="rounded-lg border" aria-labelledby={`${run.id}-orders-title`}>
        <div className="border-b px-4 py-3">
          <h2 id={`${run.id}-orders-title`} className="text-sm font-semibold">
            Per-order breakdown
          </h2>
        </div>
        {eligibleDecisions.length ? (
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
              {eligibleDecisions.map((decision) => (
                <TableRow key={decision.id}>
                  <TableCell className="font-medium">{decision.symbol}</TableCell>
                  <TableCell>Buy · sized by portfolio rules</TableCell>
                  <TableCell>{decision.evidence}</TableCell>
                  <TableCell>Proposed</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="px-4 py-5 text-sm text-muted-foreground">
            No simulated orders were created.
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
            Evidence versus {run.baseline.checkpoint}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Metric</TableHead>
              <TableHead>{run.checkpoint}</TableHead>
              <TableHead>{run.baseline.checkpoint}</TableHead>
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
        <ActivityStep
          title="Loaded the Draft checkpoint"
          detail={`Bound the run to ${run.checkpoint} and preserved its rule snapshot.`}
        />
        <ActivityStep
          title="Loaded evaluation inputs"
          detail={`Market, fundamental, and portfolio inputs were read at ${dataCutoff}.`}
        />
        <ActivityStep
          title="Applied strategy and risk conditions"
          detail={`${run.decisions.length} recorded candidate decisions were checked against the exact rule snapshot.`}
        />
        <ActivityStep
          title="Recorded the result"
          detail={`${run.eligibility.label}. The Dry Run and its evidence are immutable.`}
        />
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
  const blockedDecision = run.decisions.find(
    (decision) =>
      decision.outcome.toLowerCase() !== "eligible" && decision.ruleIds.includes(rule.id)
  )

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium">{rule.group}</p>
        <p className="text-xs text-muted-foreground">{rule.name}</p>
      </TableCell>
      <TableCell>{rule.value}</TableCell>
      <TableCell>{rule.constraint}</TableCell>
      <TableCell>
        <Badge variant={blockedDecision ? "outline" : "secondary"}>
          {blockedDecision ? "Blocked candidate" : "Passed"}
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

function RunFact({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{children}</dd>
    </div>
  )
}
