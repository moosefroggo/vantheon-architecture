import { CircleCheck, CircleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  const current = evaluation?.checkpoint === checkpoint ? evaluation : null

  return (
    <Tabs defaultValue="problems" className="shrink-0 gap-3 border-t p-4">
      <TabsList aria-label="Workspace bottom panel">
        <TabsTrigger value="problems">Problems</TabsTrigger>
        <TabsTrigger value="tests">Tests</TabsTrigger>
        <TabsTrigger value="checkpoints">Checkpoints</TabsTrigger>
        <TabsTrigger value="data">Data</TabsTrigger>
      </TabsList>

      <ScrollArea className="hidden h-40 sm:block">
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
                {checkpoint} has completed evidence and is {current.eligibility.label.toLowerCase()}.
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
                        {baseline.metrics.find((item) => item.id === metric.id)?.value ?? "—"}
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
    </Tabs>
  )
}
