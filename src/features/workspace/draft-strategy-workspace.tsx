"use client"

import { Play } from "lucide-react"

import { StrategyDocument } from "@/components/domain/strategy/strategy-document"
import { StrategySummary } from "@/components/domain/strategy/strategy-summary"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import type { WorkspaceDraftFixture } from "./workspace-fixtures"
import { WorkspacePageHeader } from "./workspace-page-header"

export type DraftDecisionSelection = {
  checkpoint: string
  id: string
} | null

export type DraftSurfaceTab = "summary" | "document"

export type DraftStrategyWorkspaceProps = {
  draft: WorkspaceDraftFixture
  authorityOperation: string | null
  activeTab: DraftSurfaceTab
  onRunEvaluation: () => void
  onActiveTabChange: (tab: DraftSurfaceTab) => void
  onAskAbout: (context: string) => void
  onSelectedRuleChange: (ruleId: string) => void
  onSelectedDecisionChange: (selection: DraftDecisionSelection) => void
  saveStatus?: string
  readOnly?: boolean
}

export function DraftStrategyWorkspace({
  draft,
  authorityOperation,
  activeTab,
  onRunEvaluation,
  onActiveTabChange,
  onAskAbout,
  onSelectedRuleChange,
  onSelectedDecisionChange,
  saveStatus,
  readOnly = false,
}: DraftStrategyWorkspaceProps) {
  const evaluationPending = authorityOperation === "evaluating"

  function editRule(ruleId: string) {
    const rule = draft.rules.find((candidate) => candidate.id === ruleId)
    if (!rule) return

    onSelectedRuleChange(ruleId)
    onSelectedDecisionChange(null)
    onAskAbout(
      `${rule.group} · ${rule.name}: ${rule.value} · ${rule.constraint}`
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <WorkspacePageHeader
        badges={[
          ...(readOnly
            ? [{ label: "Read only", variant: "outline" as const }]
            : []),
        ]}
        details={draft.objective}
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onRunEvaluation}
              disabled={authorityOperation !== null}
            >
              <Play />
              {evaluationPending ? "Running…" : "Dry Run"}
            </Button>
          </div>
        }
        className="px-5 py-4"
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => onActiveTabChange(value as DraftSurfaceTab)}
        className="flex min-h-0 flex-1 flex-col gap-0"
      >
        <div className="border-b px-5 py-3">
          <TabsList>
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="document">Document</TabsTrigger>
          </TabsList>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="p-5">
            <TabsContent value="summary">
              <StrategySummary
                rules={draft.rules}
                onEditRule={editRule}
                saveStatus={saveStatus}
                readOnly={readOnly}
              />
            </TabsContent>
            <TabsContent value="document">
              <StrategyDocument
                objective={draft.objective}
                rules={draft.rules}
                thesis={draft.thesis}
                sizingExample={draft.sizingExample}
                rulePrecedence={draft.rulePrecedence}
                assumptions={draft.assumptions}
                exclusions={draft.exclusions}
                dataFailurePolicy={draft.dataFailurePolicy}
                cooldownPolicy={draft.cooldownPolicy}
              />
            </TabsContent>
          </div>
        </ScrollArea>
      </Tabs>
    </div>
  )
}
