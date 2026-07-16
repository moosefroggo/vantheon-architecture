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
import type {
  ChangeSetRecord,
  DraftCheckpointRecord,
  EvaluationRecord,
  SourceArtifactRecord,
} from "./demo"
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

export function DataWorkspace() {
  return (
    <section className="flex h-full min-h-0 flex-col" aria-label="Datasets">
      <WorkspacePageHeader
        title="Datasets"
        details="Everything your champion has access to."
        className="px-6 py-4"
      />
      <div className="min-h-0 flex-1 overflow-auto px-6 pb-6">
        <div className="space-y-7">
          {datasetGroups.map((group) => (
            <section key={group.label} aria-labelledby={`dataset-${group.slug}`}>
              <h2
                id={`dataset-${group.slug}`}
                className="mb-3 text-xs font-semibold uppercase tracking-wide"
              >
                {group.label}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item) => (
                  <Card key={item.label} className="shadow-none">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{item.label}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
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
        action={<Button type="button" variant="outline" onClick={onBack}>Back to Datasets</Button>}
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

const datasetGroups = [
  {
    label: "Portfolio",
    slug: "portfolio",
    items: [
      { label: "Positions", description: "What the champion currently holds, with size and value." },
      { label: "Buying Power", description: "How much cash the strategy has to spend on new buys right now." },
    ],
  },
  {
    label: "Research & News",
    slug: "research-news",
    items: [
      { label: "Asset Search", description: "Look up any stock, coin, or option by name or ticker." },
      { label: "Web Search", description: "Quick answers and links from across the web on any topic." },
      { label: "Deep Research", description: "A deeper, multi-source dig when a quick search isn’t enough." },
      { label: "Stock Screener", description: "Find stocks that match filters like size, industry, or dividend." },
      { label: "News", description: "Recent news articles about a company or the market." },
      { label: "Fundamentals", description: "A company’s earnings, revenue, debt, and financial health." },
      { label: "Market Info", description: "Whether the market is open, plus movers and key dates." },
      { label: "Macro Economics", description: "The economy and market at a glance: inflation, rates, the VIX." },
    ],
  },
  {
    label: "Prices & Charts",
    slug: "prices-charts",
    items: [
      { label: "Price History", description: "How a stock or coin has traded over time, from minutes to years." },
      { label: "Live Quotes", description: "The current price, bid, and ask for any ticker right now." },
      { label: "Technical Indicators", description: "Chart signals like RSI and moving averages built from prices." },
    ],
  },
  {
    label: "Options",
    slug: "options",
    items: [
      { label: "Options Chains", description: "Every option contract available for a stock, with its prices." },
      { label: "Options Greeks", description: "How an option’s price reacts to moves, time, and volatility." },
      { label: "Volatility Surface", description: "How expensive options are across strikes and expirations." },
      { label: "Options Flow", description: "Unusual options bets as they happen, and how they lean." },
    ],
  },
  {
    label: "Who's Buying & Selling",
    slug: "buying-selling",
    items: [
      { label: "Dark Pool", description: "Large trades made privately, away from the public exchanges." },
      { label: "Congressional Trades", description: "Stocks that members of Congress have recently bought and sold." },
      { label: "Insider Trades", description: "Stocks that a company’s own executives have bought and sold." },
    ],
  },
] as const

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
