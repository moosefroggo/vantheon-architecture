import type { ComponentProps, ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type WorkspacePageHeaderBadge = {
  label: string
  variant?: ComponentProps<typeof Badge>["variant"]
}

export type WorkspacePageHeaderProps = {
  title?: string
  titleId?: string
  badges?: readonly WorkspacePageHeaderBadge[]
  details?: ReactNode
  action?: ReactNode
  className?: string
  titleLevel?: 1 | 2
}

export function WorkspacePageHeader({
  title,
  titleId,
  badges = [],
  details,
  action,
  className,
  titleLevel = 1,
}: WorkspacePageHeaderProps) {
  const Title = titleLevel === 1 ? "h1" : "h2"
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b lg:flex-row lg:items-start lg:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {title ? (
            <Title id={titleId} className="text-2xl font-semibold tracking-tight">
              {title}
            </Title>
          ) : null}
          {badges.map((badge) => (
            <Badge key={badge.label} variant={badge.variant ?? "outline"}>
              {badge.label}
            </Badge>
          ))}
        </div>
        {details ? <div className="text-sm text-muted-foreground">{details}</div> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  )
}
