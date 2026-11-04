"use client"

import { useState } from "react"
import {
  ChevronDown,
  CircleAlert,
  GitFork,
  LoaderCircle,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCheckpointLabel } from "@/lib/version-labels"

import type {
  WorkspaceEvaluationBaselineFixture,
  WorkspaceEvaluationFixture,
} from "./workspace-fixtures"

type WorkspaceEvidencePanelProps = {
  checkpoint: string
  evaluation: WorkspaceEvaluationFixture | null
  evaluations: readonly WorkspaceEvaluationFixture[]
  baseline: WorkspaceEvaluationBaselineFixture
  authorityError: string | null
  activity: readonly WorkspaceActivityItem[]
  activeTab: WorkspaceEvidenceTab | null
  expanded: boolean
  onActiveTabChange: (tab: WorkspaceEvidenceTab) => void
  onExpandedChange: (expanded: boolean) => void
  forkPending: boolean
  onForkCheckpoint: (checkpoint: string) => void
  readOnly?: boolean
  onOpenCheckpoint?: (checkpoint: string) => void
  checkpoints?: readonly {
    label: string
    createdAt: string
    origin: string
    testedAt?: string
    current: boolean
  }[]
  onOpenDryRun: (dryRunId: string) => void
}

export type WorkspaceEvidenceTab = "activity" | "dry-runs" | "checkpoints"

export type WorkspaceActivityItem = {
  id: string
  title: string
  detail: string
}

