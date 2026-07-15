import { Check } from "lucide-react"

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { cn } from "@/lib/utils"

const steps = ["Intent", "Draft", "Evidence", "Paper"] as const

export type OnboardingProgressProps = {
  currentStep: 1 | 2 | 3 | 4
}

export function OnboardingProgress({ currentStep }: OnboardingProgressProps) {
  return (
    <section aria-labelledby="onboarding-progress-title" className="space-y-3">
      <Progress
        value={currentStep * 25}
        aria-label={`Onboarding progress: step ${currentStep} of ${steps.length}`}
      >
        <ProgressLabel id="onboarding-progress-title">Onboarding to value</ProgressLabel>
        <ProgressValue>{() => `${currentStep} of ${steps.length}`}</ProgressValue>
      </Progress>
      <ol className="grid grid-cols-4 gap-2 text-xs">
        {steps.map((step, index) => {
          const stepNumber = index + 1
          const isComplete = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <li
              key={step}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-1.5 text-muted-foreground",
                (isComplete || isCurrent) && "text-foreground"
              )}
            >
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6875rem] font-medium">
                {isComplete ? <Check aria-hidden="true" className="size-3" /> : stepNumber}
              </span>
              <span className="truncate">{step}</span>
              <span className="sr-only">
                {isComplete ? "completed" : isCurrent ? "current" : "upcoming"}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
