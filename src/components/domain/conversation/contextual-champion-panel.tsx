"use client"

import { FormEvent, Ref, useId, useState } from "react"
import { ChevronRight, Link2, MessageSquareText, PanelRightClose, Send } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  ConversationContextTarget,
  type ConversationContextTargetProps,
} from "./conversation-context-target"

export type ChampionReference = {
  id: string
  label: string
}

export type ContextualChampionPanelProps = ConversationContextTargetProps & {
  championName: string
  summary: string
  suggestions: readonly string[]
  references: readonly ChampionReference[]
  onReferenceSelect?: (reference: ChampionReference) => void
  onRequest?: (request: string) => void
  onCollapse?: () => void
  collapseButtonRef?: Ref<HTMLButtonElement>
  className?: string
}

export function ContextualChampionPanel({
  championName,
  viewedContext,
  mutationTarget,
  summary,
  suggestions,
  references,
  onReferenceSelect,
  onRequest,
  onCollapse,
  collapseButtonRef,
  className,
}: ContextualChampionPanelProps) {
  const headingId = useId()
  const [message, setMessage] = useState("")
  const [submittedRequest, setSubmittedRequest] = useState<string | null>(null)

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request = message.trim()
    if (!request) return

    setSubmittedRequest(request)
    setMessage("")
    onRequest?.(request)
  }

  return (
    <aside
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-0 flex-col overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <MessageSquareText aria-hidden="true" className="size-4" />
            <h2 id={headingId} className="text-sm font-semibold">
              Ask {championName}
            </h2>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Contextual explanation and intent—not the source of record.
          </p>
        </div>
        {onCollapse ? (
          <Button
            ref={collapseButtonRef}
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onCollapse}
            aria-label="Collapse Champion conversation"
          >
            <PanelRightClose aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 p-4">
          <ConversationContextTarget
            viewedContext={viewedContext}
            mutationTarget={mutationTarget}
          />

          <section aria-labelledby={`${headingId}-assessment`} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <h3 id={`${headingId}-assessment`} className="text-xs font-semibold uppercase tracking-wide">
                Current assessment
              </h3>
              <Badge variant="outline">Champion summary</Badge>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
          </section>

          <section aria-labelledby={`${headingId}-references`} className="space-y-2">
            <h3 id={`${headingId}-references`} className="text-xs font-semibold uppercase tracking-wide">
              Attached context
            </h3>
            <div className="space-y-1.5">
              {references.map((reference) => (
                <Button
                  key={reference.id}
                  type="button"
                  variant="outline"
                  className="h-auto w-full justify-between whitespace-normal px-2.5 py-2 text-left"
                  onClick={() => onReferenceSelect?.(reference)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Link2 aria-hidden="true" className="size-3.5 shrink-0" />
                    <span className="truncate">{reference.label}</span>
                  </span>
                  <ChevronRight aria-hidden="true" className="size-3.5 shrink-0" />
                </Button>
              ))}
            </div>
          </section>
        </div>
      </ScrollArea>
      <Separator />
      <form onSubmit={submitRequest} className="space-y-2.5 p-4">
        {submittedRequest ? (
          <p role="status" className="text-xs text-muted-foreground">
            Request attached to {viewedContext.label}. Authoritative work will appear
            in activity and the affected artifact.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-1.5" aria-label="Suggested questions">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              variant="outline"
              size="xs"
              className="h-auto whitespace-normal py-1 text-left"
              onClick={() => setMessage(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
        <Textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-label={`Ask ${championName} about ${viewedContext.label}`}
          placeholder={`Ask about ${viewedContext.label}…`}
          rows={3}
        />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">No change occurs without review.</p>
          <Button type="submit" size="sm" disabled={!message.trim()}>
            <Send aria-hidden="true" data-icon="inline-start" />
            Send
          </Button>
        </div>
      </form>
    </aside>
  )
}
