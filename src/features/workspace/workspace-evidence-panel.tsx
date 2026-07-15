"use client"

import { useState } from "react"
import { ChevronDown, CircleCheck, CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
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
}

export function WorkspaceEvidencePanel({
  checkpoint,
  evaluation,
  baseline,
  template,
  authorityError,
}: WorkspaceEvidencePanelProps) {
  const [expanded, setExpanded] = useState(false)
  const current = evaluation?.checkpoint === checkpoint ? evaluation : null

  return (
    <Tabs defaultValue="problems" className="shrink-0 gap-0 border-t">
      <div className="flex h-11 items-center justify-between gap-3 px-3">
        <TabsList aria-label="Workspace bottom panel">
          <TabsTrigger value="problems" onClick={() => setExpanded(true)}>
            Problems
          </TabsTrigger>
          <TabsTrigger value="tests" onClick={() => setExpanded(true)}>
            Tests
          </TabsTrigger>
          <TabsTrigger value="checkpoints" onClick={() => setExpanded(true)}>
            Checkpoints
          </TabsTrigger>
          <TabsTrigger value="data" onClick={() => setExpanded(true)}>
            Data
          </TabsTrigger>
        </TabsList>

        {expanded ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse bottom panel"
            onClick={() => setExpanded(false)}
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">{checkpoint}</TableCell>
                      <TableCell>{current ? "Tested" : "Untested"}</TableCell>
                      <TableCell>{current?.completedAt ?? "—"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">{baseline.checkpoint}</TableCell>
                      <TableCell>{baseline.label}</TableCell>
                      <TableCell>{baseline.completedAt}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
    </Tabs>
  )
}
