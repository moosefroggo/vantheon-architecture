"use client"

import { useState } from "react"
import {
  ChevronDown,
  CircleAlert,
  CircleCheck,
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

import type {
  WorkspaceEvaluationBaselineFixture,
  WorkspaceEvaluationFixture,
  WorkspaceEvaluationTemplate,
} from "./workspace-fixtures"

type WorkspaceEvidencePanelProps = {
  checkpoint: string
  evaluation: WorkspaceEvaluationFixture | null
  baseline: WorkspaceEvaluationBaselineFixture
  template: WorkspaceEvaluationTemplate
  authorityError: string | null
  activeTab: WorkspaceEvidenceTab
  expanded: boolean
  onActiveTabChange: (tab: WorkspaceEvidenceTab) => void
  onExpandedChange: (expanded: boolean) => void
  forkPending: boolean
  onForkCheckpoint: (checkpoint: string) => void
}

export type WorkspaceEvidenceTab = "problems" | "tests" | "checkpoints" | "data"

export function WorkspaceEvidencePanel({
  checkpoint,
  evaluation,
  baseline,
  template,
  authorityError,
  activeTab,
  expanded,
  onActiveTabChange,
  onExpandedChange,
  forkPending,
  onForkCheckpoint,
}: WorkspaceEvidencePanelProps) {
  const [openedCheckpoint, setOpenedCheckpoint] = useState<string | null>(null)
  const [forkCandidate, setForkCandidate] = useState<string | null>(null)
  const current = evaluation?.checkpoint === checkpoint ? evaluation : null

  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => {
        onActiveTabChange(value as WorkspaceEvidenceTab)
        onExpandedChange(true)
      }}
      className="shrink-0 gap-0 border-t"
    >
      <div className="flex h-11 items-center justify-between gap-3 px-3">
        <TabsList aria-label="Workspace bottom panel">
          <TabsTrigger value="problems" onClick={() => onExpandedChange(true)}>
            Problems
          </TabsTrigger>
          <TabsTrigger value="tests" onClick={() => onExpandedChange(true)}>
            Tests
          </TabsTrigger>
          <TabsTrigger value="checkpoints" onClick={() => onExpandedChange(true)}>
            Checkpoints
          </TabsTrigger>
          <TabsTrigger value="data" onClick={() => onExpandedChange(true)}>
            Data
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
        <ScrollArea className="h-44 border-t px-3 py-3">
          <TabsContent value="problems">
            {authorityError ? (
              <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Workspace action failed</AlertTitle>
                <AlertDescription>{authorityError}</AlertDescription>
              </Alert>
            ) : current ? (
              <Alert>
                <CircleCheck />
                <AlertTitle>No blocking problems</AlertTitle>
                <AlertDescription>
                  {checkpoint} has completed evidence and is{" "}
                  {current.eligibility.label.toLowerCase()}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <CircleAlert />
                <AlertTitle>{checkpoint} needs testing</AlertTitle>
                <AlertDescription>
                  Run the current Draft before using this checkpoint for a Paper portfolio.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="tests">
            <Card size="sm">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Metric</TableHead>
                      <TableHead>{checkpoint}</TableHead>
                      <TableHead>{baseline.checkpoint}</TableHead>
                      <TableHead>Delta</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(current?.metrics ?? template.metrics).map((metric) => (
                      <TableRow key={metric.id}>
                        <TableCell className="font-medium">{metric.label}</TableCell>
                        <TableCell>{current ? metric.value : "—"}</TableCell>
                        <TableCell>
                          {baseline.metrics.find((item) => item.id === metric.id)?.value ??
                            "—"}
                        </TableCell>
                        <TableCell>{current ? metric.delta.value : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="checkpoints">
            <Card size="sm">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Checkpoint</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{checkpoint}</TableCell>
                      <TableCell>{current ? "Tested" : "Untested"}</TableCell>
                      <TableCell>{current?.completedAt ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenedCheckpoint(checkpoint)}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{baseline.checkpoint}</TableCell>
                      <TableCell>{baseline.label}</TableCell>
                      <TableCell>{baseline.completedAt}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenedCheckpoint(baseline.checkpoint)}
                        >
                          Open
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {openedCheckpoint ? (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                    <div>
                      <p className="text-sm font-medium">{openedCheckpoint}</p>
                      <p className="text-xs text-muted-foreground">
                        {openedCheckpoint === checkpoint
                          ? "Current Draft checkpoint"
                          : "Historical checkpoint · preserved after a fork"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={openedCheckpoint === checkpoint}
                      onClick={() => setForkCandidate(openedCheckpoint)}
                    >
                      <GitFork />
                      Fork checkpoint
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data">
            <Card size="sm">
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Input</TableHead>
                      <TableHead>Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.setup.map((item) => (
                      <TableRow key={item.label}>
                        <TableCell className="font-medium">{item.label}</TableCell>
                        <TableCell>{item.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </ScrollArea>
      ) : null}

      <Dialog
        open={forkCandidate !== null}
        onOpenChange={(open) => {
          if (!open && !forkPending) setForkCandidate(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fork {forkCandidate} into the current Draft?</DialogTitle>
            <DialogDescription>
              This creates {nextCheckpointLabel(checkpoint)} from {forkCandidate}. The
              current {checkpoint} remains in history, and Paper or Live portfolios do
              not change.
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
  return `V${match[1]}.${Number(match[2]) + 1}`
}
