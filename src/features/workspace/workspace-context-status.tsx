import { Badge } from "@/components/ui/badge"
import type { MarketSession } from "@/components/domain/market/market-session-status"
import { MarketSessionStatus } from "@/components/domain/market/market-session-status"

export type WorkspaceContextStatusProps =
  | { kind: "draft"; label: string }
  | { kind: "evaluation"; dataCutoff: string }
  | {
      kind: "paper"
      freshness: string
      marketRelevant: boolean
      marketSession: MarketSession
    }
  | { kind: "live" }

export function WorkspaceContextStatus(props: WorkspaceContextStatusProps) {
  if (props.kind === "paper" && props.marketRelevant) {
    return <MarketSessionStatus session={props.marketSession} />
  }

  const label =
    props.kind === "draft"
      ? props.label
      : props.kind === "evaluation"
        ? `Data cutoff · ${props.dataCutoff}`
        : props.kind === "paper"
          ? props.freshness
          : "Live policy not configured"

  return (
    <div className="ml-auto" role="status" aria-label={label}>
      <Badge variant="outline" className="max-w-28 justify-start truncate sm:max-w-[18rem]">
        {label}
      </Badge>
    </div>
  )
}