export function WorkspaceEvidencePanel({
  checkpoint,
  evaluation,
  evaluations,
  baseline,
  authorityError,
  activity,
  activeTab,
  expanded,
  onActiveTabChange,
  onExpandedChange,
  forkPending,
  onForkCheckpoint,
  readOnly = false,
  onOpenCheckpoint,
  checkpoints,
  onOpenDryRun,
}: WorkspaceEvidencePanelProps) {
  const [openedCheckpoint, setOpenedCheckpoint] = useState<string | null>(null)
  const [forkCandidate, setForkCandidate] = useState<string | null>(null)
  const current = evaluation?.checkpoint === checkpoint ? evaluation : null

  return (
    <Tabs
      value={activeTab ?? "__closed__"}
      onValueChange={(value) => {
        onActiveTabChange(value as WorkspaceEvidenceTab)
        onExpandedChange(true)
      }}
      className="shrink-0 gap-0 border-t"
    >
      <div className="flex h-11 items-center justify-between gap-3 px-5">
        <TabsList aria-label="Workspace bottom panel">
          <TabsTrigger value="activity" onClick={() => onExpandedChange(true)}>
            Activity
          </TabsTrigger>
          <TabsTrigger value="dry-runs" onClick={() => onExpandedChange(true)}>
            Dry Runs{evaluations.length ? ` (${evaluations.length})` : ""}
          </TabsTrigger>
          <TabsTrigger value="checkpoints" onClick={() => onExpandedChange(true)}>
            Checkpoints ({checkpoints?.length ?? 2})
          </TabsTrigger>
        </TabsList>

        {expanded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse bottom panel"
            onClick={() => onExpandedChange(false)}
          >
            <ChevronDown />
          </Button>
        ) : null}
      </div>

      {expanded ? (
        <ScrollArea className="h-[min(18rem,42vh)] border-t px-5 py-3">
          <TabsContent value="activity">
            {authorityError ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Workspace action failed</AlertTitle>
                <AlertDescription>{authorityError}</AlertDescription>
              </Alert>
            ) : activity.length ? (
              <ol className="divide-y rounded-md border">
                {activity.map((item) => (
                  <li key={item.id} className="px-3 py-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="rounded-md border px-3 py-4 text-sm text-muted-foreground">
                Atlas activity will appear here after you send a request or complete a Dry Run.
              </p>
            )}
          </TabsContent>

          <TabsContent value="dry-runs">
            <Card size="sm">
              <CardContent>
                {evaluations.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Run</TableHead>
                        <TableHead>Checkpoint</TableHead>
                        <TableHead>Outcome</TableHead>
                        <TableHead>Completed</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[...evaluations].reverse().map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="font-medium">{run.label}</TableCell>
                          <TableCell>{formatCheckpointLabel(run.checkpoint)}</TableCell>
                          <TableCell>Completed</TableCell>
                          <TableCell>{run.completedAt}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => onOpenDryRun(run.id)}
                            >
                              Open
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex items-center justify-between gap-4 py-2">
                    <div>
                      <p className="text-sm font-medium">No Dry Runs yet</p>
                      <p className="text-xs text-muted-foreground">
                        Start a Dry Run from the active Draft.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkpoints">
            <Card size="sm">
              <CardContent>
                <Table className="min-w-[36rem]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Evidence</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(checkpoints?.length
                      ? [...checkpoints].reverse()
                      : [
                          {
                            label: checkpoint,
                            createdAt: "Current session",
                            origin: "Active Draft",
                            testedAt: current?.completedAt,
                            current: true,
                          },
                          {
                            label: baseline.checkpoint,
                            createdAt: baseline.completedAt,
                            origin: "History",
                            testedAt: baseline.completedAt,
                            current: false,
                          },
                        ]
                    ).map((item) => (
                      <TableRow key={item.label}>
                        <TableCell className="font-medium">
                          {formatCheckpointLabel(item.label)}
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {item.createdAt}
                          </span>
                        </TableCell>
                        <TableCell>{item.current ? "Active Draft" : item.origin}</TableCell>
                        <TableCell>
                          {item.testedAt ? `Tested · ${item.testedAt}` : "Not tested"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!item.current && !readOnly ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setForkCandidate(item.label)}
                              >
                                Restore
                              </Button>
                            ) : null}
                            {item.current ? (
                              <span className="px-2 text-xs font-medium text-muted-foreground">
                                Current
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  onOpenCheckpoint
                                    ? onOpenCheckpoint(item.label)
                                    : setOpenedCheckpoint(item.label)
                                }
                              >
                                Open
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {openedCheckpoint ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">
                        {formatCheckpointLabel(openedCheckpoint)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {openedCheckpoint === checkpoint
                          ? `${readOnly ? "Read-only" : "Active"} Draft · latest checkpoint`
                          : "Historical checkpoint · preserved after restore"}
                      </p>
                    </div>
                    {!readOnly ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={openedCheckpoint === checkpoint}
                        onClick={() => setForkCandidate(openedCheckpoint)}
                      >
                        <GitFork />
                        Restore as latest
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

        </ScrollArea>
      ) : null}

      <Dialog
        open={!readOnly && forkCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !forkPending) setForkCandidate(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Restore {forkCandidate ? formatCheckpointLabel(forkCandidate) : "checkpoint"}?
            </DialogTitle>
            <DialogDescription>
              This creates {nextCheckpointLabel(checkpoint)} from{" "}
              {forkCandidate ? formatCheckpointLabel(forkCandidate) : "the selected checkpoint"}.
              The current {formatCheckpointLabel(checkpoint)} remains in history, and
              Paper or Live portfolios do not change.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={forkPending}
              onClick={() => setForkCandidate(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!forkCandidate || forkPending}
              onClick={() => {
                if (!forkCandidate) return
                onForkCheckpoint(forkCandidate)
                setForkCandidate(null)
              }}
            >
              {forkPending ? <LoaderCircle className="animate-spin" /> : <GitFork />}
              Create {nextCheckpointLabel(checkpoint)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}

function nextCheckpointLabel(checkpoint: string) {
  const match = /^V(\d+)\.(\d+)$/.exec(checkpoint)
  if (!match) return "next checkpoint"
  return `Checkpoint ${Number(match[2]) + 1}`
}
