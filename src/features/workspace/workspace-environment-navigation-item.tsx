"use client"

import { cn } from "@/lib/utils"
import { formatCheckpointLabel } from "@/lib/version-labels"

export type WorkspaceEnvironmentStatus =
  | {
      kind: "draft"
      tested: boolean
      checkpoint: string
    }
  | {
      kind: "empty"
      environment: "paper" | "live"
    }
  | {
      kind: "running"
      portfolioCount: number
    }
  | {
      kind: "stopped"
    }
  | {
      kind: "archived"
      portfolioCount: number
    }
  | {
      kind: "disconnected"
      lastConfirmed?: string
    }

type WorkspaceEnvironmentNavigationItemProps = {
  label: string
  status: WorkspaceEnvironmentStatus
  active: boolean
  compact?: boolean
  onClick: () => void
}

type StatusPresentation = {
  copy: string
  indicator: "working" | "active" | "empty" | "attention"
}

export function WorkspaceEnvironmentNavigationItem({
  label,
  status,
  active,
  compact = false,
  onClick,
}: WorkspaceEnvironmentNavigationItemProps) {
  const presentation = getStatusPresentation(status)

  if (compact) {
    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        aria-label={`${label}, ${presentation.copy}`}
        onClick={onClick}
        className={cn(
          "flex h-12 min-w-0 flex-col items-center justify-center border-b-2 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
          active
            ? "border-foreground text-foreground"
            : "border-transparent text-muted-foreground"
        )}
      >
        <span className="flex max-w-full items-center gap-1.5 font-medium">
          <EnvironmentStatusDot indicator={presentation.indicator} />
          <span className="truncate">{label}</span>
        </span>
        <span className="mt-0.5 max-w-full truncate text-[0.625rem] text-muted-foreground">
          {presentation.copy}
        </span>
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "mt-0.5 w-full rounded-md border border-transparent px-2 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "border-border bg-background shadow-xs" : "hover:bg-muted"
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <EnvironmentStatusDot indicator={presentation.indicator} />
        <span className="truncate text-sm font-medium">{label}</span>
      </span>
      <span className="mt-0.5 block truncate pl-3.5 text-[0.6875rem] text-muted-foreground">
        {presentation.copy}
      </span>
    </button>
  )
}

function getStatusPresentation(
  status: WorkspaceEnvironmentStatus
): StatusPresentation {
  switch (status.kind) {
    case "draft":
      return {
        copy: `${formatCheckpointLabel(status.checkpoint)} · ${status.tested ? "Tested" : "Untested"}`,
        indicator: "working",
      }
    case "empty":
      return {
        copy: status.environment === "paper" ? "No portfolios" : "No live portfolio",
        indicator: "empty",
      }
    case "running":
      return {
        copy: `${status.portfolioCount} ${status.portfolioCount === 1 ? "portfolio" : "portfolios"} · Running`,
        indicator: "active",
      }
    case "stopped":
      return {
        copy: "Stopped · evidence retained",
        indicator: "empty",
      }
    case "archived":
      return {
        copy: `${status.portfolioCount} retained`,
        indicator: "empty",
      }
    case "disconnected":
      return {
        copy: status.lastConfirmed
          ? `Disconnected · ${status.lastConfirmed}`
          : "Disconnected",
        indicator: "attention",
      }
  }
}

function EnvironmentStatusDot({
  indicator,
}: {
  indicator: StatusPresentation["indicator"]
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        indicator === "working" && "bg-foreground/65",
        indicator === "active" && "bg-emerald-600",
        indicator === "empty" && "border border-muted-foreground/55 bg-transparent",
        indicator === "attention" && "bg-amber-600"
      )}
    />
  )
}
