import { Ref } from "react"
import { ArrowLeft, Landmark, RadioTower, ShieldAlert } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"

export type ContextReadinessSurfaceProps = {
  context: "paper" | "live"
  paperLaunched: boolean
  containerRef?: Ref<HTMLElement>
  onReturnToDraft: () => void
}

export function ContextReadinessSurface({
  context,
  paperLaunched,
  containerRef,
  onReturnToDraft,
}: ContextReadinessSurfaceProps) {
  const isPaper = context === "paper"
  const Icon = isPaper ? RadioTower : Landmark
  const title = isPaper ? "No Paper portfolio yet" : "Live is not configured"
  const description = isPaper
    ? "Finish a transparent Draft evaluation before creating a simulated portfolio."
    : "Live-capital configuration is intentionally outside the onboarding path. Nothing can move from Paper to Live automatically."

  return (
    <section ref={containerRef} tabIndex={-1} aria-labelledby="readiness-title" className="outline-none">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{isPaper ? "Simulated" : "Real capital"}</Badge>
            <Badge variant="outline">Not active</Badge>
          </div>
          <h1 id="readiness-title" className="font-heading text-xl font-medium leading-snug sm:text-2xl">
            {title}
          </h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex min-h-64 flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <Icon aria-hidden="true" className="size-8" />
            <h2 className="mt-4 text-base font-semibold">
              {isPaper ? "Evidence comes before simulated operation" : "Capital remains out of scope"}
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
              {isPaper
                ? "Draft V1 remains your only mutation target. Running an evaluation will disclose behavior, rejections, risk, assumptions, and limitations before launch review."
                : paperLaunched
                  ? "Paper V1 can gather evidence, but a future Live review requires a separate server-authoritative eligibility assessment and explicit confirmation."
                  : "Create understandable Draft evidence and learn in Paper first. Broker setup and capital-bearing controls are not required to reach onboarding value."}
            </p>
            {!isPaper ? (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-muted/50 p-3 text-sm">
                <ShieldAlert aria-hidden="true" className="size-4 shrink-0" />
                No account is funded or connected.
              </div>
            ) : null}
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button type="button" variant="outline" onClick={onReturnToDraft}>
            <ArrowLeft aria-hidden="true" data-icon="inline-start" />
            Return to Draft
          </Button>
        </CardFooter>
      </Card>
    </section>
  )
}
