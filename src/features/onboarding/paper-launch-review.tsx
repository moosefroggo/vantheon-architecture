import { LockKeyhole } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { onboardingFixture } from "./fixtures"

export type PaperLaunchReviewProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  draft: typeof onboardingFixture.draft
  evaluation: typeof onboardingFixture.evaluation
  onConfirm: () => void
}

export function PaperLaunchReview({
  open,
  onOpenChange,
  draft,
  evaluation,
  onConfirm,
}: PaperLaunchReviewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Launch immutable Strategy V1 to Paper?</DialogTitle>
          <DialogDescription>
            Simulated capital only. Live remains unchanged.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <section className="rounded-lg border p-3" aria-labelledby="launch-source-title">
            <div className="flex items-center gap-2">
              <LockKeyhole aria-hidden="true" className="size-4" />
              <h2 id="launch-source-title" className="text-sm font-semibold">
                Exact source snapshot
              </h2>
            </div>
            <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted-foreground">Source</dt>
                <dd className="font-medium">Drafting V1 · Checkpoint 2</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Evaluation</dt>
                <dd className="font-medium">{evaluation.label}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Schedule</dt>
                <dd className="font-medium">{draft.sections[5].value}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Capital</dt>
                <dd className="font-medium">{evaluation.capital}</dd>
              </div>
            </dl>
          </section>

          <ol
            id="launch-lifecycle-title"
            className="space-y-1.5 rounded-lg bg-muted/50 p-3 text-sm"
          >
            <li><strong>Freeze:</strong> Strategy V1 becomes immutable.</li>
            <li><strong>Run:</strong> Paper starts with simulated capital.</li>
            <li><strong>Continue:</strong> Drafting V2 · Checkpoint 0 starts separately with the same content.</li>
          </ol>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Keep reviewing
          </Button>
          <Button type="button" onClick={onConfirm}>
            Confirm simulated launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
