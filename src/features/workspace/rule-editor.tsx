"use client"

import { type FormEvent, type RefObject, useId, useState } from "react"
import { CircleCheck, MessageSquareText } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { formatCheckpointLabel } from "@/lib/version-labels"

import type { WorkspaceAuthorityOperation } from "./workspace-demo-authority"
import type {
  ConfirmedDraftRulePatch,
  DraftRuleChangeProposal,
  StrategyRuleFixture,
  WorkspaceDecisionFixture,
} from "./workspace-fixtures"

export type RuleEditorProps = {
  rule: StrategyRuleFixture
  draftLabel: string
  checkpoint: string
  editorRef: RefObject<HTMLTextAreaElement | null>
  confirmedPatch: ConfirmedDraftRulePatch | null
  decisionCheckpoint: string | null
  linkedDecisions: readonly WorkspaceDecisionFixture[]
  selectedDecisionId: string | null
  authorityOperation: WorkspaceAuthorityOperation
  authorityError: string | null
  onApply: (proposal: DraftRuleChangeProposal) => void
  onSelectDecision: (decisionId: string) => void
  onDiscuss: () => void
}

export function RuleEditor({
  rule,
  draftLabel,
  checkpoint,
  editorRef,
  confirmedPatch,
  decisionCheckpoint,
  linkedDecisions,
  selectedDecisionId,
  authorityOperation,
  authorityError,
  onApply,
  onSelectDecision,
  onDiscuss,
}: RuleEditorProps) {
  const proposedValueId = useId()
  const motivationId = useId()
  const [proposedValue, setProposedValue] = useState(rule.value)
  const [motivation, setMotivation] = useState("")

  const normalizedValue = proposedValue.trim()
  const normalizedMotivation = motivation.trim()
  const valueChanged = normalizedValue !== rule.value.trim()
  const ready =
    normalizedValue.length > 0 && valueChanged && normalizedMotivation.length > 0
  const pending = authorityOperation !== null
  const validationPending = authorityOperation === "validating-rule"
  const confirmedForRule =
    confirmedPatch?.ruleId === rule.id &&
    confirmedPatch.proposedValue === rule.value &&
    normalizedValue === rule.value &&
    normalizedMotivation.length === 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || pending) return

    onApply({
      ruleId: rule.id,
      proposedValue: normalizedValue,
      motivation: normalizedMotivation,
      baseCheckpoint: checkpoint,
    })
  }

  return (
    <form onSubmit={submit} className="space-y-6" aria-busy={validationPending}>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{rule.name}</h3>
          <Badge variant="outline">{rule.group}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{rule.constraint}</p>
      </div>

      {decisionCheckpoint && linkedDecisions.length ? (
        <div className="space-y-2">
          <Label>Linked decisions · {formatCheckpointLabel(decisionCheckpoint)}</Label>
          <div className="flex flex-wrap gap-2">
            {linkedDecisions.map((decision) => (
              <Button
                key={decision.id}
                type="button"
                variant={selectedDecisionId === decision.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSelectDecision(decision.id)}
              >
                {decision.symbol} · {decision.outcome}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor={`${proposedValueId}-current`}>Current value</Label>
        <Input id={`${proposedValueId}-current`} value={rule.value} readOnly />
      </div>

      <div className="space-y-2">
        <Label htmlFor={proposedValueId}>Proposed value</Label>
        <Textarea
          ref={editorRef}
          id={proposedValueId}
          value={proposedValue}
          onChange={(event) => setProposedValue(event.target.value)}
          disabled={pending}
          rows={3}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={motivationId}>Motivation</Label>
        <Textarea
          id={motivationId}
          value={motivation}
          onChange={(event) => setMotivation(event.target.value)}
          disabled={pending}
          placeholder="Explain the evidence or intent behind this change."
          rows={3}
          required
        />
      </div>

      {authorityError && !validationPending ? (
        <Alert variant="destructive">
          <AlertTitle>Change not applied</AlertTitle>
          <AlertDescription>{authorityError}</AlertDescription>
        </Alert>
      ) : null}

      {confirmedForRule ? (
        <Alert>
          <CircleCheck />
          <AlertTitle>
            Server validated · {formatCheckpointLabel(confirmedPatch.checkpoint)}
          </AlertTitle>
          <AlertDescription>
            The authoritative patch is applied. This checkpoint is untested.
          </AlertDescription>
        </Alert>
      ) : null}

      <p className="text-sm text-muted-foreground">
        Base {draftLabel} · {formatCheckpointLabel(checkpoint)}. Only a confirmed
        server patch updates the Draft.
      </p>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDiscuss}>
          <MessageSquareText />
          Discuss
        </Button>
        <Button type="submit" disabled={!ready || pending}>
          {validationPending ? "Validating…" : "Validate and apply"}
        </Button>
      </div>
    </form>
  )
}
