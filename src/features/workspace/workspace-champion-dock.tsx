"use client"

import { FormEvent, useEffect, useRef } from "react"
import { ArrowUp, CircleCheck, Pencil, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

export type ConversationExchange = {
  id: string
  request: string
  response: readonly AtlasMessagePart[]
  viewedContext: string
  mutationTarget: string
}

export type AtlasMessagePart =
  | {
      kind: "text"
      text: string
    }
  | {
      kind: "question"
      prompt: string
      options: readonly string[]
    }

export type WorkspaceChampionDockProps = {
  championId: string
  viewedContext: string
  attachedContext?: string | null
  focusRequest: number
  message: string
  exchanges: readonly ConversationExchange[]
  paperLaunchReviewAvailable?: boolean
  onMessageChange: (message: string) => void
  onSubmit: (request: string) => void
  onClearAttachedContext?: () => void
  onReviewPaperLaunch?: () => void
}

export function WorkspaceChampionDock({
  championId,
  viewedContext,
  attachedContext = null,
  focusRequest,
  message,
  exchanges,
  paperLaunchReviewAvailable = false,
  onMessageChange,
  onSubmit,
  onClearAttachedContext,
  onReviewPaperLaunch,
}: WorkspaceChampionDockProps) {
  const assistantName = "Atlas"
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handledFocusRequests = useRef<Record<string, number>>({})
  const composerContext = attachedContext ?? viewedContext

  useEffect(() => {
    const handled = handledFocusRequests.current[championId] ?? 0
    if (focusRequest <= handled) return

    handledFocusRequests.current[championId] = focusRequest
    inputRef.current?.focus()
  }, [championId, focusRequest])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const request = message.trim()
    if (!request) return
    onSubmit(request)
  }

  return (
    <aside
      aria-label={`${assistantName} conversation`}
      className="flex h-[min(24rem,46vh)] shrink-0 p-3 xl:h-auto xl:w-[26rem] 2xl:w-[28rem]"
    >
      <Card className="min-h-0 flex-1">
        <CardHeader>
          <div>
            <CardTitle>{assistantName}</CardTitle>
            <CardDescription>{viewedContext}</CardDescription>
          </div>
          <CardAction>
            <Badge variant="secondary">Active</Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div role="log" aria-live="polite" className="space-y-4 pr-3">
              {exchanges.length ? (
                exchanges.map((exchange) => (
                  <div key={exchange.id} className="space-y-4">
                    <div className="flex justify-end">
                      <div className="max-w-[88%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                        {exchange.request}
                      </div>
                    </div>
                    <div className="min-w-0 space-y-1">
                      <p className="text-xs font-medium">Atlas</p>
                      <div className="space-y-3">
                        {exchange.response.map((part, index) =>
                          part.kind === "text" ? (
                            <p key={index} className="text-sm leading-relaxed">
                              {part.text}
                            </p>
                          ) : (
                            <Card key={index} size="sm">
                              <CardHeader>
                                <CardTitle>{part.prompt}</CardTitle>
                              </CardHeader>
                              <CardContent className="flex flex-wrap gap-2">
                                {part.options.map((option) => (
                                  <Button
                                    key={option}
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      onMessageChange(option)
                                      inputRef.current?.focus()
                                    }}
                                  >
                                    {option}
                                  </Button>
                                ))}
                              </CardContent>
                            </Card>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : composerContext.toLowerCase().includes("paper") ? null : (
                <div className="min-w-0 space-y-1">
                  <p className="text-xs font-medium">Atlas</p>
                  <p className="text-sm leading-relaxed">
                    {contextualPrompt(composerContext)}
                  </p>
                </div>
              )}

              {paperLaunchReviewAvailable && onReviewPaperLaunch ? (
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Paper portfolio</CardTitle>
                    <CardDescription>
                      Dry Run complete. Review the simulated portfolio setup.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Button type="button" onClick={onReviewPaperLaunch}>
                      <CircleCheck />
                      Review launch
                    </Button>
                  </CardFooter>
                </Card>
              ) : null}
            </div>
          </ScrollArea>
        </CardContent>

        <CardFooter>
          <form onSubmit={submit} className="w-full space-y-3">
            {attachedContext ? (
              <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <Pencil aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
                    Selected
                  </p>
                  <p className="truncate text-sm font-medium">{attachedContext}</p>
                </div>
                {onClearAttachedContext ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${attachedContext} from conversation`}
                    onClick={() => {
                      onClearAttachedContext()
                      inputRef.current?.focus()
                    }}
                  >
                    <X />
                  </Button>
                ) : null}
              </div>
            ) : null}
            <div className="relative">
              <Textarea
                ref={inputRef}
                value={message}
                onChange={(event) => onMessageChange(event.target.value)}
                aria-label={`Message ${assistantName} about ${composerContext}`}
                placeholder={
                  attachedContext
                    ? "Tell Atlas how this should change…"
                    : contextualPlaceholder(viewedContext)
                }
                className="pb-11 pr-12"
                rows={4}
              />
              <Button
                type="submit"
                size="icon-sm"
                className="absolute bottom-3 right-3"
                disabled={!message.trim()}
              >
                <ArrowUp />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </form>
        </CardFooter>
      </Card>
    </aside>
  )
}

function contextualPrompt(context: string) {
  const normalized = context.toLowerCase()

  if (normalized.startsWith("strategy v")) {
    return "What would you like to change? I’ll keep this Strategy attached as the source and won’t create a new version until there is an actual change to review."
  }
  if (normalized.includes("dry run") || normalized.includes("· run ")) {
    return "Ask why a candidate passed, failed, or produced an order. I can carry anything we learn into the current Draft for review."
  }
  if (normalized.endsWith("· runs")) {
    return "Open any completed run to inspect its summary and activity, or ask me to compare behavior across runs."
  }
  if (normalized.includes("paper")) {
    return "Ask about performance, positions, orders, or a completed run."
  }
  if (normalized.includes("live")) {
    return "Ask about readiness, risk, or what would need to change before real capital is involved."
  }

  return "Tell me the outcome you want, the constraints that matter, and how much risk you are comfortable taking. I’ll turn it into a strategy you can inspect and test."
}

function contextualPlaceholder(context: string) {
  const normalized = context.toLowerCase()

  if (normalized.startsWith("strategy v")) return "What would you like to change?"
  if (normalized.includes("paper")) return "What are you cooking up boss?"
  if (normalized.includes("dry run")) return "Ask Atlas about this Dry Run…"
  if (normalized.includes("· run ")) return "Ask Atlas about this run…"
  if (normalized.includes("live")) return "Ask Atlas about Live readiness…"
  if (normalized.includes("document")) return "Ask Atlas about the strategy document…"
  return "Build or change this strategy with Atlas…"
}
