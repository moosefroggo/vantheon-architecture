import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export type ChampionIdentityProps = {
  name: string
  initials: string
  specialty: string
  availability: "available" | "busy" | "offline"
  currentActivity?: string
}

export function ChampionIdentity({
  name,
  initials,
}: ChampionIdentityProps) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Avatar aria-hidden="true">
        <AvatarFallback className="text-foreground/70">{initials}</AvatarFallback>
      </Avatar>
      <p className="truncate text-sm font-semibold">{name}</p>
    </div>
  )
}
