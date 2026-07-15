import { Eye, PencilLine } from "lucide-react"

export type ConversationContextTargetProps = {
  viewedContext: {
    kind: "draft" | "paper" | "live"
    label: string
  }
  mutationTarget: {
    draftLabel: string
    checkpointLabel: string
  }
}

export function ConversationContextTarget({
  viewedContext,
  mutationTarget,
}: ConversationContextTargetProps) {
  return (
    <dl
      aria-label="Conversation context and change target"
      className="space-y-2 rounded-lg bg-muted/50 p-3 text-xs"
    >
      <div className="flex items-start gap-2">
        <Eye aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <div>
          <dt className="text-muted-foreground">Viewing</dt>
          <dd className="font-medium">{viewedContext.label}</dd>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <PencilLine aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
        <div>
          <dt className="text-muted-foreground">Change target</dt>
          <dd className="font-medium">
            {mutationTarget.draftLabel} · {mutationTarget.checkpointLabel}
          </dd>
        </div>
      </div>
    </dl>
  )
}
