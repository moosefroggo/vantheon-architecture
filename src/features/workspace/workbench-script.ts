import { entityId, entityReference, idempotencyKey, isoTimestamp } from "@/domain/identity"

import { createInMemoryWorkspaceRepository } from "./demo/memory-repository"
import { WORKSPACE_DEMO_IDS } from "./demo/seed"
import type { WorkspaceCommandReceipt, WorkspaceCommandResult, WorkspaceCommandType, WorkspaceScenario } from "./demo/types"
import { changeSetHref, draftHref, evaluationHref } from "./workspace-route"

const championId = WORKSPACE_DEMO_IDS.mara.champion
const request = "Change this to top decile by 12-month momentum"
const draftPath = draftHref("mara")

export type WorkbenchReplayFrame = {
  scenario: WorkspaceScenario
  href: string
  message: string
  context: string | null
  preflight: boolean
}

function command<T extends WorkspaceCommandType>(type: T) {
  return {
    type,
    championId,
    commandId: entityId("command", `command_workbench_${type.replaceAll("-", "_")}`),
    idempotencyKey: idempotencyKey(`workbench:${type}`),
    actor: entityReference("user", WORKSPACE_DEMO_IDS.user),
    submittedAt: isoTimestamp(new Date().toISOString()),
  }
}

function applied<T extends WorkspaceCommandResult>(receipt: WorkspaceCommandReceipt<T>) {
  if (receipt.outcome !== "applied" || !receipt.result) {
    throw new Error(receipt.failure?.message ?? "The guided demo could not prepare its workspace.")
  }
  return receipt.result
}

/** Playback selects immutable snapshots prepared by the in-memory demo authority. */
export async function createWorkbenchReplay() {
  const repository = await createInMemoryWorkspaceRepository()
  const initial = await repository.readSnapshot()
  const draft = initial.drafts[initial.champions[championId].currentDraftId]
  const checkpoint = initial.checkpoints[draft.currentCheckpointId]
  const selection = checkpoint.strategy.sections.find((section) => section.kind === "selection")
  const rule = selection?.rules[0]
  if (!selection || !rule) throw new Error("Mara’s Selection rule is unavailable.")
  const context = `${selection.title} · ${rule.label}: ${rule.value} · ${rule.constraint ?? "No additional constraint"}`

  const { changeSetId } = applied(await repository.proposeDraftChange({
    ...command("propose"),
    draftId: draft.id,
    expectedDraftRevision: draft.revision,
    baseCheckpointId: checkpoint.id,
    changes: [{ ruleId: rule.id, expectedValue: rule.value, proposedValue: "Top decile by 12-month momentum" }],
    motivation: request,
  }))
  applied(await repository.appendAtlasExchange({
    ...command("append-atlas-exchange"),
    userText: request,
    assistantText: "I’ve prepared a proposal for the Selection rule. Review the current and proposed values before accepting it.",
    references: [entityReference("draft-checkpoint", checkpoint.id), entityReference("change-set", changeSetId)],
  }))
  const proposed = await repository.readSnapshot()
  const { checkpointId } = applied(await repository.acceptChangeSet({
    ...command("accept"),
    changeSetId,
    expectedChangeSetRevision: proposed.changeSets[changeSetId].revision,
    expectedDraftRevision: proposed.drafts[draft.id].revision,
  }))
  const revised = await repository.readSnapshot()
  const { evaluationId } = applied(await repository.runEvaluation({
    ...command("evaluate"),
    draftId: draft.id,
    expectedDraftRevision: revised.drafts[draft.id].revision,
    checkpointId,
    setup: initial.evaluations[WORKSPACE_DEMO_IDS.mara.evaluation].setup,
  }))
  const evaluated = await repository.readSnapshot()
  await repository.close()

  const base = { message: "", context: null, preflight: false }
  return { initial, proposed, revised, evaluated, base, context, changeSetId, evaluationId }
}

export type WorkbenchReplay = Awaited<ReturnType<typeof createWorkbenchReplay>>

export function workbenchReplayFrame(replay: WorkbenchReplay, progress: number): WorkbenchReplayFrame {
  const { initial, proposed, revised, evaluated, base, context, changeSetId, evaluationId } = replay
  if (progress >= .85) return { ...base, scenario: evaluated, href: evaluationHref("mara", evaluationId) }
  if (progress >= .55) return { ...base, scenario: revised, href: draftPath, preflight: progress >= .74 }
  if (progress >= .38) return { ...base, scenario: proposed, href: changeSetHref("mara", changeSetId) }
  const chars = Math.floor(request.length * Math.max(0, Math.min(1, (progress - .195) / .095)))
  return {
    ...base,
    scenario: initial,
    href: draftPath,
    context: progress >= .12 ? context : null,
    message: request.slice(0, chars),
  }
}
