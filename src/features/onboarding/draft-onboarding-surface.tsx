import { Ref } from "react"
import { ArrowRight, ChevronDown, ShieldCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

import type { onboardingFixture } from "./fixtures"

type DraftFixture = typeof onboardingFixture.draft
type EvaluationFixture = typeof onboardingFixture.evaluation

export type DraftOnboardingSurfaceProps = {
  draft: DraftFixture
  evaluation: EvaluationFixture
  draftLabel: string
  checkpointLabel: string
  evaluationComplete: boolean
  containerRef?: Ref<HTMLElement>
  onRunEvaluation: () => void
  onReviewPaperLaunch: () => void
}

export function DraftOnboardingSurface({
  draft,
  evaluation,
  draftLabel,
  checkpointLabel,
  evaluationComplete,
  containerRef,
  onRunEvaluation,
  onReviewPaperLaunch,
}: DraftOnboardingSurfaceProps) {
  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby="draft-title"
      className="outline-none"
    >
      <Card>
        <CardHeader className="gap-3 border-b">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {draftLabel}
          </p>
          <div>
            <h1 id="draft-title" className="font-heading text-2xl font-medium leading-tight sm:text-3xl">
              Lower-volatility momentum
            </h1>
            <CardDescription className="mt-2 max-w-3xl text-sm">
              {draft.intent}
            </CardDescription>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck aria-hidden="true" className="size-4" />
            No real money at risk
          </p>
        </CardHeader>

        <CardContent className="space-y-5">
          <dl className="grid overflow-hidden rounded-lg border md:grid-cols-3">
            <div className="p-4 md:border-r">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                What it buys
              </dt>
              <dd className="mt-2 text-sm font-medium">{draft.sections[1].value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{draft.sections[2].value}</dd>
            </div>
            <div className="border-t p-4 md:border-r md:border-t-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                When it acts
              </dt>
              <dd className="mt-2 text-sm font-medium">{draft.sections[5].value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{draft.sections[3].value}</dd>
            </div>
            <div className="border-t p-4 md:border-t-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Risk guardrails
              </dt>
              <dd className="mt-2 text-sm font-medium">{draft.sections[4].value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">No stale-data trading, leverage, or shorting</dd>
            </div>
          </dl>

          <details className="group rounded-lg border px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium">
              Review all strategy rules
              <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 border-t pt-4">
              <p className="mb-4 text-xs text-muted-foreground">
                Working source: {draftLabel} · {checkpointLabel}
              </p>
              <dl className="grid gap-x-6 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
                {draft.sections.map((section) => (
                  <div key={section.id}>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {section.label}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">{section.value}</dd>
                    <dd className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      {section.explanation}
                    </dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 grid gap-5 border-t pt-4 md:grid-cols-2">
                <section aria-labelledby="assumptions-title">
                  <h2 id="assumptions-title" className="text-xs font-semibold uppercase tracking-wide">
                    Assumptions
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {draft.assumptions.map((assumption) => <li key={assumption}>{assumption}</li>)}
                  </ul>
                </section>
                <section aria-labelledby="exclusions-title">
                  <h2 id="exclusions-title" className="text-xs font-semibold uppercase tracking-wide">
                    Exclusions
                  </h2>
                  <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                    {draft.exclusions.map((exclusion) => <li key={exclusion}>{exclusion}</li>)}
                  </ul>
                </section>
              </div>
            </div>
          </details>

          {evaluationComplete ? (
            <section aria-labelledby="evaluation-result-title" className="rounded-lg bg-muted/50 p-4" role="status">
              <h2 id="evaluation-result-title" className="text-sm font-semibold">
                Behavior-level evidence
              </h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Actions</dt><dd className="font-medium">{evaluation.result.actions}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Rejections</dt><dd className="font-medium">{evaluation.result.rejections}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Risk</dt><dd className="font-medium">{evaluation.result.risk}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Limitation</dt><dd className="font-medium">{evaluation.limitation}</dd></div>
              </dl>
              <p className="mt-3 text-xs font-medium">{evaluation.result.eligibility}</p>
            </section>
          ) : (
            <details className="group px-1">
              <summary className="flex w-fit cursor-pointer list-none items-center gap-1.5 text-sm font-medium">
                Review test setup
                <ChevronDown aria-hidden="true" className="size-4 transition-transform group-open:rotate-180" />
              </summary>
              <dl className="mt-3 grid gap-3 rounded-lg bg-muted/50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div><dt className="text-xs text-muted-foreground">Window</dt><dd className="font-medium">{evaluation.window}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Benchmark</dt><dd className="font-medium">{evaluation.benchmark}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Capital</dt><dd className="font-medium">{evaluation.capital}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Data cutoff</dt><dd className="font-medium">{evaluation.dataCutoff}</dd></div>
              </dl>
            </details>
          )}
        </CardContent>

        <CardFooter className="justify-end border-t">
          {evaluationComplete ? (
            <Button type="button" onClick={onReviewPaperLaunch}>
              Review &amp; start Paper
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          ) : (
            <Button type="button" onClick={onRunEvaluation}>
              Test {draftLabel}
              <ArrowRight aria-hidden="true" data-icon="inline-end" />
            </Button>
          )}
        </CardFooter>
      </Card>
    </section>
  )
}
