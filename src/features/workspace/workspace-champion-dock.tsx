"use client"

import { FormEvent, useEffect, useRef } from "react"
import { ArrowUp, CircleCheck } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  viewedContext: string
  mutationTarget: string
}

export type WorkspaceChampionDockProps = {
  championId: string
  championName: string
  viewedContext: string
  mutationTarget: string
  focusRequest: number
  message: string
  exchanges: readonly ConversationExchange[]
  paperLaunchAvailable?: boolean
  onMessageChange: (message: string) => void
  onSubmit: (request: string) => void
  onReviewPaperLaunch?: () => void
}

export function WorkspaceChampionDock({
  championId,
  championName,
  viewedContext,
  mutationTarget,
  focusRequest,
  message,
  exchanges,
  paperLaunchAvailable = false,
  onMessageChange,
  onSubmit,
  onReviewPaperLaunch,
}: WorkspaceChampionDockProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const handledFocusRequests = useRef<Record<string, number>>({})

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
      aria-label={`${championName} conversation`}
      className="flex h-[min(22rem,42vh)] shrink-0 p-3 xl:h-auto xl:w-80"
    >
      <Card className="min-h-0 flex-1">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback className="text-foreground">
                {championName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{championName}</CardTitle>
              <CardDescription>{viewedContext}</CardDescription>
            </div>
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
                  <div key={exchange.id} className="space-y-3">
                    <Card size="sm" className="ml-8">
                      <CardContent>{exchange.request}</CardContent>
                    </Card>
                    <Card size="sm" className="mr-8">
                      <CardContent>
                        Attached to {exchange.viewedContext}. Any strategy change will be
                        reviewed in {exchange.mutationTarget}.
                      </CardContent>
                    </Card>
                  </div>
                ))
              ) : (
                <Card size="sm">
                  <CardContent>
                    Ask about the selected strategy, evidence, run, or portfolio.
                  </CardContent>
                </Card>
              )}

              {paperLaunchAvailable && onReviewPaperLaunch ? (
                <Card size="sm">
                  <CardHeader>
                    <CardTitle>Paper portfolio</CardTitle>
                    <CardDescription>
                      The current Draft has sufficient evidence for Paper.
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
            <Textarea
              ref={inputRef}
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              aria-label={`Message ${championName} about ${viewedContext}`}
              placeholder={`Message ${championName}…`}
              rows={3}
            />
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-muted-foreground">
                Changes → {mutationTarget}
              </span>
              <Button type="submit" size="icon" disabled={!message.trim()}>
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
