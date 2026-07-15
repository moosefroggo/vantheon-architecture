import { ArrowLeft, Check, Minus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export type EmptyEnvironmentWorkspaceProps = {
  environment: "Paper" | "Live"
  draftLabel: string
  evaluationComplete: boolean
  paperLaunched: boolean
  onOpenDraft: () => void
  onOpenPaper?: () => void
}

export function EmptyEnvironmentWorkspace({
  environment,
  draftLabel,
  evaluationComplete,
  paperLaunched,
  onOpenDraft,
  onOpenPaper,
}: EmptyEnvironmentWorkspaceProps) {
  const isPaper = environment === "Paper"
  const checks = isPaper
    ? [
        { label: "Structured Draft", complete: true },
        { label: "Transparent evaluation", complete: evaluationComplete },
        { label: "Paper portfolio", complete: paperLaunched },
      ]
    : [
        { label: "Paper strategy", complete: paperLaunched },
        { label: "Observation evidence", complete: false },
        { label: "Live review", complete: false },
      ]

  return (
    <section className="flex h-full min-h-0 flex-col" aria-labelledby={`${environment.toLowerCase()}-empty-title`}>
      <header className="flex min-h-16 items-center gap-3 border-b px-4 py-3 sm:px-5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 id={`${environment.toLowerCase()}-empty-title`} className="text-base font-semibold">
              {environment}
            </h1>
            <Badge variant="outline" className="h-5 rounded-sm px-1.5 font-normal">
              Not started
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {isPaper ? "Simulated capital" : "Real capital"}
          </p>
        </div>
        {isPaper ? (
          <Button type="button" variant="outline" onClick={onOpenDraft}>
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
            Open {draftLabel}
          </Button>
        ) : paperLaunched && onOpenPaper ? (
          <Button type="button" variant="outline" onClick={onOpenPaper}>
            Open Paper V1
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={onOpenDraft}>
            Open {draftLabel}
          </Button>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <caption className="sr-only">{environment} readiness</caption>
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="w-10 px-4 py-2 font-medium sm:px-5">State</th>
              <th scope="col" className="px-3 py-2 font-medium">Requirement</th>
            </tr>
          </thead>
          <tbody>
            {checks.map((check) => (
              <tr key={check.label} className="border-b">
                <td className="px-4 py-3 sm:px-5">
                  {check.complete ? (
                    <Check aria-label="Complete" className="size-4" />
                  ) : (
                    <Minus aria-label="Not complete" className="size-4 text-muted-foreground" />
                  )}
                </td>
                <td className="px-3 py-3 font-medium">{check.label}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
