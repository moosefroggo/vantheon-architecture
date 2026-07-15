import { ArrowRight, Check, LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type EmptyEnvironmentWorkspaceProps = {
  environment: "Paper" | "Live"
  draftLabel: string
  evaluationComplete: boolean
  paperLaunched: boolean
  measurementComplete: boolean
  onAskAtlas: () => void
  onOpenDraft: () => void
  onRunDraft: () => void
  onReviewPaperLaunch: () => void
  onOpenPaper?: () => void
}

type JourneyStep = {
  number: number
  time: string
  title: string
  description: string
  complete: boolean
  marker?: string
  actionLabel: string
  action: () => void
}

export function EmptyEnvironmentWorkspace({
  environment,
  draftLabel,
  evaluationComplete,
  paperLaunched,
  measurementComplete,
  onAskAtlas,
  onOpenDraft,
  onRunDraft,
  onReviewPaperLaunch,
  onOpenPaper,
}: EmptyEnvironmentWorkspaceProps) {
  const steps: JourneyStep[] = [
    {
      number: 1,
      time: "2–10 mins",
      title: "Brainstorm with Atlas",
      description: "Describe the outcome, constraints, and risk you want Atlas to work within.",
      complete: true,
      actionLabel: "Explore with Atlas",
      action: onAskAtlas,
    },
    {
      number: 2,
      time: "30 secs",
      title: "Draft your strategy",
      description: "Inspect the structured strategy Atlas produced and change any rule directly.",
      complete: true,
      actionLabel: `Open ${draftLabel}`,
      action: onOpenDraft,
    },
    {
      number: 3,
      time: "2–5 mins",
      title: "Dry run the strategy",
      description: "Run the active Draft and inspect every rule, decision, and rejection.",
      complete: evaluationComplete,
      actionLabel: evaluationComplete ? "Open Dry Run" : "Dry Run",
      action: evaluationComplete ? onOpenDraft : onRunDraft,
    },
    {
      number: 4,
      time: "30 secs",
      title: "Promote to paper trading",
      description: "Freeze the tested checkpoint as Strategy V1 and start simulated trading.",
      complete: paperLaunched,
      marker: "→ V1",
      actionLabel: paperLaunched ? "Open Paper" : "Review Paper launch",
      action: paperLaunched && onOpenPaper ? onOpenPaper : onReviewPaperLaunch,
    },
    {
      number: 5,
      time: "1–14 days",
      title: "Measure performance",
      description: "Review at least 14 days and five completed runs before considering real capital.",
      complete: measurementComplete,
      marker: "14d · 5 runs",
      actionLabel: "Open Paper evidence",
      action: onOpenPaper ?? onOpenDraft,
    },
    {
      number: 6,
      time: "When ready",
      title: "Put your money to work",
      description: "Review the exact strategy, evidence, limits, brokerage, and capital impact.",
      complete: false,
      marker: "$",
      actionLabel: "Review Live readiness",
      action: onAskAtlas,
    },
  ]
  const currentStepIndex = Math.max(
    0,
    steps.findIndex((step) => !step.complete)
  )

  return (
    <section
      className="flex h-full min-h-0 flex-col"
      aria-label={`${environment} setup`}
    >
      <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-5">
        <div className="mx-auto max-w-3xl space-y-2">
          {steps.map((step, index) => {
            const isCurrent = index === currentStepIndex
            const locked = index > currentStepIndex

            if (!isCurrent) {
              return (
                <div
                  key={step.number}
                  className="flex min-h-14 items-center gap-3 rounded-lg border px-4 py-3"
                  aria-disabled={locked}
                >
                  <span className="w-20 shrink-0 text-xs text-muted-foreground">
                    {step.time}
                  </span>
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border text-xs">
                    {step.complete ? <Check className="size-3.5" /> : <LockKeyhole className="size-3" />}
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-medium">
                    Step {step.number} · {step.title}
                  </span>
                  {step.marker ? (
                    <Badge variant="secondary" className="shrink-0">
                      {step.marker}
                    </Badge>
                  ) : null}
                  {step.complete ? (
                    <Button type="button" variant="ghost" size="sm" onClick={step.action}>
                      Open
                    </Button>
                  ) : null}
                </div>
              )
            }

            return (
              <Card key={step.number}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{step.time}</span>
                    <span>Step {step.number}</span>
                    {step.marker ? <Badge variant="secondary">{step.marker}</Badge> : null}
                  </div>
                  <CardTitle role="heading" aria-level={2}>
                    {step.title}
                  </CardTitle>
                  <CardDescription>{step.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button type="button" onClick={step.action}>
                    {step.actionLabel}
                    <ArrowRight />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
