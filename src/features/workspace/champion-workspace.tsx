"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import {
  CircleUserRound,
  Database,
  LockKeyhole,
  NotebookTabs,
} from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { DomainObjectReference } from "@/lib/charts/contracts"
import { useWorkspaceInteractionStore } from "@/lib/state/workspace-interaction-store"
import {
  entityId,
  entityReference,
  idempotencyKey,
  isoTimestamp,
  type EntityId,
} from "@/domain/identity"
import {
  formatCheckpointLabel,
  formatDraftLabel,
  formatVersionReference,
} from "@/lib/version-labels"

import {
  DraftStrategyWorkspace,
  type DraftDecisionSelection,
  type DraftSurfaceTab,
} from "./draft-strategy-workspace"
import {
  DryRunWorkspace,
  type DryRunTab,
} from "./dry-run-workspace"
import { EmptyEnvironmentWorkspace } from "./empty-environment-workspace"
import {
  PaperPortfolioWorkspace,
  PaperWorkspaceBottomPanel,
  type PaperLifecycleAction,
  type PaperDetailsTab,
  type PaperRunTab,
  type PaperWorkspaceFixture,
} from "./paper-portfolio-workspace"
import {
  WorkspaceChampionDock,
  type ConversationExchange,
} from "./workspace-champion-dock"
import {
  WorkspaceEvidencePanel,
  type WorkspaceEvidenceTab,
} from "./workspace-evidence-panel"
import { WorkspaceHeaderBreadcrumbs } from "./workspace-header-breadcrumbs"
import { WorkspaceContextStatus } from "./workspace-context-status"
import { WorkspaceEnvironmentNavigationItem } from "./workspace-environment-navigation-item"
import { WorkspacePageHeader } from "./workspace-page-header"
import {
  WORKSPACE_DEMO_IDS,
  WORKSPACE_DEMO_RESEED_NOTICE_KEY,
  useResetWorkspaceDemo,
  useWorkspaceDemoCommand,
  useWorkspaceDemoScenario,
  type AcceptChangeCommand,
  type AppendAtlasExchangeCommand,
  type ArchivePaperCommand,
  type EvaluateDraftCommand,
  type EvaluationRecord,
  type DraftCheckpointRecord,
  type LaunchPaperCommand,
  type PaperPortfolioRecord,
  type ProposeChangeCommand,
  type RejectChangeCommand,
  type RestoreCheckpointCommand,
  type StopPaperCommand,
  type StructuredStrategy,
  type UnarchivePaperCommand,
  type WorkspaceCommandReceipt,
  type WorkspaceCommandResult,
  type WorkspaceCommandType,
  type WorkspaceScenario,
  WorkspaceAuthorityError,
} from "./demo"
import {
  changeSetHref,
  checkpointHref,
  dataHref,
  draftHref,
  evaluationHref,
  liveHref,
  paperIndexHref,
  paperArchivedHref,
  paperCompareHref,
  paperPortfolioHref,
  paperRunHref,
  sourceArtifactHref,
  parseWorkspaceRoute,
  type WorkspaceRoute,
} from "./workspace-route"
import {
  ChangeSetReviewWorkspace,
  CheckpointDetailWorkspace,
  DataWorkspace,
  SourceArtifactWorkspace,
  UnavailableWorkspaceResource,
} from "./workspace-resource-surfaces"
import {
  type StrategyRuleFixture,
  type WorkspaceEvaluationBaselineFixture,
  type WorkspaceEvaluationFixture,
  type WorkspaceFixture,
  marketSessionFixture,
  workspaceFixtures,
} from "./workspace-fixtures"

type WorkspaceContext = "draft" | "paper" | "live"

type WorkspaceAuthorityOperation =
  | "evaluating"
  | "launching-paper"
  | "forking-checkpoint"
  | "saving-change-set"
  | null

type DemoAuthorityRequest =
  | { kind: "propose"; command: ProposeChangeCommand }
  | { kind: "accept"; command: AcceptChangeCommand }
  | { kind: "reject"; command: RejectChangeCommand }
  | { kind: "restore"; command: RestoreCheckpointCommand }
  | { kind: "evaluate"; command: EvaluateDraftCommand }
  | { kind: "launch"; command: LaunchPaperCommand }
  | { kind: "stop"; command: StopPaperCommand }
  | { kind: "archive"; command: ArchivePaperCommand }
  | { kind: "unarchive"; command: UnarchivePaperCommand }
  | { kind: "append-atlas-exchange"; command: AppendAtlasExchangeCommand }

type DraftRuntimeState = {
  checkpoint: string
  rules: StrategyRuleFixture[]
}

type PaperLaunchSnapshot = {
  id: string
  label: string
  source: string
  rules: StrategyRuleFixture[]
  operationalState: "active" | "stopping" | "stopped" | "archived"
}

type ChampionConversationState = {
  context: string | null
  focusRequest: number
  exchanges: ConversationExchange[]
}

type ChampionSessionState = {
  evaluations: WorkspaceEvaluationFixture[]
  draftState: DraftRuntimeState
  paperPortfolios: PaperLaunchSnapshot[]
  paperLifecycleOperation: {
    portfolioId: string
    action: PaperLifecycleAction
  } | null
  paperLifecycleReview: {
    portfolioId: string
    action: PaperLifecycleAction
  } | null
  draftSelection: {
    surface: DraftSurfaceTab
    ruleId: string
    decision: DraftDecisionSelection
    dryRunId: string | null
    dryRunTab: DryRunTab
  }
  paperSelection: {
    detailsTab: PaperDetailsTab
    panelExpanded: boolean
    runTab: PaperRunTab
    reference: DomainObjectReference | null
  }
  launchReviewOpen: boolean
  conversation: ChampionConversationState
  authorityOperation: WorkspaceAuthorityOperation
  authorityError: string | null
}

type WorkspaceRuntimeState = {
  selectedChampionId: string
  recentChampionIds: string[]
  sessions: Record<string, ChampionSessionState>
}

