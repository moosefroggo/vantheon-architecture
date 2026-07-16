import { Ref } from "react"
import { ArrowRight, LockKeyhole } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

import type { onboardingFixture } from "./fixtures"

export type PaperOnboardingSurfaceProps = {
  paper: typeof onboardingFixture.paper
  containerRef?: Ref<HTMLElement>
  onContinueInDraft: () => void
}

export function PaperOnboardingSurface({
  paper,
  containerRef,
  onContinueInDraft,
}: PaperOnboardingSurfaceProps) {
  return (
    <section
      ref={containerRef}
      tabIndex={-1}
      aria-labelledby="paper-title"
      className="outline-none"
    >
      <Card>
        <CardHeader className="gap-3 border-b">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge variant="secondary">{paper.statusLabel}</Badge>
            <span className="text-muted-foreground">Simulated portfolio</span>
          </div>
          <div>
            <h1 id="paper-title" className="font-heading text-2xl font-medium leading-tight sm:text-3xl">
              {paper.label}: first evidence cycle
            </h1>
            <CardDescription className="mt-2 max-w-3xl">
              Strategy V1 is frozen here. Drafting V2 is separate and cannot change
              this portfolio.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <dl className="grid overflow-hidden rounded-lg border sm:grid-cols-3">
            <div className="p-4 sm:border-r">
              <dt className="text-xs text-muted-foreground">Running strategy</dt>
              <dd className="mt-1 flex items-center gap-2 text-sm font-medium">
                <LockKeyhole aria-hidden="true" className="size-4" />
                {paper.strategyLabel}
              </dd>
              <dd className="mt-1 text-xs text-muted-foreground">{paper.sourceLabel}</dd>
            </div>
            <div className="border-t p-4 sm:border-r sm:border-t-0">
              <dt className="text-xs text-muted-foreground">Simulated capital</dt>
              <dd className="mt-1 text-sm font-medium">{paper.capital}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">No brokerage connection</dd>
            </div>
            <div className="border-t p-4 sm:border-t-0">
              <dt className="text-xs text-muted-foreground">First scheduled run</dt>
              <dd className="mt-1 text-sm font-medium">{paper.nextRun}</dd>
            </div>
          </dl>

          <section aria-labelledby="paper-next-title">
            <h2 id="paper-next-title" className="text-base font-semibold">
              What happens next
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              The first run will show every rule evaluated, action, rejection, and
              market-data cutoff. A no-trade result is still explained evidence.
            </p>
          </section>
        </CardContent>

        <CardFooter className="justify-between gap-3 border-t">
          <p className="text-xs text-muted-foreground">
            Paper continues unchanged while Drafting V2 develops.
          </p>
          <Button type="button" onClick={onContinueInDraft}>
            Continue in Drafting V2
            <ArrowRight aria-hidden="true" data-icon="inline-end" />
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
