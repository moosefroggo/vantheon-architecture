"use client"

import { useMemo, useRef, useState } from "react"
import { Play } from "lucide-react"

import { StrategyDocument } from "@/components/domain/strategy/strategy-document"
import { StrategySummary } from "@/components/domain/strategy/strategy-summary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { RuleEditor } from "./rule-editor"
import type { WorkspaceAuthorityOperation } from "./workspace-demo-authority"
import type {
  ConfirmedDraftRulePatch,
  DraftRuleChangeProposal,
  WorkspaceDraftFixture,
  WorkspaceEvaluationFixture,
} from "./workspace-fixtures"

export type DraftDecisionSelection = {
  checkpoint: string
  id: string
} | null

export type DraftStrategyWorkspaceProps = {
  draft: WorkspaceDraftFixture
  evaluation: WorkspaceEvaluationFixture | null
  draftLabel: string
  checkpoint: string
  evaluationComplete: boolean
  confirmedRulePatch: ConfirmedDraftRulePatch | null
  authorityOperation: WorkspaceAuthorityOperation
  authorityError: string | null
  selectedRuleId: string
  selectedDecision: DraftDecisionSelection
  onRunEvaluation: () => void
  onApplyRuleChange: (proposal: DraftRuleChangeProposal) => void
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
  confirmedRulePatch,
  authorityOperation,
  authorityError,
  selectedRuleId,
  selectedDecision,
  onRunEvaluation,
  onApplyRuleChange,
  onAskAbout,
  onSelectedRuleChange,
  onSelectedDecisionChange,
}: DraftStrategyWorkspaceProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const selectedRule = useMemo(
    () => draft.rules.find((rule) => rule.id === selectedRuleId) ?? draft.rules[0]!,
    [draft.rules, selectedRuleId]
  )
  const currentEvaluation =
    evaluationComplete && evaluation?.checkpoint === checkpoint ? evaluation : null
  const linkedDecisions =
    currentEvaluation?.decisions.filter((decision) =>
      decision.ruleIds.includes(selectedRule.id)
    ) ?? []
  const selectedDecisionId =
    selectedDecision?.checkpoint === checkpoint ? selectedDecision.id : null
  const evaluationPending = authorityOperation === "evaluating"

  function editRule(ruleId: string) {
    onSelectedRuleChange(ruleId)
    onSelectedDecisionChange(null)
    setEditorOpen(true)
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
          {evaluationPending ? "Testing…" : "Test Draft"}
        </Button>
      </div>

      <Tabs defaultValue="summary" className="flex min-h-0 flex-1 flex-col gap-0">
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

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {selectedRule.group}</DialogTitle>
            <DialogDescription>
              Proposed changes are validated by the server before the Draft updates.
            </DialogDescription>
          </DialogHeader>
          <RuleEditor
            key={`${selectedRule.id}:${checkpoint}`}
            rule={selectedRule}
            draftLabel={draftLabel}
            checkpoint={checkpoint}
            editorRef={editorRef}
            confirmedPatch={confirmedRulePatch}
            decisionCheckpoint={currentEvaluation?.checkpoint ?? null}
            linkedDecisions={linkedDecisions}
            selectedDecisionId={selectedDecisionId}
            authorityOperation={authorityOperation}
            authorityError={authorityError}
            onApply={onApplyRuleChange}
            onSelectDecision={(decisionId) =>
              onSelectedDecisionChange({ checkpoint, id: decisionId })
            }
            onDiscuss={() => {
              setEditorOpen(false)
              onAskAbout(`${selectedRule.group} · ${selectedRule.name}`)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