export function ChampionWorkspace() {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const route = useMemo(
    () => parseWorkspaceRoute(pathname, new URLSearchParams(searchParams.toString())),
    [pathname, searchParams]
  )
  const [runtime, setRuntime] = useState<WorkspaceRuntimeState>(createInitialRuntime)
  const composerMessage = useWorkspaceInteractionStore(
    (state) => state.composerDrafts[route.championId] ?? ""
  )
  const setComposerDraft = useWorkspaceInteractionStore(
    (state) => state.setComposerDraft
  )
  const clearComposerDraft = useWorkspaceInteractionStore(
    (state) => state.clearComposerDraft
  )
  const resetInteractions = useWorkspaceInteractionStore(
    (state) => state.resetInteractions
  )
  const [profileOpen, setProfileOpen] = useState(false)
  const [resetReviewOpen, setResetReviewOpen] = useState(false)
  const [evaluationReviewOpen, setEvaluationReviewOpen] = useState(false)
  const [schemaResetNotice, setSchemaResetNotice] = useState(false)
  const [bottomPanel, setBottomPanel] = useState<{
    tab: WorkspaceEvidenceTab
    expanded: boolean
  }>({ tab: "problems", expanded: false })
  const runtimeRef = useRef(runtime)
  const conversationSequenceRef = useRef(0)
  const demo = useWorkspaceDemoScenario()
  const resetDemo = useResetWorkspaceDemo()
  const authority = useWorkspaceDemoCommand<
    WorkspaceCommandReceipt,
    DemoAuthorityRequest
  >(
    async (repository, request) => {
      switch (request.kind) {
        case "propose":
          return await repository.proposeDraftChange(request.command)
        case "accept":
          return await repository.acceptChangeSet(request.command)
        case "reject":
          return await repository.rejectChangeSet(request.command)
        case "restore":
          return await repository.restoreCheckpoint(request.command)
        case "evaluate":
          return await repository.runEvaluation(request.command)
        case "launch":
          return await repository.launchPaper(request.command)
        case "stop":
          return await repository.stopPaper(request.command)
        case "archive":
          return await repository.archivePaper(request.command)
        case "unarchive":
          return await repository.unarchivePaper(request.command)
        case "append-atlas-exchange":
          return await repository.appendAtlasExchange(request.command)
      }
    }
  )

  useEffect(() => {
    if (!demo.scenario) return
    setRuntime((current) => {
      const next = projectScenarioOntoRuntime(current, demo.scenario!)
      runtimeRef.current = next
      return next
    })
    try {
      if (sessionStorage.getItem(WORKSPACE_DEMO_RESEED_NOTICE_KEY) === "1") {
        sessionStorage.removeItem(WORKSPACE_DEMO_RESEED_NOTICE_KEY)
        setSchemaResetNotice(true)
      }
    } catch {
      // The authority remains usable when sessionStorage is unavailable.
    }
  }, [demo.scenario])

  const championId = route.championId
  const requestedWorkspaceFixture = findWorkspaceFixture(championId)
  const workspaceFixture: WorkspaceFixture =
    requestedWorkspaceFixture ?? workspaceFixtures[0]
  const requestedSession = runtime.sessions[championId]
  const session = requestedSession ?? runtime.sessions[workspaceFixture.champion.id]

  const {
    evaluations,
    draftState,
    paperPortfolios,
    paperLifecycleOperation,
    paperLifecycleReview,
    draftSelection,
    paperSelection,
    launchReviewOpen,
    conversation,
    authorityOperation,
    authorityError,
  } = session
  const activeContext = contextFromRoute(route)
  const checkpoint = draftState.checkpoint
  const paperLaunched = paperPortfolios.length > 0
  const draftLabel = formatDraftLabel(draftLabelFromCheckpoint(checkpoint))
  const checkpointLabel = formatCheckpointLabel(checkpoint)
  const currentEvaluation =
    evaluations.findLast((evaluation) => evaluation.checkpoint === checkpoint) ?? null
  const latestEvaluation = evaluations.at(-1) ?? null
  const selectedDryRunId = route.kind === "evaluation" ? route.evaluationId : null
  const selectedDryRun = selectedDryRunId
    ? evaluations.find((evaluation) => evaluation.id === selectedDryRunId) ?? null
    : null
  const evaluationComplete = currentEvaluation !== null
  const paperLaunchReviewAvailable = evaluationComplete
  const localSaveStatus = demo.error
    ? "Local save failed · retry by refreshing"
    : demo.isPending || authority.isPending || resetDemo.isPending
      ? "Saving locally"
      : demo.scenario
        ? `Saved locally · ${formatClockTime(demo.scenario.clock)}`
        : "Local storage unavailable"
  const selectedPortfolioId =
    route.kind === "paper-portfolio" || route.kind === "paper-run"
      ? route.portfolioId
      : null
  const paperSnapshot = selectedPortfolioId
    ? paperPortfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null
    : null
  const currentPaperPortfolioId =
    paperSnapshot?.id ??
    paperPortfolios.find((portfolio) => portfolio.operationalState !== "archived")?.id ??
    paperPortfolios[0]?.id ??
    null

  const evidenceBaseline = useMemo<WorkspaceEvaluationBaselineFixture>(() => {
    if (currentEvaluation) return currentEvaluation.baseline
    if (!latestEvaluation) return workspaceFixture.evaluation.baseline

    return {
      checkpoint: latestEvaluation.checkpoint,
      label: "Most recent tested checkpoint",
      completedAt: latestEvaluation.completedAt,
      metrics: latestEvaluation.metrics.map(({ id, label, value }) => ({
        id,
        label,
        value,
      })),
    }
  }, [currentEvaluation, latestEvaluation, workspaceFixture.evaluation.baseline])

  const draftView = useMemo(
    () => ({
      ...workspaceFixture.draft,
      label: draftLabel,
      checkpoint,
      rules: draftState.rules,
    }),
    [checkpoint, draftLabel, draftState.rules, workspaceFixture.draft]
  )

  const paperView = useMemo(() => {
    if (!paperSnapshot) return null

    if (demo.scenario) {
      const projected = projectPaperWorkspace(
        demo.scenario,
        paperSnapshot.id,
        workspaceFixture.paper,
        paperSnapshot
      )
      if (projected) return projected
    }

    return {
      ...workspaceFixture.paper,
      label: paperSnapshot.label,
      status: paperOperationalLabel(paperSnapshot.operationalState),
      operationalState: paperSnapshot.operationalState,
      source: formatVersionReference(paperSnapshot.source),
      strategyRules: paperSnapshot.rules.map((rule) => ({
        label: rule.group,
        value: `${rule.value} · ${rule.constraint}`,
      })),
    }
  }, [demo.scenario, paperSnapshot, workspaceFixture.paper])

  if (!requestedWorkspaceFixture || !requestedSession) {
    return <UnavailableChampionWorkspace championId={championId} />
  }

  const scenarioChampion = demo.scenario
    ? findScenarioChampion(demo.scenario, championId)
    : undefined
  const routedChangeSet =
    route.kind === "draft-change" && scenarioChampion
      ? demo.scenario?.changeSets[route.changeSetId]
      : undefined
  const validRoutedChangeSet =
    routedChangeSet?.championId === scenarioChampion?.id ? routedChangeSet : undefined
  const routedChangeSetBase = validRoutedChangeSet
    ? demo.scenario?.checkpoints[validRoutedChangeSet.baseCheckpointId]
    : undefined
  const scenarioDraft = scenarioChampion
    ? demo.scenario?.drafts[scenarioChampion.currentDraftId]
    : undefined
  const scenarioCurrentCheckpoint = scenarioDraft
    ? demo.scenario?.checkpoints[scenarioDraft.currentCheckpointId]
    : undefined
  const evaluationSetupTemplate = scenarioChampion
    ? Object.values(demo.scenario?.evaluations ?? {})
        .filter((evaluation) => evaluation.championId === scenarioChampion.id)
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]
    : undefined
  const routedCheckpoint =
    route.kind === "draft-checkpoint" && scenarioChampion
      ? demo.scenario?.checkpoints[route.checkpointId]
      : undefined
  const validRoutedCheckpoint =
    routedCheckpoint?.championId === scenarioChampion?.id ? routedCheckpoint : undefined
  const routedSource =
    route.kind === "source" ? demo.scenario?.sourceArtifacts[route.sourceArtifactId] : undefined
  const routedSourceBelongsToChampion =
    routedSource && scenarioChampion
      ? Object.values(demo.scenario?.evaluations ?? {}).some(
          (evaluation) =>
            evaluation.championId === scenarioChampion.id &&
            evaluation.sourceArtifactIds.includes(routedSource.id)
        )
      : false
  const checkpointHistory = scenarioChampion
    ? Object.values(demo.scenario?.checkpoints ?? {})
        .filter((candidate) => candidate.championId === scenarioChampion.id)
        .sort(
          (left, right) =>
            left.generation - right.generation || left.ordinal - right.ordinal
        )
        .map((candidate) => {
          const tested = Object.values(demo.scenario?.evaluations ?? {})
            .filter(
              (evaluation) =>
                evaluation.checkpointId === candidate.id &&
                evaluation.status === "completed"
            )
            .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]
          return {
            label: candidate.label,
            createdAt: formatDemoTimestamp(candidate.createdAt),
            origin: titleCase(candidate.origin.kind.replaceAll("-", " ")),
            testedAt: tested
              ? formatDemoTimestamp(tested.completedAt ?? tested.startedAt)
              : undefined,
            current: candidate.id === scenarioCurrentCheckpoint?.id,
          }
        })
    : []

  const selectedPaperRun = route.kind === "paper-run"
    ? paperView?.runs?.find((run) => run.id === route.runId)
    : null
  const selectedPaperReference: DomainObjectReference | null =
    route.kind === "paper-run"
      ? route.decisionId
        ? { kind: "decision", id: route.decisionId, label: route.decisionId }
        : selectedPaperRun
          ? { kind: "run", id: selectedPaperRun.id, label: selectedPaperRun.label }
          : null
      : null
  const selectedPaperDecisionAvailable =
    route.kind !== "paper-run" ||
    !route.decisionId ||
    Boolean(
      selectedPaperRun?.decisions?.some(
        (decision) => decision.id === route.decisionId
      )
    )
  const draftSurface = route.kind === "draft" ? route.view : draftSelection.surface
  const dryRunTab = route.kind === "evaluation" ? route.tab : draftSelection.dryRunTab
  const paperDetailsTab: PaperDetailsTab =
    route.kind === "paper-portfolio" && route.tab !== "overview"
      ? route.tab
      : paperSelection.detailsTab
  const paperRunTab = route.kind === "paper-run" ? route.tab : paperSelection.runTab
  const evidenceTab: WorkspaceEvidenceTab =
    route.kind === "data" ? "data" : route.panel ?? bottomPanel.tab
  const evidenceExpanded =
    route.kind === "data" || route.panel !== undefined || bottomPanel.expanded
  const selectedPaperLifecycleOperation =
    paperLifecycleOperation && paperLifecycleOperation.portfolioId === paperSnapshot?.id
      ? paperLifecycleOperation.action
      : null

  const defaultViewedContext =
    activeContext === "draft"
      ? selectedDryRun
        ? `${draftLabel} · ${selectedDryRun.label} · ${titleCase(dryRunTab)}`
        : `${draftLabel} · ${titleCase(draftSelection.surface)}`
      : activeContext === "paper"
        ? paperLaunched
          ? selectedPaperRun
            ? `Paper · ${selectedPaperRun.label} · ${titleCase(paperRunTab)}`
            : `Paper · ${titleCase(paperDetailsTab)}`
          : "Paper · Readiness"
        : "Live · Readiness"
  const viewedContext = defaultViewedContext
  const attachedContext = conversation.context

  function commitRuntime(
    update: (current: WorkspaceRuntimeState) => WorkspaceRuntimeState
  ) {
    const next = update(runtimeRef.current)
    runtimeRef.current = next
    setRuntime(next)
  }

  function navigate(href: string, replace = false) {
    if (replace) router.replace(href as Route)
    else router.push(href as Route)
  }

  function updateRouteQuery(values: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(values)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    const query = next.toString()
    navigate(query ? `${pathname}?${query}` : pathname)
  }

  function updateChampionSession(
    sourceChampionId: string,
    update: (current: ChampionSessionState) => ChampionSessionState
  ) {
    commitRuntime((current) => {
      const currentSession = current.sessions[sourceChampionId]
      const nextSession = update(currentSession)

      if (nextSession === currentSession) return current

      return {
        ...current,
        sessions: {
          ...current.sessions,
          [sourceChampionId]: nextSession,
        },
      }
    })
  }

  function selectChampion(nextChampionId: string) {
    if (nextChampionId === championId) return
    const nextFixture = getWorkspaceFixture(nextChampionId)
    const nextHref = nextFixture.initialPaper
      ? paperIndexHref(nextChampionId)
      : draftHref(nextChampionId)

    commitRuntime((current) => {
      const sourceChampionId = current.selectedChampionId
      const sourceSession = current.sessions[sourceChampionId]

      return {
        ...current,
        selectedChampionId: nextChampionId,
        recentChampionIds: [
          nextChampionId,
          ...current.recentChampionIds.filter((id) => id !== nextChampionId),
        ].slice(0, workspaceFixtures.length),
        sessions: {
          ...current.sessions,
          [sourceChampionId]: {
            ...sourceSession,
            launchReviewOpen: false,
          },
        },
      }
    })
    setBottomPanel({ tab: "problems", expanded: false })
    setEvaluationReviewOpen(false)
    setResetReviewOpen(false)
    setProfileOpen(false)
    navigate(nextHref)
  }

  function selectWorkspaceContext(
    sourceChampionId: string,
    context: WorkspaceContext
  ) {
    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      conversation: {
        ...current.conversation,
        context: null,
      },
    }))

    navigate(
      context === "draft"
        ? draftHref(sourceChampionId)
        : context === "paper"
          ? paperIndexHref(sourceChampionId)
          : liveHref(sourceChampionId)
    )
  }

  function focusChampionConversation(sourceChampionId: string, context: string) {
    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      conversation: {
        ...current.conversation,
        context,
        focusRequest: current.conversation.focusRequest + 1,
      },
    }))
  }

  function setConversationMessage(sourceChampionId: string, message: string) {
    setComposerDraft(sourceChampionId, message)
  }

  async function submitConversation(
    sourceChampionId: string,
    request: string,
    attachedContext: string,
    mutationTarget: string,
    hasAttachedContext: boolean
  ) {
    conversationSequenceRef.current += 1
    let response: ConversationExchange["response"] = atlasResponseForContext(
      attachedContext,
      mutationTarget
    )
    let changeSetId: string | null = null
    const selectedRuleId = runtimeRef.current.sessions[sourceChampionId].draftSelection.ruleId
    const proposedValue = hasAttachedContext ? parseSemanticRuleIntent(request) : null

    if (hasAttachedContext && selectedRuleId) {
      if (!proposedValue) {
        response = [
          {
            kind: "text",
            text: "I can attach this intent to the selected rule, but I need an explicit semantic value. Try “change to …” or “set this to …”. No change set was created.",
          },
        ]
      } else if (!beginAuthorityOperation(sourceChampionId, "saving-change-set")) {
        response = [
          {
            kind: "text",
            text: "Another confirmed workspace command is still in progress. Try this proposal again when it finishes.",
          },
        ]
      } else {
        try {
          const context = requireScenarioContext(demo.scenario, sourceChampionId)
          const currentRule = context.checkpoint.strategy.sections
            .flatMap((section) => section.rules)
            .find((rule) => rule.id === selectedRuleId)
          if (!currentRule) throw new Error("The selected rule is not part of the current checkpoint.")
          const receipt = await authority.mutateAsync({
            kind: "propose",
            command: {
              ...commandEnvelope("propose", context.champion.id),
              draftId: context.draft.id,
              expectedDraftRevision: context.draft.revision,
              baseCheckpointId: context.checkpoint.id,
              changes: [
                {
                  ruleId: currentRule.id,
                  expectedValue: currentRule.value,
                  proposedValue,
                },
              ],
              motivation: request,
              evidenceRefs: [attachedContext],
              expectedBenefit: "Implements the explicit attached strategy intent.",
              downside: "Requires a new Evaluation before the revised checkpoint can launch.",
            },
          })
          const result = requireAppliedResult(receipt, "change-set-created")
          changeSetId = result.changeSetId
          response = [
            {
              kind: "text",
              text: `I prepared a semantic proposal against ${formatCheckpointLabel(checkpoint)}. Review Current versus Proposed before accepting it; no checkpoint has been created yet.`,
            },
          ]
        } catch (error) {
          response = [
            {
              kind: "text",
              text: `${authorityErrorMessage(error)} No change set was created.`,
            },
          ]
        } finally {
          finishAuthorityOperation(sourceChampionId, "saving-change-set")
        }
      }
    }

    let exchangeId = `${sourceChampionId}:${conversationSequenceRef.current}`
    try {
      const context = requireScenarioContext(demo.scenario, sourceChampionId)
      const references = [
        entityReference("draft-checkpoint", context.checkpoint.id),
        ...(changeSetId
          ? [entityReference("change-set", entityId("change-set", changeSetId))]
          : []),
      ]
      const receipt = await authority.mutateAsync({
        kind: "append-atlas-exchange",
        command: {
          ...commandEnvelope("append-atlas-exchange", context.champion.id),
          championId: context.champion.id,
          userText: request,
          assistantText: response
            .map((part) =>
              part.kind === "text"
                ? part.text
                : `${part.prompt} ${part.options.join(" · ")}`
            )
            .join("\n"),
          references,
        },
      })
      exchangeId = requireAppliedResult(receipt, "atlas-exchange-appended").exchangeId
    } catch (error) {
      response = [
        ...response,
        {
          kind: "text",
          text: `Save failed: ${authorityErrorMessage(error)} Copy this exchange before leaving the page.`,
        },
      ]
    }

    const exchange: ConversationExchange = {
      id: exchangeId,
      request,
      response,
      viewedContext: attachedContext,
      mutationTarget,
    }

    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      conversation: {
        ...current.conversation,
        exchanges: [...current.conversation.exchanges, exchange],
      },
    }))
    clearComposerDraft(sourceChampionId)

    if (changeSetId) navigate(changeSetHref(sourceChampionId, changeSetId))
  }

  async function confirmPaperLaunch() {
    const sourceChampionId = championId

    if (!beginAuthorityOperation(sourceChampionId, "launching-paper")) return

    try {
      const context = requireScenarioContext(demo.scenario, sourceChampionId)
      const evaluation = Object.values(context.scenario.evaluations)
        .filter(
          (candidate) =>
            candidate.championId === context.champion.id &&
            candidate.checkpointId === context.checkpoint.id &&
            candidate.status === "completed"
        )
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]
      if (!evaluation) {
        throw new Error("The current checkpoint needs a completed Evaluation.")
      }
      const sequence =
        Object.values(context.scenario.portfolios).filter(
          (portfolio) => portfolio.championId === context.champion.id
        ).length + 1
      const receipt = await authority.mutateAsync({
        kind: "launch",
        command: {
          ...commandEnvelope("launch", context.champion.id),
          draftId: context.draft.id,
          expectedDraftRevision: context.draft.revision,
          checkpointId: context.checkpoint.id,
          evaluationId: evaluation.id,
          portfolioName: `${context.checkpoint.strategy.title} · Paper ${sequence}`,
          simulatedCapital: evaluation.setup.startingCapital,
        },
      })
      const result = requireAppliedResult(receipt, "paper-launched")
      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        draftSelection: {
          ...current.draftSelection,
          decision: null,
        },
        launchReviewOpen: false,
        conversation: {
          ...current.conversation,
          context: null,
        },
      }))
      navigate(
        paperPortfolioHref(sourceChampionId, result.portfolioId)
      )
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "launching-paper")
    }
  }

  async function forkCheckpoint(sourceCheckpoint: string) {
    const sourceChampionId = championId

    if (!beginAuthorityOperation(sourceChampionId, "forking-checkpoint")) return

    try {
      const context = requireScenarioContext(demo.scenario, sourceChampionId)
      const source = Object.values(context.scenario.checkpoints).find(
        (candidate) =>
          candidate.championId === context.champion.id &&
          candidate.label === sourceCheckpoint
      )
      if (!source) throw new Error("The selected historical checkpoint is unavailable.")
      const receipt = await authority.mutateAsync({
        kind: "restore",
        command: {
          ...commandEnvelope("restore", context.champion.id),
          draftId: context.draft.id,
          expectedDraftRevision: context.draft.revision,
          sourceCheckpointId: source.id,
          motivation: `Restore the semantic strategy from ${source.label} as a new checkpoint.`,
        },
      })
      const result = requireAppliedResult(receipt, "change-set-created")
      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        draftSelection: {
          ...current.draftSelection,
          decision: null,
        },
        conversation: {
          ...current.conversation,
          context: null,
        },
      }))
      navigate(changeSetHref(sourceChampionId, result.changeSetId))
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "forking-checkpoint")
    }
  }

  async function runEvaluation() {
    const sourceChampionId = championId

    if (!beginAuthorityOperation(sourceChampionId, "evaluating")) return

    try {
      const context = requireScenarioContext(demo.scenario, sourceChampionId)
      const latestSetup = Object.values(context.scenario.evaluations)
        .filter((evaluation) => evaluation.championId === context.champion.id)
        .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0]?.setup
      if (!latestSetup) throw new Error("Evaluation setup is unavailable.")
      const receipt = await authority.mutateAsync({
        kind: "evaluate",
        command: {
          ...commandEnvelope("evaluate", context.champion.id),
          draftId: context.draft.id,
          expectedDraftRevision: context.draft.revision,
          checkpointId: context.checkpoint.id,
          setup: structuredClone(latestSetup),
        },
      })
      const result = requireAppliedResult(receipt, "evaluation-completed")
      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        draftSelection: {
          ...current.draftSelection,
          dryRunId: result.evaluationId,
          dryRunTab: "summary",
        },
        conversation: {
          ...current.conversation,
          context: null,
        },
      }))
      navigate(evaluationHref(sourceChampionId, result.evaluationId))
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "evaluating")
    }
  }

  function beginAuthorityOperation(
    sourceChampionId: string,
    operation: Exclude<WorkspaceAuthorityOperation, null>
  ) {
    if (runtimeRef.current.sessions[sourceChampionId].authorityOperation) {
      return false
    }

    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      authorityOperation: operation,
      authorityError: null,
    }))
    return true
  }

  function finishAuthorityOperation(
    sourceChampionId: string,
    operation: Exclude<WorkspaceAuthorityOperation, null>
  ) {
    updateChampionSession(sourceChampionId, (current) =>
      current.authorityOperation === operation
        ? { ...current, authorityOperation: null }
        : current
    )
  }

  function setAuthorityError(sourceChampionId: string, error: string) {
    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      authorityError: error,
    }))
  }

  async function confirmResetDemo() {
    try {
      await resetDemo.mutateAsync()
      const next = createInitialRuntime()
      runtimeRef.current = next
      setRuntime(next)
      setBottomPanel({ tab: "problems", expanded: false })
      resetInteractions()
      setResetReviewOpen(false)
      setProfileOpen(false)
      navigate(draftHref(championId), true)
    } catch (error) {
      setAuthorityError(championId, authorityErrorMessage(error))
    }
  }

  async function decideChangeSet(action: "accept" | "reject") {
    if (!validRoutedChangeSet) return
    const sourceChampionId = championId
    if (!beginAuthorityOperation(sourceChampionId, "saving-change-set")) return

    try {
      const context = requireScenarioContext(demo.scenario, sourceChampionId)
      const receipt = await authority.mutateAsync(
        action === "accept"
          ? {
              kind: "accept",
              command: {
                ...commandEnvelope("accept", context.champion.id),
                changeSetId: validRoutedChangeSet.id,
                expectedChangeSetRevision: validRoutedChangeSet.revision,
                expectedDraftRevision: context.draft.revision,
              },
            }
          : {
              kind: "reject",
              command: {
                ...commandEnvelope("reject", context.champion.id),
                changeSetId: validRoutedChangeSet.id,
                expectedChangeSetRevision: validRoutedChangeSet.revision,
                reason: "Rejected during explicit semantic review.",
              },
            }
      )

      if (action === "accept") {
        const result = requireAppliedResult(receipt, "change-set-accepted")
        navigate(checkpointHref(sourceChampionId, result.checkpointId))
      } else {
        requireAppliedResult(receipt, "change-set-rejected")
        navigate(draftHref(sourceChampionId))
      }
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "saving-change-set")
    }
  }

  function openCheckpointByLabel(label: string) {
    if (!scenarioChampion || !demo.scenario) return
    const target = Object.values(demo.scenario.checkpoints).find(
      (candidate) =>
        candidate.championId === scenarioChampion.id && candidate.label === label
    )
    if (target) navigate(checkpointHref(championId, target.id))
  }

  function returnToDraftWorkspace() {
    updateChampionSession(championId, (current) => ({
      ...current,
      draftSelection: {
        ...current.draftSelection,
        dryRunId: null,
      },
      conversation: {
        ...current.conversation,
        context: null,
      },
    }))
    navigate(draftHref(championId))
  }

  function returnToPaperOverview() {
    updateChampionSession(championId, (current) => ({
      ...current,
      paperSelection: {
        ...current.paperSelection,
        reference: null,
        panelExpanded: false,
      },
      conversation: {
        ...current.conversation,
        context: null,
      },
    }))
    navigate(
      currentPaperPortfolioId
        ? paperPortfolioHref(championId, currentPaperPortfolioId)
        : paperIndexHref(championId)
    )
  }

  function openPaperRuns() {
    updateChampionSession(championId, (current) => ({
      ...current,
      paperSelection: {
        ...current.paperSelection,
        reference: null,
        detailsTab: "runs",
        panelExpanded: true,
      },
      conversation: {
        ...current.conversation,
        context: null,
      },
    }))
    if (currentPaperPortfolioId) {
      navigate(paperPortfolioHref(championId, currentPaperPortfolioId, "runs"))
    }
  }

  function reviewPaperLifecycle(action: PaperLifecycleAction) {
    if (!paperSnapshot) return
    updateChampionSession(championId, (current) => ({
      ...current,
      paperLifecycleReview: { portfolioId: paperSnapshot.id, action },
    }))
  }

  async function confirmPaperLifecycle() {
    if (!paperLifecycleReview) return
    const { portfolioId, action } = paperLifecycleReview
    const sourceChampionId = championId
    const context = requireScenarioContext(demo.scenario, sourceChampionId)
    const sourcePortfolio = context.scenario.portfolios[portfolioId]
    if (!sourcePortfolio) return

    const allowed =
      (action === "stop" && sourcePortfolio.state === "active") ||
      (action === "archive" && sourcePortfolio.state === "stopped") ||
      (action === "unarchive" && sourcePortfolio.state === "archived")
    if (!allowed) {
      setAuthorityError(
        sourceChampionId,
        `${action} is unavailable while this Paper portfolio is ${sourcePortfolio.state}.`
      )
      return
    }

    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      paperLifecycleReview: null,
      paperLifecycleOperation: { portfolioId, action },
      paperPortfolios: current.paperPortfolios.map((portfolio) =>
        portfolio.id === portfolioId && action === "stop"
          ? { ...portfolio, operationalState: "stopping" }
          : portfolio
      ),
    }))

    try {
      if (action === "stop") await waitForDemoTransition()
      const request: DemoAuthorityRequest =
        action === "stop"
          ? {
              kind: "stop",
              command: {
                ...commandEnvelope("stop", context.champion.id),
                portfolioId: sourcePortfolio.id,
                expectedPortfolioRevision: sourcePortfolio.revision,
              },
            }
          : action === "archive"
            ? {
                kind: "archive",
                command: {
                  ...commandEnvelope("archive", context.champion.id),
                  portfolioId: sourcePortfolio.id,
                  expectedPortfolioRevision: sourcePortfolio.revision,
                },
              }
            : {
                kind: "unarchive",
                command: {
                  ...commandEnvelope("unarchive", context.champion.id),
                  portfolioId: sourcePortfolio.id,
                  expectedPortfolioRevision: sourcePortfolio.revision,
                },
              }
      const receipt = await authority.mutateAsync(request)
      requireAppliedResult(receipt, "portfolio-state-changed")
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        paperLifecycleOperation: null,
      }))
      return
    }

    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      paperLifecycleOperation: null,
    }))

    navigate(
      action === "archive"
        ? paperArchivedHref(sourceChampionId)
        : paperPortfolioHref(sourceChampionId, portfolioId)
    )
  }

  return (
    <SidebarProvider
      className="h-svh min-h-[36rem] overflow-hidden"
      style={{ "--sidebar-width": "14rem" } as CSSProperties}
    >
      <a
        href="#primary-workspace"
        className="fixed left-3 top-3 z-[60] -translate-y-20 rounded-md bg-background px-3 py-2 text-sm font-medium shadow-sm focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to workspace
      </a>

      <Sidebar
        collapsible="offcanvas"
        role="navigation"
        aria-label="Champion workspace navigation"
      >
        <SidebarHeader>
          <span className="px-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em]">
            Vantheon
          </span>
          <Select
            value={championId}
            onValueChange={(value) => value && selectChampion(value)}
          >
            <SelectTrigger className="w-full" aria-label="Champion workspace">
              <SelectValue>{workspaceFixture.champion.name}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {workspaceFixtures.map((fixture) => (
                <SelectItem key={fixture.champion.id} value={fixture.champion.id}>
                  {fixture.champion.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <WorkspaceEnvironmentNavigationItem
                label="Live"
                status={{ kind: "empty", environment: "live" }}
                active={activeContext === "live"}
                onClick={() => selectWorkspaceContext(championId, "live")}
              />
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Strategies</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeContext === "draft"}
                    onClick={() => selectWorkspaceContext(championId, "draft")}
                  >
                    <NotebookTabs />
                    <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                      <span className="truncate">{draftView.title}</span>
                      <span className="truncate text-xs text-foreground">
                        {draftLabel} · {checkpointLabel} ·{" "}
                        {evaluationComplete ? "Tested" : "Untested"}
                      </span>
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <WorkspaceEnvironmentNavigationItem
                    label="Paper"
                    status={
                      paperPortfolios.some(
                        (portfolio) => portfolio.operationalState !== "archived"
                      )
                        ? {
                            kind: "running",
                            portfolioCount: paperPortfolios.filter(
                              (portfolio) => portfolio.operationalState !== "archived"
                            ).length,
                          }
                        : paperLaunched
                          ? {
                              kind: "archived",
                              portfolioCount: paperPortfolios.length,
                            }
                          : { kind: "empty", environment: "paper" }
                    }
                    active={activeContext === "paper"}
                    onClick={() => selectWorkspaceContext(championId, "paper")}
                  />
                </SidebarMenuItem>
                {paperPortfolios
                  .filter((portfolio) => portfolio.operationalState !== "archived")
                  .map((portfolio) => (
                    <SidebarMenuItem key={portfolio.id}>
                      <WorkspaceEnvironmentNavigationItem
                        label={portfolio.label}
                        status={
                          portfolio.operationalState === "stopped"
                            ? { kind: "stopped" }
                            : { kind: "running", portfolioCount: 1 }
                        }
                        active={selectedPortfolioId === portfolio.id}
                        onClick={() =>
                          navigate(paperPortfolioHref(championId, portfolio.id))
                        }
                      />
                    </SidebarMenuItem>
                  ))}
                <SidebarMenuItem>
                  <WorkspaceEnvironmentNavigationItem
                    label="Archived Paper"
                    status={{
                      kind: "archived",
                      portfolioCount: paperPortfolios.filter(
                        (portfolio) => portfolio.operationalState === "archived"
                      ).length,
                    }}
                    active={route.kind === "paper-archived"}
                    onClick={() => navigate(paperArchivedHref(championId))}
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={
                  route.kind === "data" ||
                  (activeContext === "draft" &&
                    evidenceExpanded &&
                    evidenceTab === "data")
                }
                onClick={() => {
                  setBottomPanel({ tab: "data", expanded: true })
                  navigate(dataHref(championId))
                }}
              >
                <Database />
                <span>Data</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => setProfileOpen(true)}>
                <CircleUserRound />
                <span>Profile</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-3">
          <SidebarTrigger />
          {activeContext === "draft" && selectedDryRun ? (
            <WorkspaceHeaderBreadcrumbs
              items={[
                { label: draftLabel, onSelect: returnToDraftWorkspace },
                { label: selectedDryRun.label },
              ]}
            />
          ) : activeContext === "paper" && selectedPaperRun ? (
            <WorkspaceHeaderBreadcrumbs
              items={[
                { label: "Paper", onSelect: returnToPaperOverview },
                { label: "Runs", onSelect: openPaperRuns },
                { label: selectedPaperRun.label },
              ]}
            />
          ) : activeContext === "live" ? (
            <span className="text-sm font-medium md:hidden">Live</span>
          ) : (
            <Tabs
              value={activeContext}
              onValueChange={(value) =>
                selectWorkspaceContext(championId, value as WorkspaceContext)
              }
            >
              <TabsList variant="line">
                <TabsTrigger value="draft">{draftLabel}</TabsTrigger>
                <TabsTrigger value="paper">Paper</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <WorkspaceContextStatus
            {...(activeContext === "live"
              ? { kind: "live" as const }
              : activeContext === "paper"
                ? {
                    kind: "paper" as const,
                    freshness: paperView?.freshness ?? "Paper collection · local evidence",
                    marketRelevant: (paperView?.openOrders ?? 0) > 0,
                    marketSession: marketSessionFixture,
                  }
                : selectedDryRun
                  ? {
                      kind: "evaluation" as const,
                      dataCutoff:
                        selectedDryRun.setup.find(
                          (item) => item.label === "Data cutoff"
                        )?.value ?? "Unavailable",
                    }
                  : { kind: "draft" as const, label: localSaveStatus })}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              id="primary-workspace"
              tabIndex={-1}
              className="min-h-0 min-w-0 flex-1 outline-none"
            >
              {route.kind === "unavailable" ? (
                <UnavailableWorkspaceResource
                  label="Workspace resource"
                  onBack={() => navigate(draftHref(championId))}
                />
              ) : route.kind === "draft-change" ? (
                validRoutedChangeSet && routedChangeSetBase && scenarioCurrentCheckpoint ? (
                  <ChangeSetReviewWorkspace
                    changeSet={validRoutedChangeSet}
                    baseCheckpoint={routedChangeSetBase}
                    currentCheckpoint={scenarioCurrentCheckpoint}
                    pending={authorityOperation === "saving-change-set"}
                    error={authorityError}
                    onAccept={() => decideChangeSet("accept")}
                    onReject={() => decideChangeSet("reject")}
                    onBack={() => navigate(draftHref(championId))}
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Change set"
                    onBack={() => navigate(draftHref(championId))}
                  />
                )
              ) : route.kind === "draft-checkpoint" ? (
                validRoutedCheckpoint ? (
                  <CheckpointDetailWorkspace
                    checkpoint={validRoutedCheckpoint}
                    isCurrent={validRoutedCheckpoint.id === scenarioCurrentCheckpoint?.id}
                    evaluation={Object.values(demo.scenario?.evaluations ?? {}).find(
                      (evaluation) =>
                        evaluation.checkpointId === validRoutedCheckpoint.id &&
                        evaluation.status === "completed"
                    )}
                    onBack={() => navigate(draftHref(championId))}
                    onRestore={() => forkCheckpoint(validRoutedCheckpoint.label)}
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Checkpoint"
                    onBack={() => navigate(draftHref(championId))}
                  />
                )
              ) : route.kind === "data" ? (
                demo.scenario && scenarioChampion ? (
                  <DataWorkspace
                    scenario={demo.scenario}
                    championId={scenarioChampion.id}
                    activeTab={route.tab}
                    onTabChange={(tab) => navigate(dataHref(championId, tab))}
                    onOpenSource={(sourceId) =>
                      navigate(sourceArtifactHref(championId, sourceId))
                    }
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Data"
                    onBack={() => navigate(draftHref(championId))}
                  />
                )
              ) : route.kind === "source" ? (
                routedSource && routedSourceBelongsToChampion ? (
                  <SourceArtifactWorkspace
                    source={routedSource}
                    onBack={() => navigate(dataHref(championId, "sources"))}
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Source artifact"
                    onBack={() => navigate(dataHref(championId, "sources"))}
                  />
                )
              ) : route.kind === "evaluation" && !selectedDryRun ? (
                <UnavailableWorkspaceResource
                  label="Evaluation"
                  onBack={() => navigate(draftHref(championId))}
                />
              ) : activeContext === "draft" ? (
                selectedDryRun ? (
                  <DryRunWorkspace
                    run={selectedDryRun}
                    activeTab={dryRunTab}
                    onActiveTabChange={(dryRunTab) => {
                      updateChampionSession(championId, (current) => ({
                        ...current,
                        draftSelection: {
                          ...current.draftSelection,
                          dryRunTab,
                        },
                        conversation: {
                          ...current.conversation,
                          context: null,
                        },
                      }))
                      navigate(evaluationHref(championId, selectedDryRun.id, dryRunTab))
                    }}
                    onOpenSource={(sourceId) =>
                      navigate(sourceArtifactHref(championId, sourceId))
                    }
                  />
                ) : (
                  <DraftStrategyWorkspace
                    key={championId}
                    draft={draftView}
                    evaluation={currentEvaluation}
                    draftLabel={draftLabel}
                  checkpoint={checkpoint}
                  evaluationComplete={evaluationComplete}
                  authorityOperation={authorityOperation}
                  saveStatus={localSaveStatus}
                  checkpointHash={scenarioCurrentCheckpoint?.strategyHash}
                  checkpointRevision={scenarioCurrentCheckpoint?.revision}
                  checkpointCreatedAt={
                    scenarioCurrentCheckpoint
                      ? formatDemoTimestamp(scenarioCurrentCheckpoint.createdAt)
                      : undefined
                  }
                  checkpointActor={
                    scenarioCurrentCheckpoint
                      ? `${scenarioCurrentCheckpoint.createdBy.kind} · ${scenarioCurrentCheckpoint.createdBy.id}`
                      : undefined
                  }
                  activeTab={draftSurface}
                  onRunEvaluation={() => setEvaluationReviewOpen(true)}
                    onActiveTabChange={(surface) =>
                      {
                        updateChampionSession(championId, (current) => ({
                          ...current,
                          draftSelection: {
                            ...current.draftSelection,
                            surface,
                          },
                          conversation: {
                            ...current.conversation,
                            context: null,
                          },
                        }))
                        navigate(draftHref(championId, surface))
                      }
                    }
                    onAskAbout={(context) =>
                      focusChampionConversation(championId, context)
                    }
                    onSelectedRuleChange={(ruleId) =>
                      updateChampionSession(championId, (current) => ({
                        ...current,
                        draftSelection: {
                          ...current.draftSelection,
                          ruleId,
                        },
                      }))
                    }
                    onSelectedDecisionChange={(decision) =>
                      updateChampionSession(championId, (current) => ({
                        ...current,
                        draftSelection: {
                          ...current.draftSelection,
                          decision,
                        },
                      }))
                    }
                  />
                )
              ) : activeContext === "paper" && route.kind === "paper-index" ? (
                paperLaunched ? (
                  <PaperCollectionWorkspace
                    title="Paper portfolios"
                    portfolios={paperPortfolios.filter(
                      (portfolio) => portfolio.operationalState !== "archived"
                    )}
                    archivedCount={paperPortfolios.filter(
                      (portfolio) => portfolio.operationalState === "archived"
                    ).length}
                    onOpen={(portfolioId) =>
                      navigate(paperPortfolioHref(championId, portfolioId))
                    }
                    onCompare={(portfolioIds) =>
                      navigate(paperCompareHref(championId, portfolioIds))
                    }
                    onOpenArchived={() => navigate(paperArchivedHref(championId))}
                  />
                ) : (
                  <EmptyEnvironmentWorkspace
                    environment="Paper"
                    draftLabel={draftLabel}
                    evaluationComplete={evaluationComplete}
                    paperLaunched={false}
                    onAskAtlas={() =>
                      focusChampionConversation(championId, "Paper · Journey")
                    }
                    onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                    onRunDraft={() => setEvaluationReviewOpen(true)}
                    onReviewPaperLaunch={() =>
                      updateChampionSession(championId, (current) => ({
                        ...current,
                        launchReviewOpen: true,
                      }))
                    }
                    onOpenPaper={() => navigate(paperIndexHref(championId))}
                  />
                )
              ) : activeContext === "paper" && route.kind === "paper-archived" ? (
                <PaperCollectionWorkspace
                  title="Archived Paper"
                  portfolios={paperPortfolios.filter(
                    (portfolio) => portfolio.operationalState === "archived"
                  )}
                  archived
                  archivedCount={0}
                  onOpen={(portfolioId) =>
                    navigate(paperPortfolioHref(championId, portfolioId))
                  }
                  onCompare={(portfolioIds) =>
                    navigate(paperCompareHref(championId, portfolioIds))
                  }
                  onOpenArchived={() => undefined}
                />
              ) : activeContext === "paper" && route.kind === "paper-compare" ? (
                <PaperComparisonWorkspace
                  portfolios={route.portfolioIds
                    .map((portfolioId) =>
                      paperPortfolios.find((portfolio) => portfolio.id === portfolioId)
                    )
                    .filter((portfolio): portfolio is PaperLaunchSnapshot => Boolean(portfolio))}
                  paper={workspaceFixture.paper}
                  onOpen={(portfolioId) =>
                    navigate(paperPortfolioHref(championId, portfolioId))
                  }
                  onBack={() => navigate(paperIndexHref(championId))}
                />
              ) : activeContext === "paper" &&
                route.kind === "paper-run" &&
                (!selectedPaperRun || !selectedPaperDecisionAvailable) ? (
                <UnavailablePaperResource onBack={() => navigate(paperIndexHref(championId))} />
              ) : activeContext === "paper" && paperView ? (
                <div className="h-full overflow-auto p-4 sm:p-5">
                  <PaperPortfolioWorkspace
                    paper={paperView}
                    selectedReference={selectedPaperReference}
                    runTab={paperRunTab}
                    onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                    lifecycleOperation={selectedPaperLifecycleOperation}
                    onStop={() => reviewPaperLifecycle("stop")}
                    onArchive={() => reviewPaperLifecycle("archive")}
                    onUnarchive={() => reviewPaperLifecycle("unarchive")}
                    onRunTabChange={(runTab) =>
                      {
                        updateChampionSession(championId, (current) => ({
                          ...current,
                          paperSelection: {
                            ...current.paperSelection,
                            runTab,
                          },
                          conversation: {
                            ...current.conversation,
                            context: null,
                          },
                        }))
                        if (selectedPaperRun && currentPaperPortfolioId) {
                          navigate(
                            paperRunHref(
                              championId,
                              currentPaperPortfolioId,
                              selectedPaperRun.id,
                              runTab,
                              route.kind === "paper-run" ? route.decisionId : undefined
                            )
                          )
                        }
                      }
                    }
                    onSelectedReferenceChange={(reference) =>
                      {
                        updateChampionSession(championId, (current) => ({
                          ...current,
                          paperSelection: {
                            ...current.paperSelection,
                            reference,
                            panelExpanded: reference
                              ? false
                              : current.paperSelection.panelExpanded,
                            runTab: reference ? "summary" : current.paperSelection.runTab,
                          },
                          conversation: {
                            ...current.conversation,
                            context: null,
                          },
                        }))
                        if (reference?.kind === "run" && currentPaperPortfolioId) {
                          navigate(
                            paperRunHref(
                              championId,
                              currentPaperPortfolioId,
                              reference.id
                            )
                          )
                        }
                      }
                    }
                  />
                </div>
              ) : activeContext === "paper" ? (
                <UnavailablePaperResource onBack={() => navigate(paperIndexHref(championId))} />
              ) : (
                <EmptyEnvironmentWorkspace
                  environment="Live"
                  draftLabel={draftLabel}
                  evaluationComplete={evaluationComplete}
                  paperLaunched={paperLaunched}
                  onAskAtlas={() =>
                    focusChampionConversation(
                      championId,
                      "Live · Journey"
                    )
                  }
                  onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                  onRunDraft={() => setEvaluationReviewOpen(true)}
                  onReviewPaperLaunch={() =>
                    updateChampionSession(championId, (current) => ({
                      ...current,
                      launchReviewOpen: true,
                    }))
                  }
                  onOpenPaper={() => selectWorkspaceContext(championId, "paper")}
                />
              )}
            </div>

            {activeContext === "draft" ? (
              <WorkspaceEvidencePanel
                key={championId}
                checkpoint={checkpoint}
                evaluation={currentEvaluation}
                evaluations={evaluations}
                baseline={evidenceBaseline}
                template={workspaceFixture.evaluation}
                authorityError={authorityError}
                activeTab={evidenceTab}
                expanded={evidenceExpanded}
                onActiveTabChange={(tab) => {
                  setBottomPanel((current) => ({ ...current, tab }))
                  if (tab === "data") navigate(dataHref(championId))
                  else navigate(`${draftHref(championId)}?panel=${encodeURIComponent(tab)}`)
                }}
                onExpandedChange={(expanded) =>
                  {
                    setBottomPanel((current) => ({ ...current, expanded }))
                    if (!expanded) updateRouteQuery({ panel: null })
                  }
                }
                forkPending={authorityOperation === "forking-checkpoint"}
                onForkCheckpoint={forkCheckpoint}
                onOpenCheckpoint={openCheckpointByLabel}
                checkpoints={checkpointHistory}
                onOpenDryRun={(dryRunId) =>
                  {
                    updateChampionSession(championId, (current) => ({
                      ...current,
                      draftSelection: {
                        ...current.draftSelection,
                        dryRunId,
                        dryRunTab: "summary",
                      },
                      conversation: {
                        ...current.conversation,
                        context: null,
                      },
                    }))
                    navigate(evaluationHref(championId, dryRunId))
                  }
                }
              />
            ) : activeContext === "paper" && paperView ? (
              <PaperWorkspaceBottomPanel
                paper={paperView}
                activeTab={paperDetailsTab}
                expanded={paperSelection.panelExpanded}
                onActiveTabChange={(detailsTab) =>
                  {
                    updateChampionSession(championId, (current) => ({
                      ...current,
                      paperSelection: {
                        ...current.paperSelection,
                        detailsTab,
                      },
                      conversation: {
                        ...current.conversation,
                        context: null,
                      },
                    }))
                    if (currentPaperPortfolioId) {
                      navigate(
                        paperPortfolioHref(
                          championId,
                          currentPaperPortfolioId,
                          detailsTab
                        )
                      )
                    }
                  }
                }
                onExpandedChange={(panelExpanded) =>
                  updateChampionSession(championId, (current) => ({
                    ...current,
                    paperSelection: {
                      ...current.paperSelection,
                      panelExpanded,
                    },
                  }))
                }
                onOpenRun={(run) =>
                  {
                    updateChampionSession(championId, (current) => ({
                      ...current,
                      paperSelection: {
                        ...current.paperSelection,
                        reference: { kind: "run", id: run.id, label: run.label },
                        panelExpanded: false,
                        runTab: "summary",
                      },
                      conversation: {
                        ...current.conversation,
                        context: null,
                      },
                    }))
                    if (currentPaperPortfolioId) {
                      navigate(
                        paperRunHref(championId, currentPaperPortfolioId, run.id)
                      )
                    }
                  }
                }
              />
            ) : null}
          </div>

          <WorkspaceChampionDock
            championId={championId}
            viewedContext={viewedContext}
            attachedContext={attachedContext}
            focusRequest={conversation.focusRequest}
            message={composerMessage}
            exchanges={conversation.exchanges}
            paperLaunchReviewAvailable={paperLaunchReviewAvailable}
            onMessageChange={(message) =>
              setConversationMessage(championId, message)
            }
            onSubmit={(request) =>
              submitConversation(
                championId,
                request,
                attachedContext ?? viewedContext,
                `${draftLabel} · ${checkpointLabel}`,
                Boolean(attachedContext)
              )
            }
            onClearAttachedContext={() =>
              updateChampionSession(championId, (current) => ({
                ...current,
                conversation: {
                  ...current.conversation,
                  context: null,
                },
              }))
            }
            onReviewPaperLaunch={() =>
              updateChampionSession(championId, (current) => ({
                ...current,
                launchReviewOpen: true,
              }))
            }
          />
        </div>
      </SidebarInset>

      <EvaluationPreflightDialog
        open={evaluationReviewOpen}
        onOpenChange={setEvaluationReviewOpen}
        checkpoint={scenarioCurrentCheckpoint}
        evaluationTemplate={evaluationSetupTemplate}
        benchmark={
          evaluationSetupTemplate
            ? demo.scenario?.benchmarks[evaluationSetupTemplate.setup.benchmarkId]
                ?.displayName
            : undefined
        }
        pending={authorityOperation === "evaluating"}
        onConfirm={() => {
          setEvaluationReviewOpen(false)
          void runEvaluation()
        }}
      />

      <PaperLaunchDialog
        open={launchReviewOpen}
        onOpenChange={(open) =>
          updateChampionSession(championId, (current) => ({
            ...current,
            launchReviewOpen: open,
          }))
        }
        onConfirm={confirmPaperLaunch}
        source={`${draftLabel} · ${checkpointLabel}`}
        evaluationId={currentEvaluation?.id ?? "Unavailable"}
        benchmark={
          currentEvaluation?.setup.find((item) => item.label === "Benchmark")?.value ??
          "Unavailable"
        }
        capital={
          currentEvaluation?.setup.find((item) => item.label === "Capital")?.value ??
          "Unavailable"
        }
        schedule={
          scenarioCurrentCheckpoint
            ? describeSchedule(scenarioCurrentCheckpoint.strategy)
            : "Unavailable"
        }
        pending={authorityOperation === "launching-paper"}
        error={authorityError}
      />

      <PaperLifecycleDialog
        review={
          paperLifecycleReview
            ? {
                action: paperLifecycleReview.action,
                label:
                  paperPortfolios.find(
                    (portfolio) => portfolio.id === paperLifecycleReview.portfolioId
                  )?.label ?? "Paper portfolio",
              }
            : null
        }
        onOpenChange={(open) => {
          if (!open) {
            updateChampionSession(championId, (current) => ({
              ...current,
              paperLifecycleReview: null,
            }))
          }
        }}
        onConfirm={confirmPaperLifecycle}
      />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              Local demo controls for this browser. Authentication and brokerage
              settings are not part of this demo.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Local demo data</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirmed Draft, Evaluation, Paper, and sent Atlas evidence is stored
              locally in this browser.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={() => setResetReviewOpen(true)}
            >
              Reset local demo data
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={resetReviewOpen} onOpenChange={setResetReviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset local demo data?</DialogTitle>
            <DialogDescription>
              This restores the deterministic Mara and Iris scenario and removes
              locally created checkpoints, Evaluations, Paper portfolios, receipts,
              and sent Atlas exchanges.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={resetDemo.isPending}
              onClick={() => setResetReviewOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={resetDemo.isPending}
              onClick={confirmResetDemo}
            >
              {resetDemo.isPending ? "Resetting…" : "Reset demo data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={schemaResetNotice} onOpenChange={setSchemaResetNotice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Local demo data was refreshed</DialogTitle>
            <DialogDescription>
              The scenario schema changed, so this browser was deterministically
              reseeded to keep references, accounting, and command receipts valid.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" onClick={() => setSchemaResetNotice(false)}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
}

function createInitialRuntime(): WorkspaceRuntimeState {
  const selectedChampionId = workspaceFixtures[0].champion.id

  return {
    selectedChampionId,
    recentChampionIds: [selectedChampionId],
    sessions: Object.fromEntries(
      workspaceFixtures.map((fixture) => [
        fixture.champion.id,
        createChampionSession(fixture),
      ])
    ),
  }
}

function projectScenarioOntoRuntime(
  current: WorkspaceRuntimeState,
  scenario: WorkspaceScenario
): WorkspaceRuntimeState {
  return {
    ...current,
    sessions: Object.fromEntries(
      workspaceFixtures.map((fixture) => {
        const existing = current.sessions[fixture.champion.id] ?? createChampionSession(fixture)
        const champion = Object.values(scenario.champions).find(
          (candidate) => candidate.displayName.toLowerCase() === fixture.champion.name.toLowerCase()
        )
        if (!champion) return [fixture.champion.id, existing]

        const draft = scenario.drafts[champion.currentDraftId]
        const checkpoint = draft ? scenario.checkpoints[draft.currentCheckpointId] : undefined
        if (!draft || !checkpoint) return [fixture.champion.id, existing]

        const evaluations = Object.values(scenario.evaluations)
          .filter(
            (evaluation) =>
              evaluation.championId === champion.id &&
              evaluation.status === "completed" &&
              Boolean(evaluation.completedAt)
          )
          .sort((left, right) => left.startedAt.localeCompare(right.startedAt))
          .map((evaluation, index, all) =>
            projectEvaluation(scenario, evaluation, fixture, all[index - 1])
          )

        const paperPortfolios = Object.values(scenario.portfolios)
          .filter((portfolio) => portfolio.championId === champion.id)
          .sort((left, right) => left.launchedAt.localeCompare(right.launchedAt))
          .map((portfolio) => projectPaperPortfolio(scenario, portfolio))
        const exchanges = Object.values(scenario.atlasExchanges)
          .filter((exchange) => exchange.championId === champion.id)
          .sort((left, right) => left.sequence - right.sequence)
          .map<ConversationExchange>((exchange) => ({
            id: exchange.id,
            request: exchange.userText,
            response: [
              {
                kind: "text",
                text:
                  exchange.assistantText ??
                  "This sent exchange is awaiting a completed Atlas response.",
              },
            ],
            viewedContext:
              exchange.references.at(-1)?.kind.replaceAll("-", " ") ?? "Champion",
            mutationTarget: exchange.references
              .map((reference) => `${reference.kind} · ${reference.id}`)
              .join(" · ") || "Current Draft",
          }))

        return [
          fixture.champion.id,
          {
            ...existing,
            evaluations,
            draftState: {
              checkpoint: checkpoint.label,
              rules: projectStrategyRules(checkpoint.strategy),
            },
            paperPortfolios,
            conversation: {
              ...existing.conversation,
              exchanges,
            },
          },
        ]
      })
    ),
  }
}

function projectEvaluation(
  scenario: WorkspaceScenario,
  evaluation: EvaluationRecord,
  fixture: WorkspaceFixture,
  previous?: EvaluationRecord
): WorkspaceEvaluationFixture {
  const checkpoint = scenario.checkpoints[evaluation.checkpointId]
  const benchmark = scenario.benchmarks[evaluation.setup.benchmarkId]
  const rules = checkpoint ? projectStrategyRules(checkpoint.strategy) : []
  const decisions = evaluation.decisionIds
    .map((id) => scenario.decisions[id])
    .filter((decision): decision is NonNullable<typeof decision> => Boolean(decision))
  const metrics = evaluationMetrics(evaluation)
  const previousMetrics = previous ? evaluationMetrics(previous) : null
  const completedAt = evaluation.completedAt ?? evaluation.startedAt

  return {
    id: evaluation.id,
    label: `Evaluation ${evaluation.id}`,
    status: "completed",
    authority: "demo-authority",
    championId: fixture.champion.id,
    checkpoint: checkpoint?.label ?? "Unavailable",
    ruleSnapshot: rules,
    completedAt: formatDemoTimestamp(completedAt),
    duration: formatDuration(evaluation.startedAt, completedAt),
    setup: [
      {
        label: "Window",
        value: `${evaluation.setup.window.start} – ${evaluation.setup.window.end}`,
      },
      {
        label: "Benchmark",
        value: benchmark?.displayName ?? "Unavailable",
      },
      {
        label: "Capital",
        value: formatMoney(evaluation.setup.startingCapital),
      },
      {
        label: "Costs",
        value: `${evaluation.setup.transactionCostBps} bps · ${evaluation.setup.fillModel.replaceAll("-", " ")}`,
      },
      {
        label: "Schedule / timezone",
        value: `${checkpoint ? describeSchedule(checkpoint.strategy) : "Unavailable"} · ${evaluation.setup.timezone}`,
      },
      {
        label: "Data cutoff",
        value: formatDemoTimestamp(evaluation.setup.dataCutoff),
      },
      {
        label: "Source",
        value: `${evaluation.setup.source.provider} · ${evaluation.setup.source.dataset}`,
      },
      {
        label: "Limitations",
        value: "Bounded deterministic demo · simulated decisions only",
      },
    ],
    metrics: metrics.map((metric) => {
      const baseline = previousMetrics?.find((candidate) => candidate.id === metric.id)
      const baselineNumber = baseline ? Number(baseline.value) : Number(metric.value)
      const currentNumber = Number(metric.value)
      const delta = currentNumber - baselineNumber
      return {
        ...metric,
        delta: {
          direction: delta > 0 ? "up" : delta < 0 ? "down" : "flat",
          value: delta === 0 ? "No change" : `${delta > 0 ? "+" : ""}${delta}`,
        },
      }
    }),
    baseline: previous
      ? {
          checkpoint:
            scenario.checkpoints[previous.checkpointId]?.label ?? "Unavailable",
          label: "Previous completed Evaluation",
          completedAt: formatDemoTimestamp(previous.completedAt ?? previous.startedAt),
          metrics: evaluationMetrics(previous),
        }
      : {
          checkpoint: fixture.evaluation.baseline.checkpoint,
          label: "Fixture-authored baseline",
          completedAt: fixture.evaluation.baseline.completedAt,
          metrics: metrics.map(({ id, label, value }) => ({ id, label, value })),
        },
    decisions: decisions.map((decision) => ({
      id: decision.id,
      symbol: decision.symbol,
      outcome: decision.outcome,
      evidence: decision.evidence,
      ruleIds: decision.ruleIds,
    })),
    orderIds: [...evaluation.orderIds],
    ruleEvaluations: evaluation.ruleEvaluations.map((result) => ({ ...result })),
    sourceArtifactIds: [...evaluation.sourceArtifactIds],
    orders: evaluation.orderIds
      .map((id) => scenario.orders[id])
      .filter((order): order is NonNullable<typeof order> => Boolean(order))
      .map((order) => ({
        id: order.id,
        decisionId:
          order.provenance.kind === "manual-paper-intervention"
            ? order.id
            : order.provenance.decisionId,
        symbol: order.symbol,
        side: order.side,
        requestedQuantity: order.requestedQuantity,
        filledQuantity: order.filledQuantity,
        status: order.status,
        submittedAt: order.submittedAt,
      })),
    events: evaluation.eventIds
      .map((id) => scenario.evaluationEvents[id])
      .filter((event): event is NonNullable<typeof event> => Boolean(event))
      .sort((left, right) => left.sequence - right.sequence)
      .map((event) => ({
        id: event.id,
        phase: event.phase,
        status: event.status,
        message: event.message,
        occurredAt: event.occurredAt,
      })),
  }
}

function evaluationMetrics(evaluation: EvaluationRecord) {
  return [
    {
      id: "decisions",
      label: "Recorded decisions",
      value: String(evaluation.summary.decisions),
    },
    {
      id: "orders",
      label: "Submitted orders",
      value: String(evaluation.summary.submittedOrders),
    },
    {
      id: "near-misses",
      label: "Near misses",
      value: String(evaluation.summary.nearMisses),
    },
  ]
}

function projectPaperPortfolio(
  scenario: WorkspaceScenario,
  portfolio: PaperPortfolioRecord
): PaperLaunchSnapshot {
  const checkpoint = scenario.checkpoints[portfolio.sourceCheckpointId]
  const strategy = scenario.strategies[portfolio.strategyId]
  const generation = checkpoint?.generation ?? 1

  return {
    id: portfolio.id,
    label: portfolio.displayName,
    source: checkpoint
      ? `Draft V${generation} · Checkpoint ${checkpoint.label}`
      : "Source checkpoint unavailable",
    rules: strategy ? projectStrategyRules(strategy.strategy) : [],
    operationalState: portfolio.state,
  }
}

function projectPaperWorkspace(
  scenario: WorkspaceScenario,
  portfolioId: string,
  fallback: WorkspaceFixture["paper"],
  snapshot: PaperLaunchSnapshot
): PaperWorkspaceFixture | null {
  const portfolio = scenario.portfolios[portfolioId]
  if (!portfolio) return null
  const strategy = scenario.strategies[portfolio.strategyId]
  const checkpoint = scenario.checkpoints[portfolio.sourceCheckpointId]
  const schedule = scenario.schedules[portfolio.scheduleId]
  const benchmark = scenario.benchmarks[portfolio.benchmarkId]
  const account = scenario.accountSnapshots[portfolio.currentAccountSnapshotId]
  const runs = Object.values(scenario.runs)
    .filter((run) => run.portfolioId === portfolio.id)
    .sort((left, right) => left.sequence - right.sequence)
  const positions = Object.values(scenario.positions).filter(
    (position) =>
      position.portfolioId === portfolio.id &&
      position.accountSnapshotId === portfolio.currentAccountSnapshotId
  )
  const orders = Object.values(scenario.orders)
    .filter(
      (order) => order.portfolioId === portfolio.id
    )
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
  const openOrders = orders.filter((order) =>
    ["proposed", "submitted", "partially-filled"].includes(order.status)
  )
  const runFixtures = runs.map((run) => {
    const before = scenario.accountSnapshots[run.beforeAccountSnapshotId]
    const after = scenario.accountSnapshots[run.afterAccountSnapshotId]
    const decisions = run.decisionIds
      .map((id) => scenario.decisions[id])
      .filter((decision): decision is NonNullable<typeof decision> => Boolean(decision))
    return {
      id: run.id,
      label: `Run ${run.sequence}`,
      status: titleCase(run.status),
      completedAt: formatDemoTimestamp(run.completedAt),
      startedAt: formatDemoTimestamp(run.startedAt),
      duration: formatDuration(run.startedAt, run.completedAt),
      dataCutoff: formatDemoTimestamp(run.dataCutoff),
      decision: decisions.length
        ? `${decisions.filter((decision) => decision.outcome === "eligible").length} eligible · ${decisions.filter((decision) => decision.outcome === "rejected").length} rejected`
        : "No expanded decisions",
      evaluated: run.evaluatedUniverseCount,
      orders: run.orderIds.length,
      accountValue: after?.accountValue,
      buyingPower: after?.buyingPower,
      beforeAccountValue: before?.accountValue,
      beforeBuyingPower: before?.buyingPower,
      afterAccountValue: after?.accountValue,
      afterBuyingPower: after?.buyingPower,
      portfolioReference: before && after
        ? `${before.id} → ${after.id}`
        : "Unavailable",
      strategyReference: run.strategyId,
      scheduleReference: run.scheduleId,
      freshness: formatDemoTimestamp(run.dataCutoff),
      decisions: decisions.map((decision) => ({
        id: decision.id,
        label: `${decision.symbol} · ${titleCase(decision.outcome)}`,
        detail: decision.evidence,
      })),
      activity: [
        {
          id: `${run.id}-started`,
          time: formatDemoTimestamp(run.startedAt),
          title: "Run started",
          detail: `Bound ${run.strategyId}, ${run.scheduleId}, and ${run.benchmarkId}.`,
        },
        {
          id: `${run.id}-completed`,
          time: formatDemoTimestamp(run.completedAt),
          title: "Run completed",
          detail: `${decisions.length} decisions and ${run.orderIds.length} orders were recorded against immutable before/after account snapshots.`,
        },
      ],
    }
  })
  const equityHistory = runs.flatMap((run) => {
    const after = scenario.accountSnapshots[run.afterAccountSnapshotId]
    return after
      ? [
          {
            timestamp: run.completedAt,
            value: after.accountValue,
            quality: "confirmed" as const,
            runId: run.id,
            decisionIds: [...run.decisionIds],
          },
        ]
      : []
  })
  const benchmarkHistory = runs.map((run) => {
    const observation = scenario.benchmarkObservations[run.benchmarkObservationId]
    return {
      timestamp: run.completedAt,
      value: observation?.normalizedValue ?? null,
      quality: observation ? "confirmed" as const : "estimated" as const,
    }
  })
  const totalPnl = account
    ? account.realizedPnl +
      account.unrealizedPnl +
      account.income -
      account.fees
    : undefined
  const grossExposure = account?.accountValue
    ? account.grossExposureValue / account.accountValue
    : 0
  const performanceModel = createPaperPerformanceModel({
    portfolio,
    benchmark,
    runs,
    scenario,
  })
  const drawdownModel = createPaperDrawdownModel({
    portfolio,
    runs,
    scenario,
  })

  return {
    ...fallback,
    label: portfolio.displayName,
    status: paperOperationalLabel(snapshot.operationalState),
    operationalState: snapshot.operationalState,
    strategy: strategy?.label ?? "Unavailable",
    source: checkpoint
      ? `Draft V${checkpoint.generation} · Checkpoint ${checkpoint.label}`
      : "Unavailable",
    portfolioValue: account?.accountValue ?? portfolio.simulatedCapital,
    totalReturn: account?.cumulativeTimeWeightedReturn ?? 0,
    dailyPnl: account?.dailyPnlExFlows ?? 0,
    buyingPower: account?.buyingPower ?? 0,
    exposure: grossExposure,
    maxDrawdown: computeMaxDrawdown(equityHistory.map((point) => point.value)),
    positions: positions.length,
    openOrders: openOrders.length,
    nextRun: schedule?.nextRunAt ? formatDemoTimestamp(schedule.nextRunAt) : "Unavailable",
    runCadence: schedule ? describeScheduleDefinition(schedule.definition) : "Unavailable",
    freshness: account ? `Portfolio as of ${formatDemoTimestamp(account.asOf)}` : "Unavailable",
    currency: account?.currency ?? "USD",
    timeZone: schedule?.definition.timezone ?? "America/New_York",
    account: account
      ? {
          accountValue: account.accountValue,
          cash: account.cash,
          reservedCash: account.reservedCash,
          buyingPower: account.buyingPower,
          positionsMarketValue: account.positionsMarketValue,
          deployedValue: account.positionsMarketValue,
          grossExposure,
          totalPnl,
          realizedPnl: account.realizedPnl,
          unrealizedPnl: account.unrealizedPnl,
          income: account.income,
          fees: account.fees,
          dailyPnl: account.dailyPnlExFlows,
          totalReturn: account.cumulativeTimeWeightedReturn,
          timeWeightedReturn: account.cumulativeTimeWeightedReturn,
        }
      : undefined,
    equityHistory,
    benchmark: benchmark
      ? {
          symbol: benchmark.symbol,
          label: benchmark.displayName,
          methodology: benchmark.methodology,
          history: benchmarkHistory,
        }
      : undefined,
    performanceModel,
    drawdownModel,
    runs: runFixtures,
    positionRows: positions.map((position) => ({
      id: position.id,
      symbol: position.symbol,
      name: position.displayName,
      quantity: position.quantity,
      averageCost: position.averageCost,
      markPrice: position.markPrice,
      marketValue: position.marketValue,
      weight: position.weight,
      unrealizedPnl: position.unrealizedPnl,
      unrealizedReturn:
        position.averageCost > 0
          ? (position.markPrice - position.averageCost) / position.averageCost
          : undefined,
      dailyPnl: position.dailyPnl,
      provenance: {
        source: position.accountSnapshotId,
        recordedAt: account?.asOf,
        runId: account?.sourceRunId,
      },
    })),
    orderRows: orders.map((order) => ({
      id: order.id,
      symbol: order.symbol,
      side: order.side,
      orderType: order.orderType,
      quantity: order.requestedQuantity,
      filledQuantity: order.filledQuantity,
      averageFillPrice: order.averageFillPrice,
      limitPrice: order.orderType === "limit" ? order.requestedPrice : undefined,
      stopPrice: order.orderType === "stop" ? order.requestedPrice : undefined,
      timeInForce: order.timeInForce,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.lastUpdatedAt,
      provenance: {
        source: order.id,
        recordedAt: order.lastUpdatedAt,
        runId:
          order.provenance.kind === "portfolio-run"
            ? order.provenance.runId
            : undefined,
        decisionId:
          order.provenance.kind === "manual-paper-intervention"
            ? undefined
            : order.provenance.decisionId,
      },
    })),
    strategyRules: strategy?.strategy.sections.flatMap((section) =>
      section.rules.map((rule) => ({
        label: section.title,
        value: `${rule.value} · ${rule.constraint ?? "No additional constraint"}`,
      }))
    ),
  }
}

function createPaperPerformanceModel({
  portfolio,
  benchmark,
  runs,
  scenario,
}: {
  portfolio: WorkspaceScenario["portfolios"][string]
  benchmark?: WorkspaceScenario["benchmarks"][string]
  runs: WorkspaceScenario["runs"][string][]
  scenario: WorkspaceScenario
}): PaperWorkspaceFixture["performanceModel"] {
  const observations = runs.flatMap((run) => {
    const after = scenario.accountSnapshots[run.afterAccountSnapshotId]
    return after ? [{ run, after }] : []
  })
  if (!observations.length) return undefined
  const firstValue = portfolio.simulatedCapital
  const first = observations[0]
  const last = observations.at(-1) ?? first
  const benchmarkValues = observations.map(({ run }) =>
    scenario.benchmarkObservations[run.benchmarkObservationId]?.normalizedValue ?? null
  )
  const firstBenchmark = benchmarkValues.find((value): value is number => value !== null)

  return {
    identity: {
      id: `${portfolio.id}-performance`,
      title: benchmark ? `Time-weighted performance vs ${benchmark.symbol}` : "Time-weighted performance",
      metric: "Cumulative return",
      entity: portfolio.displayName,
      unit: { kind: "percent", fractionDigits: 2 },
    },
    range: {
      id: "completed-runs",
      label: "Completed runs since launch",
      start: first.run.completedAt,
      end: last.run.completedAt,
      timeZone: "America/New_York",
    },
    freshness: { state: "current", cutoff: last.run.dataCutoff },
    status: { state: "ready", message: `${observations.length} completed runs` },
    cadence: {
      kind: "completed-run",
      label: "Completed-run observations",
      disclosure: "No values are inferred between completed scheduled runs.",
    },
    series: {
      id: `${portfolio.id}-twr`,
      label: portfolio.displayName,
      points: observations.map(({ run, after }) => ({
        timestamp: run.completedAt,
        value: after.accountValue / firstValue - 1,
        quality: "confirmed" as const,
        reference: { kind: "run" as const, id: run.id, label: `Run ${run.sequence}` },
        decisionReferences: run.decisionIds.map((id) => ({
          kind: "decision" as const,
          id,
          label: scenario.decisions[id]?.symbol ?? id,
        })),
      })),
    },
    benchmark:
      benchmark && firstBenchmark
        ? {
            id: `${portfolio.id}-${benchmark.id}`,
            symbol: benchmark.symbol,
            label: benchmark.displayName,
            methodology: benchmark.methodology,
            points: observations.map(({ run }, index) => ({
              timestamp: run.completedAt,
              value:
                benchmarkValues[index] === null
                  ? null
                  : benchmarkValues[index]! / firstBenchmark - 1,
              quality: benchmarkValues[index] === null ? "missing" as const : "confirmed" as const,
            })),
          }
        : undefined,
  }
}

function createPaperDrawdownModel({
  portfolio,
  runs,
  scenario,
}: {
  portfolio: WorkspaceScenario["portfolios"][string]
  runs: WorkspaceScenario["runs"][string][]
  scenario: WorkspaceScenario
}): PaperWorkspaceFixture["drawdownModel"] {
  const observations = runs.flatMap((run) => {
    const after = scenario.accountSnapshots[run.afterAccountSnapshotId]
    return after ? [{ run, value: after.accountValue }] : []
  })
  if (!observations.length) return undefined
  let peak = portfolio.simulatedCapital
  const points = observations.map(({ run, value }) => {
    peak = Math.max(peak, value)
    return {
      timestamp: run.completedAt,
      value: value / peak - 1,
      quality: "confirmed" as const,
      reference: { kind: "run" as const, id: run.id, label: `Run ${run.sequence}` },
    }
  })
  const first = observations[0].run
  const last = observations.at(-1)?.run ?? first
  return {
    identity: {
      id: `${portfolio.id}-drawdown`,
      title: "Drawdown by completed run",
      metric: "Drawdown from prior peak",
      entity: portfolio.displayName,
      unit: { kind: "percent", fractionDigits: 2 },
    },
    range: {
      id: "completed-runs",
      label: "Completed runs since launch",
      start: first.completedAt,
      end: last.completedAt,
      timeZone: "America/New_York",
    },
    freshness: { state: "current", cutoff: last.dataCutoff },
    status: { state: "ready", message: `${points.length} completed runs` },
    points,
  }
}

function computeMaxDrawdown(values: number[]) {
  let peak = values[0] ?? 0
  let drawdown = 0
  for (const value of values) {
    peak = Math.max(peak, value)
    if (peak > 0) drawdown = Math.min(drawdown, value / peak - 1)
  }
  return drawdown
}

function describeScheduleDefinition(schedule: StructuredStrategy["schedule"]) {
  return schedule.cadence === "weekly"
    ? `Weekly · weekday ${schedule.weekday} · ${schedule.localTime} ${schedule.timezone}`
    : `Monthly · first business day · ${schedule.localTime} ${schedule.timezone}`
}

function projectStrategyRules(strategy: StructuredStrategy): StrategyRuleFixture[] {
  return strategy.sections.flatMap((section) =>
    section.rules.map((rule) => ({
      id: rule.id,
      group: section.title,
      name: rule.label,
      value: rule.value,
      constraint: rule.constraint ?? "No additional constraint",
      rationale: rule.rationale,
      dataRequirementIds: rule.dataRequirementIds,
    }))
  )
}

function describeSchedule(strategy: StructuredStrategy) {
  return strategy.schedule.cadence === "weekly"
    ? `Weekly on weekday ${strategy.schedule.weekday} at ${strategy.schedule.localTime}`
    : `First business day monthly at ${strategy.schedule.localTime}`
}

function formatDemoTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "short",
  }).format(new Date(value))
}

function formatClockTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(value))
}

function formatDuration(startedAt: string, completedAt: string) {
  const elapsed = Math.max(0, Date.parse(completedAt) - Date.parse(startedAt))
  return `${Math.round(elapsed / 1000)}s`
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)
}

function createChampionSession(
  fixture: WorkspaceFixture
): ChampionSessionState {
  const initialPaper = fixture.initialPaper === true

  return {
    evaluations: [],
    draftState: {
      checkpoint: initialPaper ? "V2.0" : fixture.draft.checkpoint,
      rules: fixture.draft.rules.map((rule) => ({ ...rule })),
    },
    paperPortfolios: initialPaper
      ? [
          {
            id: `${fixture.champion.id}-paper-1`,
            label: `${fixture.draft.title} · Paper 1`,
            source: fixture.paper.source,
            rules: fixture.draft.rules.map((rule) => ({ ...rule })),
            operationalState: "active",
          },
        ]
      : [],
    paperLifecycleOperation: null,
    paperLifecycleReview: null,
    draftSelection: {
      surface: "summary",
      ruleId: fixture.draft.rules[0]?.id ?? "",
      decision: null,
      dryRunId: null,
      dryRunTab: "summary",
    },
    paperSelection: {
      detailsTab: "runs",
      panelExpanded: false,
      runTab: "summary",
      reference: null,
    },
    launchReviewOpen: false,
    conversation: {
      context: null,
      focusRequest: 0,
      exchanges: [],
    },
    authorityOperation: null,
    authorityError: null,
  }
}

function getWorkspaceFixture(championId: string): WorkspaceFixture {
  const fixture = findWorkspaceFixture(championId)

  if (!fixture) throw new Error(`Unknown Champion workspace: ${championId}`)
  return fixture
}

function findWorkspaceFixture(championId: string): WorkspaceFixture | undefined {
  return workspaceFixtures.find((candidate) => candidate.champion.id === championId)
}

function findScenarioChampion(scenario: WorkspaceScenario, championSlug: string) {
  const fixture = findWorkspaceFixture(championSlug)
  if (!fixture) return undefined
  return Object.values(scenario.champions).find(
    (candidate) => candidate.displayName.toLowerCase() === fixture.champion.name.toLowerCase()
  )
}

function contextFromRoute(route: WorkspaceRoute): WorkspaceContext {
  if (route.kind === "live") return "live"
  if (
    route.kind === "paper-index" ||
    route.kind === "paper-portfolio" ||
    route.kind === "paper-run" ||
    route.kind === "paper-compare" ||
    route.kind === "paper-archived"
  ) {
    return "paper"
  }
  return "draft"
}

function draftLabelFromCheckpoint(checkpoint: string) {
  const match = /^V(\d+)\.\d+$/.exec(checkpoint)
  return match ? `Draft V${match[1]}` : "Draft"
}

function paperOperationalLabel(state: PaperLaunchSnapshot["operationalState"]) {
  return state === "active"
    ? "Running"
    : `${state.charAt(0).toUpperCase()}${state.slice(1)}`
}

function UnavailableChampionWorkspace({ championId }: { championId: string }) {
  return (
    <SidebarProvider
      className="h-svh min-h-[36rem] overflow-hidden"
      style={{ "--sidebar-width": "14rem" } as CSSProperties}
    >
      <Sidebar collapsible="offcanvas" role="navigation" aria-label="Champion workspace navigation">
        <SidebarHeader>
          <span className="px-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em]">
            Vantheon
          </span>
        </SidebarHeader>
        <SidebarContent />
      </Sidebar>
      <SidebarInset className="h-svh min-h-0 overflow-hidden">
        <div className="flex h-12 items-center gap-3 border-b px-3">
          <SidebarTrigger />
          <span className="text-sm font-medium">Champion unavailable</span>
        </div>
        <div className="grid min-h-0 flex-1 place-items-center p-6">
          <div className="max-w-md rounded-lg border p-6 text-center">
            <h1 className="text-lg font-semibold">Champion unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {championId
                ? `The Champion “${championId}” does not exist in this demo or is unavailable.`
                : "This Champion route is incomplete or unavailable."}
            </p>
            <Link
              href={"/champions/mara/draft" as Route}
              className={buttonVariants({ className: "mt-4" })}
            >
              Open the demo workspace
            </Link>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function PaperCollectionWorkspace({
  title,
  portfolios,
  archived = false,
  archivedCount,
  onOpen,
  onCompare,
  onOpenArchived,
}: {
  title: string
  portfolios: readonly PaperLaunchSnapshot[]
  archived?: boolean
  archivedCount: number
  onOpen: (portfolioId: string) => void
  onCompare: (portfolioIds: string[]) => void
  onOpenArchived: () => void
}) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const visiblePortfolios = normalizedQuery
    ? portfolios.filter(
        (portfolio) =>
          portfolio.label.toLowerCase().includes(normalizedQuery) ||
          portfolio.source.toLowerCase().includes(normalizedQuery)
      )
    : portfolios
  const comparisonIds = visiblePortfolios.slice(0, 2).map((portfolio) => portfolio.id)

  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label={title}>
      <WorkspacePageHeader
        title={title}
        details={
          archived
            ? "Stopped portfolios retained for inspection and descriptive comparison."
            : "Independent simulated portfolios pinned to immutable strategies."
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={comparisonIds.length < 2}
              onClick={() => onCompare(comparisonIds)}
            >
              Compare two
            </Button>
            {!archived ? (
              <Button type="button" variant="outline" onClick={onOpenArchived}>
                Archived ({archivedCount})
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mt-4 max-w-sm">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label={`Search ${title}`}
          placeholder="Search portfolios"
        />
      </div>

      {visiblePortfolios.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {visiblePortfolios.map((portfolio) => (
            <button
              key={portfolio.id}
              type="button"
              onClick={() => onOpen(portfolio.id)}
              className="rounded-lg border p-4 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium">{portfolio.label}</span>
                <span className="rounded-full border px-2 py-0.5 text-xs">
                  {paperOperationalLabel(portfolio.operationalState)}
                </span>
              </span>
              <span className="mt-2 block text-sm text-muted-foreground">
                {formatVersionReference(portfolio.source)}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">No matching Paper portfolios</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {portfolios.length
              ? "Clear the search to inspect retained evidence."
              : archived
                ? "No portfolios have been archived."
                : "Launch a tested Draft to create the first portfolio."}
          </p>
        </div>
      )}
    </section>
  )
}

function PaperComparisonWorkspace({
  portfolios,
  paper,
  onOpen,
  onBack,
}: {
  portfolios: readonly PaperLaunchSnapshot[]
  paper: WorkspaceFixture["paper"]
  onOpen: (portfolioId: string) => void
  onBack: () => void
}) {
  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label="Paper comparison">
      <WorkspacePageHeader
        title="Paper comparison"
        badges={[{ label: "Insufficient comparable evidence" }]}
        details="Descriptive only · comparison validity policy is pending. No portfolio is ranked or declared a winner."
        action={
          <Button type="button" variant="outline" onClick={onBack}>
            Back to Paper
          </Button>
        }
      />
      {portfolios.length === 2 ? (
        <div className="mt-4 overflow-hidden rounded-lg border">
          <div className="grid grid-cols-[12rem_repeat(2,minmax(0,1fr))] border-b bg-muted/40 text-sm font-medium">
            <span className="p-3">Evidence envelope</span>
            {portfolios.map((portfolio) => (
              <button
                key={portfolio.id}
                type="button"
                className="border-l p-3 text-left hover:underline"
                onClick={() => onOpen(portfolio.id)}
              >
                {portfolio.label}
              </button>
            ))}
          </div>
          <ComparisonRow label="Source" values={portfolios.map((item) => formatVersionReference(item.source))} />
          <ComparisonRow label="Schedule" values={portfolios.map(() => paper.runCadence)} />
          <ComparisonRow label="Completed runs" values={portfolios.map(() => String(paper.runs?.length ?? 0))} />
          <ComparisonRow label="Observation window" values={portfolios.map(() => "Completed runs since launch")} />
          <ComparisonRow label="Data quality" values={portfolios.map(() => "Confirmed demo evidence")} />
          <ComparisonRow label="Capital assumptions" values={portfolios.map(() => "$100,000 simulated · no external flows")} />
          <ComparisonRow label="Activity" values={portfolios.map(() => "Trades and no-trade runs disclosed")} />
          <ComparisonRow
            label="Strategy differences"
            values={portfolios.map(
              (portfolio) =>
                `${formatVersionReference(portfolio.source)} · ${portfolio.rules.length} frozen rules`
            )}
          />
          <ComparisonRow label="Result" values={portfolios.map(() => "Descriptive only")} />
        </div>
      ) : (
        <div className="mt-4 rounded-lg border border-dashed p-6 text-center">
          <p className="text-sm font-medium">Select exactly two Paper portfolios</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Launch another tested Draft before comparing independent evidence.
          </p>
        </div>
      )}
    </section>
  )
}

function ComparisonRow({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div className="grid grid-cols-[12rem_repeat(2,minmax(0,1fr))] border-b text-sm last:border-b-0">
      <span className="p-3 text-muted-foreground">{label}</span>
      {values.map((value, index) => (
        <span key={`${label}-${index}`} className="border-l p-3">
          {value}
        </span>
      ))}
    </div>
  )
}

function UnavailablePaperResource({ onBack }: { onBack: () => void }) {
  return (
    <section className="grid h-full place-items-center p-6">
      <div className="max-w-md rounded-lg border p-6 text-center">
        <h1 className="text-lg font-semibold">Paper resource unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This portfolio or run does not exist for the selected Champion.
        </p>
        <Button type="button" className="mt-4" onClick={onBack}>
          Open Paper portfolios
        </Button>
      </div>
    </section>
  )
}

function requireScenarioContext(
  scenario: WorkspaceScenario | undefined,
  championSlug: string
) {
  if (!scenario) throw new Error("The local demo authority is still loading.")
  const fixture = getWorkspaceFixture(championSlug)
  const champion = Object.values(scenario.champions).find(
    (candidate) => candidate.displayName.toLowerCase() === fixture.champion.name.toLowerCase()
  )
  if (!champion) throw new Error("The selected Champion is unavailable.")
  const draft = scenario.drafts[champion.currentDraftId]
  if (!draft) throw new Error("The current Draft is unavailable.")
  const checkpoint = scenario.checkpoints[draft.currentCheckpointId]
  if (!checkpoint) throw new Error("The current checkpoint is unavailable.")
  return { scenario, champion, draft, checkpoint }
}

function commandEnvelope<TType extends WorkspaceCommandType>(
  type: TType,
  championId: EntityId<"champion">
) {
  const nonce = globalThis.crypto.randomUUID()
  const submittedAt = isoTimestamp(new Date().toISOString())
  return {
    type,
    championId,
    commandId: entityId("command", `command_${nonce}`),
    idempotencyKey: idempotencyKey(`${type}:${nonce}`),
    actor: entityReference("user", WORKSPACE_DEMO_IDS.user),
    submittedAt,
  }
}

function requireAppliedResult<TKind extends WorkspaceCommandResult["kind"]>(
  receipt: WorkspaceCommandReceipt,
  kind: TKind
): Extract<WorkspaceCommandResult, { kind: TKind }> {
  if (receipt.outcome !== "applied" || !receipt.result) {
    throw new Error(receipt.failure?.message ?? "The authority rejected the command.")
  }
  if (receipt.result.kind !== kind) {
    throw new Error(`The authority returned ${receipt.result.kind}; expected ${kind}.`)
  }
  return receipt.result as Extract<WorkspaceCommandResult, { kind: TKind }>
}

function atlasResponseForContext(context: string, mutationTarget: string) {
  const normalized = context.toLowerCase()

  if (normalized.includes("run")) {
    return [
      {
        kind: "text" as const,
        text: `I’m reading this run as evidence. If you ask for a strategy change, I’ll prepare it against ${mutationTarget}; the completed run remains immutable.`,
      },
      {
        kind: "question" as const,
        prompt: "What should I do with this evidence?",
        options: ["Explain the decision", "Compare with Draft", "Propose a change"],
      },
    ]
  }
  if (normalized.includes("paper")) {
    return [
      {
        kind: "text" as const,
        text: `I’ll analyze the selected Paper evidence here. Any change I propose will be reviewed in ${mutationTarget}, not applied to the running portfolio.`,
      },
      {
        kind: "question" as const,
        prompt: "Which evidence should we inspect?",
        options: ["Latest run", "Performance vs SPY", "Risk and drawdown"],
      },
    ]
  }
  if (normalized.includes("live")) {
    return [
      {
        kind: "text" as const,
        text: "I’ll treat this as a Live-safety question. I can explain or prepare a proposal, but no capital control changes without an explicit reviewed deployment.",
      },
      {
        kind: "question" as const,
        prompt: "What do you want to review first?",
        options: ["Risk limits", "Capital impact", "Deployment readiness"],
      },
    ]
  }

  return [
    {
      kind: "text" as const,
      text: `I’ll use this as strategy intent and prepare structured changes in ${mutationTarget}. You’ll see and test the artifact before anything is promoted.`,
    },
    {
      kind: "question" as const,
      prompt: "What should I optimize first?",
      options: ["Lower drawdown", "Higher return", "Fewer trades"],
    },
  ]
}

function parseSemanticRuleIntent(request: string) {
  const normalized = request.trim()
  const match = /^(?:please\s+)?(?:change|set|update|make)\b[\s\S]*?\b(?:to|as)\s+(.+)$/i.exec(
    normalized
  )
  const proposed = match?.[1]?.trim().replace(/[.!?]+$/, "")
  return proposed && proposed.length >= 2 ? proposed : null
}

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function EvaluationPreflightDialog({
  open,
  onOpenChange,
  checkpoint,
  evaluationTemplate,
  benchmark,
  pending,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  checkpoint?: DraftCheckpointRecord
  evaluationTemplate?: EvaluationRecord
  benchmark?: string
  pending: boolean
  onConfirm: () => void
}) {
  const setup = evaluationTemplate?.setup

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Locked Evaluation preflight</DialogTitle>
          <DialogDescription>
            This run reads the exact checkpoint and declared inputs. It does not
            mutate the Draft or submit Paper orders.
          </DialogDescription>
        </DialogHeader>
        <div className="grid overflow-hidden rounded-lg border text-sm sm:grid-cols-2">
          {[
            ["Checkpoint", checkpoint?.label ?? "Unavailable"],
            ["Content hash", checkpoint?.strategyHash ?? "Unavailable"],
            ["Universe", setup?.source.dataset ?? "Unavailable"],
            ["Benchmark", benchmark ?? "Unavailable"],
            [
              "Window",
              setup ? `${setup.window.start} – ${setup.window.end}` : "Unavailable",
            ],
            ["Capital", setup ? formatMoney(setup.startingCapital) : "Unavailable"],
            [
              "Costs / fills",
              setup
                ? `${setup.transactionCostBps} bps · ${setup.fillModel}`
                : "Unavailable",
            ],
            [
              "Schedule / timezone",
              checkpoint && setup
                ? `${describeSchedule(checkpoint.strategy)} · ${setup.timezone}`
                : "Unavailable",
            ],
            ["Data cutoff", setup ? formatDemoTimestamp(setup.dataCutoff) : "Unavailable"],
            ["Limitations", "Deterministic demo · no real capital or submitted orders"],
          ].map(([label, value]) => (
            <div key={label} className="border-b p-3 odd:sm:border-r">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {label}
              </p>
              <p className={label === "Content hash" ? "mt-1 break-all font-mono text-xs" : "mt-1"}>
                {value}
              </p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" disabled={pending} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={!checkpoint || !setup || pending} onClick={onConfirm}>
            {pending ? "Running…" : "Run Evaluation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaperLaunchDialog({
  open,
  onOpenChange,
  onConfirm,
  source,
  evaluationId,
  benchmark,
  capital,
  schedule,
  pending,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  source: string
  evaluationId: string
  benchmark: string
  capital: string
  schedule: string
  pending: boolean
  error: string | null
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Launch Paper</DialogTitle>
          <DialogDescription>Simulated capital only. Live remains unchanged.</DialogDescription>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border text-sm">
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Source</span>
            <span className="flex items-center gap-1.5 px-3 py-2 font-medium">
              <LockKeyhole aria-hidden="true" className="size-3.5" />
              {source}
            </span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Evaluation</span>
            <span className="break-all px-3 py-2 font-mono text-xs">{evaluationId}</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Portfolio</span>
            <span className="px-3 py-2 font-medium">{capital}</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Schedule</span>
            <span className="px-3 py-2 font-medium">{schedule}</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Benchmark</span>
            <span className="px-3 py-2 font-medium">{benchmark}</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr]">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Result</span>
            <span className="px-3 py-2 font-medium">
              Paper runs Strategy V1 · Drafting V2 starts separately
            </span>
          </div>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={onConfirm}>
            {pending ? "Launching Paper…" : "Confirm Paper launch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaperLifecycleDialog({
  review,
  onOpenChange,
  onConfirm,
}: {
  review: { action: PaperLifecycleAction; label: string } | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const actionLabel = review ? titleCase(review.action) : "Update"
  const description =
    review?.action === "stop"
      ? "Future scheduled runs will stop. Existing strategy, runs, decisions, and evidence remain available."
      : review?.action === "archive"
        ? "This stopped portfolio moves to Archived Paper and remains inspectable and available for descriptive comparison."
        : "This portfolio returns to Stopped. It will not resume scheduled runs automatically."

  return (
    <Dialog open={review !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionLabel} Paper portfolio?</DialogTitle>
          <DialogDescription>{review?.label ?? "Paper portfolio"}</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant={review?.action === "stop" ? "destructive" : "default"}
            onClick={onConfirm}
          >
            Confirm {review?.action ?? "update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function authorityErrorMessage(error: unknown) {
  if (error instanceof WorkspaceAuthorityError || error instanceof Error) {
    return error.message
  }
  return "The demo authority could not confirm this operation. Try again."
}

function waitForDemoTransition() {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, 160)
  })
}
