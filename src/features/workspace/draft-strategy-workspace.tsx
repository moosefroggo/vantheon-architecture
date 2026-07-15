"use client"

import { Play } from "lucide-react"

import { StrategyDocument } from "@/components/domain/strategy/strategy-document"
import { StrategySummary } from "@/components/domain/strategy/strategy-summary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { WorkspaceAuthorityOperation } from "./workspace-demo-authority"
import type {
  WorkspaceDraftFixture,
  WorkspaceEvaluationFixture,
} from "./workspace-fixtures"

export type DraftDecisionSelection = {
  checkpoint: string
  id: string
} | null

export type DraftSurfaceTab = "summary" | "document"

export type DraftStrategyWorkspaceProps = {
  draft: WorkspaceDraftFixture
  evaluation: WorkspaceEvaluationFixture | null
  draftLabel: string
  checkpoint: string
  evaluationComplete: boolean
  authorityOperation: WorkspaceAuthorityOperation
  activeTab: DraftSurfaceTab
  onRunEvaluation: () => void
  onActiveTabChange: (tab: DraftSurfaceTab) => void
  onAskAbout: (context: string) => void
  onSelectedRuleChange: (ruleId: string) => void
  onSelectedDecisionChange: (selection: DraftDecisionSelection) => void
}

export function DraftStrategyWorkspace({
  draft,
  evaluation,
  draftLabel,
  checkpoint,
  evaluationComplete,
  authorityOperation,
  activeTab,
  onRunEvaluation,
  onActiveTabChange,
  onAskAbout,
  onSelectedRuleChange,
  onSelectedDecisionChange,
}: DraftStrategyWorkspaceProps) {
  const currentEvaluation =
    evaluationComplete && evaluation?.checkpoint === checkpoint ? evaluation : null
  const evaluationPending = authorityOperation === "evaluating"

  function editRule(ruleId: string) {
    const rule = draft.rules.find((candidate) => candidate.id === ruleId)
    if (!rule) return

    onSelectedRuleChange(ruleId)
    onSelectedDecisionChange(null)
    onAskAbout(`${rule.group} · ${rule.name}`)
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{draftLabel}</Badge>
            <Badge variant={currentEvaluation ? "secondary" : "outline"}>
              {currentEvaluation ? "Tested" : "Untested"}
            </Badge>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{draft.title}</h1>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
              {draft.objective}
            </p>
          </div>
        </div>
        <Button
          type="button"
          onClick={onRunEvaluation}
          disabled={authorityOperation !== null}
        >
          <Play />
          {evaluationPending ? "Running…" : "Dry Run"}
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as DraftSurfaceTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="px-6">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-6">
            <TabsContent value="summary">
              <StrategySummary
                checkpoint={checkpoint}
                rules={draft.rules}
                onEditRule={editRule}
              />
            </TabsContent>
            <TabsContent value="document">
              <StrategyDocument
                objective={draft.objective}
                checkpoint={checkpoint}
                rules={draft.rules}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
