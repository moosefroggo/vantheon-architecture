"use client"

import { LockKeyhole } from "lucide-react"

import { StrategyDocument } from "@/components/domain/strategy/strategy-document"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  ChangeSetRecord,
  DraftCheckpointRecord,
  EvaluationRecord,
  SourceArtifactRecord,
  WorkspaceScenario,
} from "./demo"
import type { DataView } from "./workspace-route"
import { WorkspacePageHeader } from "./workspace-page-header"

export function ChangeSetReviewWorkspace({
  changeSet,
  baseCheckpoint,
  currentCheckpoint,
  pending,
  error,
  onAccept,
  onReject,
  onBack,
}: {
  changeSet: ChangeSetRecord
  baseCheckpoint: DraftCheckpointRecord
  currentCheckpoint: DraftCheckpointRecord
  pending: boolean
  error: string | null
  onAccept: () => void
  onReject: () => void
  onBack: () => void
}) {
  const reviewable = changeSet.status === "proposed"
  const stale = currentCheckpoint.id !== changeSet.baseCheckpointId
  const baseLabel = checkpointDisplayLabel(baseCheckpoint)

  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label="Change set review">
      <WorkspacePageHeader
        title={changeSet.kind === "restore" ? "Restore proposal" : "Strategy change proposal"}
        badges={[
          { label: titleCase(changeSet.status) },
          { label: baseLabel, variant: "outline" },
        ]}
        details="Review the exact rule change. Only Accept creates the next checkpoint."
        action={
          <Button type="button" variant="outline" onClick={onBack}>
            Back to Draft
          </Button>
        }
      />

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          {stale ? (
            <div role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm">
              This proposal is stale: the current checkpoint no longer matches its exact base.
              Accept will return a conflict and create no checkpoint.
            </div>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>Current / Proposed</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rule</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Proposed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {changeSet.changes.map((change) => {
                    const rule = baseCheckpoint.strategy.sections
                      .flatMap((section) => section.rules)
                      .find((candidate) => candidate.id === change.ruleId)
                    return (
                      <TableRow key={change.ruleId}>
                        <TableCell className="font-medium">{rule?.label ?? change.ruleId}</TableCell>
                        <TableCell>{change.before}</TableCell>
                        <TableCell>{change.after}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <ReviewFact label="Your request" value={changeSet.motivation} />
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Change scope</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ReviewLine label="Base" value={baseLabel} />
              <ReviewLine label="Rules changed" value={String(changeSet.changes.length)} />
              <ReviewLine label="Unchanged rules" value={String(changeSet.unchangedRuleIds.length)} />
              <ReviewLine
                label="After acceptance"
                value="Run a new Evaluation before Paper"
              />
            </CardContent>
          </Card>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          {reviewable ? (
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={onReject}>
                Reject
              </Button>
              <Button type="button" disabled={pending || stale} onClick={onAccept}>
                {pending ? "Applying…" : "Accept and checkpoint"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This proposal is closed. Its history and receipt remain inspectable.
            </p>
          )}
        </aside>
      </div>
    </section>
  )
}

export function CheckpointDetailWorkspace({
  checkpoint,
  evaluation,
  isCurrent = false,
  onBack,
  onRestore,
}: {
  checkpoint: DraftCheckpointRecord
  evaluation?: EvaluationRecord
  isCurrent?: boolean
  onBack: () => void
  onRestore?: () => void
}) {
  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label="Checkpoint detail">
      <WorkspacePageHeader
        title={checkpointDisplayLabel(checkpoint)}
        badges={[
          { label: evaluation ? "Tested" : "Untested", variant: evaluation ? "secondary" : "outline" },
          { label: "Saved locally", variant: "outline" },
        ]}
        details={`Saved ${formatTimestamp(checkpoint.createdAt)}. Restoring creates a reviewed proposal and a new checkpoint; history never rewinds.`}
        action={
          <div className="flex gap-2">
            {!isCurrent && onRestore ? (
              <Button type="button" onClick={onRestore}>Restore as latest</Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onBack}>Back to Draft</Button>
          </div>
        }
      />
      <div className="mt-4">
        <Card>
          <CardHeader><CardTitle>{checkpoint.strategy.title}</CardTitle></CardHeader>
          <CardContent>
            <StrategyDocument
              objective={checkpoint.strategy.objective}
              rules={checkpoint.strategy.sections.flatMap((section) =>
                section.rules.map((rule) => ({
                  id: rule.id,
                  group: section.title,
                  name: rule.label,
                  value: rule.value,
                  constraint: rule.constraint ?? "No additional constraint",
                  rationale: rule.rationale,
                  dataRequirementIds: rule.dataRequirementIds,
                }))
              )}
              thesis={`This immutable snapshot records ${checkpoint.strategy.title} at ${checkpointDisplayLabel(checkpoint)}.`}
              sizingExample="Sizing follows the recorded portfolio rule and simulated-capital assumptions."
              rulePrecedence={checkpoint.strategy.sections.map((section) => section.title)}
              assumptions={checkpoint.strategy.assumptions}
              exclusions={checkpoint.strategy.exclusions}
              dataFailurePolicy="Unavailable inputs produce no order and an explicit unavailable rule result."
              cooldownPolicy="Re-entry is evaluated only on a later scheduled decision cycle."
            />
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

export function DataWorkspace({
  scenario,
  championId,
  activeTab,
  onTabChange,
  onOpenSource,
}: {
  scenario: WorkspaceScenario
  championId: string
  activeTab: DataView
  onTabChange: (tab: DataView) => void
  onOpenSource: (sourceId: string) => void
}) {
  const evaluations = Object.values(scenario.evaluations)
    .filter((evaluation) => evaluation.championId === championId)
    .sort((left, right) => right.startedAt.localeCompare(left.startedAt))
  const latest = evaluations[0]
  const draft = Object.values(scenario.drafts).find(
    (candidate) => candidate.championId === championId && candidate.status === "active"
  )
  const checkpoint = draft ? scenario.checkpoints[draft.currentCheckpointId] : undefined
  const rules = checkpoint?.strategy.sections.flatMap((section) => section.rules) ?? []
  const sources = [...new Set(evaluations.flatMap((evaluation) => evaluation.sourceArtifactIds))]
    .map((id) => scenario.sourceArtifacts[id])
    .filter((source): source is SourceArtifactRecord => Boolean(source))

  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Data">
      <WorkspacePageHeader
        title="Data"
        badges={[{ label: latest ? `Cutoff ${formatTimestamp(latest.setup.dataCutoff)}` : "No Evaluation" }]}
        details="Evaluation setup, available capabilities, demo bindings, and immutable source artifacts are represented separately."
        className="px-6 py-4"
      />
      <Tabs value={activeTab} onValueChange={(value) => onTabChange(value as DataView)} className="min-h-0 flex-1 px-6 pb-6">
        <TabsList>
          <TabsTrigger value="setup">Evaluation setup</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="bindings">Demo bindings</TabsTrigger>
          <TabsTrigger value="sources">Sources</TabsTrigger>
        </TabsList>
        <TabsContent value="setup"><EvaluationSetupCard evaluation={latest} scenario={scenario} /></TabsContent>
        <TabsContent value="capabilities">
          <SimpleTable
            headers={["Capability", "Status", "Freshness"]}
            rows={rules.map((rule) => [
              rule.dataRequirementIds.join(", ") || "Schedule clock",
              rule.dataRequirementIds.length ? "Bound in demo" : "Built-in",
              latest ? formatTimestamp(latest.setup.dataCutoff) : "Unavailable",
            ])}
          />
        </TabsContent>
        <TabsContent value="bindings">
          <SimpleTable
            headers={["Strategy rule", "Capability binding", "Failure behavior"]}
            rows={rules.map((rule) => [
              rule.label,
              rule.dataRequirementIds.join(", ") || "Schedule clock",
              "Unavailable result · no order",
            ])}
          />
        </TabsContent>
        <TabsContent value="sources">
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Artifact</TableHead><TableHead>Provider</TableHead><TableHead>As of</TableHead><TableHead /></TableRow></TableHeader>
              <TableBody>
                {sources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.dataset}</TableCell>
                    <TableCell>{source.provider}</TableCell>
                    <TableCell>{formatTimestamp(source.asOf)}</TableCell>
                    <TableCell className="text-right"><Button type="button" variant="ghost" size="sm" onClick={() => onOpenSource(source.id)}>Open</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

export function SourceArtifactWorkspace({
  source,
  onBack,
}: {
  source: SourceArtifactRecord
  onBack: () => void
}) {
  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label="Source artifact">
      <WorkspacePageHeader
        title={source.dataset}
        badges={[{ label: "Immutable source artifact" }]}
        details="This artifact is evidence referenced by rule evaluations; it is not a mutable dataset configuration."
        action={<Button type="button" variant="outline" onClick={onBack}>Back to Data</Button>}
      />
      <Card className="mt-4 max-w-3xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-4" /> Provenance</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ReviewLine label="Artifact ID" value={source.id} mono />
          <ReviewLine label="Provider" value={source.provider} />
          <ReviewLine label="As of" value={formatTimestamp(source.asOf)} />
          <ReviewLine label="Locator" value={source.immutableLocator} mono />
          <ReviewLine label="Revision" value={source.revision} />
        </CardContent>
      </Card>
    </section>
  )
}

export function UnavailableWorkspaceResource({
  label,
  onBack,
}: {
  label: string
  onBack: () => void
}) {
  return (
    <section className="grid h-full place-items-center p-6">
      <div className="max-w-md rounded-lg border p-6 text-center">
        <h1 className="text-lg font-semibold">{label} unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This ID does not belong to the selected Champion or is not present in the local demo authority.
        </p>
        <Button type="button" className="mt-4" onClick={onBack}>Back to workspace</Button>
      </div>
    </section>
  )
}

function EvaluationSetupCard({ evaluation, scenario }: { evaluation?: EvaluationRecord; scenario: WorkspaceScenario }) {
  if (!evaluation) return <p className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">Evaluation setup is unavailable.</p>
  const benchmark = scenario.benchmarks[evaluation.setup.benchmarkId]
  return (
    <SimpleTable
      headers={["Locked field", "Value"]}
      rows={[
        ["Checkpoint", evaluation.checkpointId],
        ["Strategy hash", evaluation.strategyHash],
        ["Universe / source", `${evaluation.setup.source.provider} · ${evaluation.setup.source.dataset}`],
        ["Benchmark", benchmark?.displayName ?? "Unavailable"],
        ["Window", `${evaluation.setup.window.start} – ${evaluation.setup.window.end}`],
        ["Capital", `$${evaluation.setup.startingCapital.toLocaleString()} simulated`],
        ["Costs", `${evaluation.setup.transactionCostBps} bps · ${evaluation.setup.fillModel}`],
        ["Timezone", evaluation.setup.timezone],
        ["Cutoff", formatTimestamp(evaluation.setup.dataCutoff)],
        ["Limitations", "Deterministic demo · no real orders or capital"],
      ]}
    />
  )
}

function SimpleTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader>
        <TableBody>{rows.map((row, index) => <TableRow key={index}>{row.map((value, cell) => <TableCell key={cell} className={cell === 0 ? "font-medium" : undefined}>{value}</TableCell>)}</TableRow>)}</TableBody>
      </Table>
    </div>
  )
}

function ReviewFact({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader><CardTitle>{label}</CardTitle></CardHeader><CardContent><p className="text-sm">{value}</p></CardContent></Card>
}

function ReviewLine({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className={mono ? "mt-1 break-all font-mono text-xs" : "mt-1"}>{value}</p></div>
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function checkpointDisplayLabel(checkpoint: DraftCheckpointRecord) {
  return `Strategy V${checkpoint.generation} · Checkpoint ${checkpoint.ordinal}`
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}
