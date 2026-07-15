import { CheckCircle2, CircleDashed, Clock3 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type ChampionActivityItem = {
  id: string
  title: string
  detail: string
  status: "complete" | "active" | "pending"
  objectLabel: string
}

export type ChampionActivityTimelineProps = {
  championName: string
  items: readonly ChampionActivityItem[]
  onObjectSelect?: (item: ChampionActivityItem) => void
}

const statusConfig = {
  complete: { label: "Complete", icon: CheckCircle2 },
  active: { label: "In progress", icon: CircleDashed },
  pending: { label: "Pending", icon: Clock3 },
} satisfies Record<
  ChampionActivityItem["status"],
  { label: string; icon: typeof CheckCircle2 }
>

export function ChampionActivityTimeline({
  championName,
  items,
  onObjectSelect,
}: ChampionActivityTimelineProps) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <CardTitle>Champion activity</CardTitle>
        <CardDescription>
          Verified work from {championName}, independent of conversation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3" aria-label={`${championName} activity`}>
          {items.map((item) => {
            const config = statusConfig[item.status]
            const Icon = config.icon

            return (
              <li key={item.id} className="grid grid-cols-[auto_1fr] gap-2">
                <Icon aria-hidden="true" className="mt-0.5 size-4" />
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium leading-none">{item.title}</p>
                    <Badge variant="outline">{config.label}</Badge>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {item.detail}
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="h-auto px-0"
                    onClick={() => onObjectSelect?.(item)}
                  >
                    Open {item.objectLabel}
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
