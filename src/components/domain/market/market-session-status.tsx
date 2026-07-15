import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type MarketSession = {
  state: "open" | "closed"
  venue: string
  asOf: string
  nextTransition: string
}

export function MarketSessionStatus({ session }: { session: MarketSession }) {
  const stateLabel = session.state === "open" ? "Market open" : "Market closed"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            role="status"
            tabIndex={0}
            aria-label={`${stateLabel}. ${session.nextTransition}. Status as of ${session.asOf}.`}
            className="ml-auto inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-2 rounded-full",
                session.state === "open" ? "bg-emerald-600" : "bg-muted-foreground"
              )}
            />
            <span className="hidden sm:inline">Market</span>
            <span>{session.state}</span>
          </span>
        }
      />
      <TooltipContent side="bottom">
        {session.venue} · {session.nextTransition} · as of {session.asOf}
      </TooltipContent>
    </Tooltip>
  )
}
