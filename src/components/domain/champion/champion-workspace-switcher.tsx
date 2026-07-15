"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type ChampionWorkspaceContext = "draft" | "paper" | "live"

export type ChampionWorkspaceOption = {
  id: ChampionWorkspaceContext
  label: string
  stateLabel: string
  detail: string
  disabled?: boolean
}

export type ChampionWorkspaceSwitcherProps = {
  value: ChampionWorkspaceContext
  options: readonly ChampionWorkspaceOption[]
  onValueChange: (value: ChampionWorkspaceContext) => void
  className?: string
}

export function ChampionWorkspaceSwitcher({
  value,
  options,
  onValueChange,
  className,
}: ChampionWorkspaceSwitcherProps) {
  return (
    <nav aria-label="Champion workspace" className={cn("min-w-0", className)}>
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {options.map((option) => {
          const isCurrent = option.id === value

          return (
            <Button
              key={option.id}
              type="button"
              variant={isCurrent ? "secondary" : "ghost"}
              aria-current={isCurrent ? "page" : undefined}
              aria-pressed={isCurrent}
              disabled={option.disabled}
              onClick={() => onValueChange(option.id)}
              className="h-auto min-h-10 min-w-0 justify-center px-3 py-1.5"
            >
              <span className="min-w-0 text-center leading-tight">
                <span className="block truncate text-xs font-semibold sm:text-sm">
                  {option.label}
                </span>
                {isCurrent ? (
                  <span className="block truncate text-[0.6875rem] font-normal text-foreground/65">
                    {option.stateLabel}
                  </span>
                ) : null}
              </span>
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
