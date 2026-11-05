"use client"

import type { Route } from "next"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react"
import {
  Archive,
  ArrowRight,
  CircleUserRound,
  LayoutGrid,
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
  useSidebar,
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

type DemoStrategyNavigationEntry = {
  id: string
  title: string
  version: number
  status: string
  href: string
  draftHref: string
  paperHref?: string
  kind: "draft" | "paper"
}

function DesktopSidebarReopenTrigger() {
  const { open } = useSidebar()

  if (open) return null

  return (
    <SidebarTrigger
      className="hidden shrink-0 md:inline-flex"
      aria-label="Open sidebar"
      title="Open sidebar"
    />
  )
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
    tab: WorkspaceEvidenceTab | null
    expanded: boolean
  }>({ tab: null, expanded: false })
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

  useEffect(() => {
    if (route.kind === "paper-compare") {
      router.replace(paperIndexHref(route.championId) as Route)
    }
  }, [route, router])

  const championId = route.championId
  const scenarioChampion = demo.scenario
    ? findScenarioChampion(demo.scenario, championId)
    : undefined
  const scenarioDraft = scenarioChampion
    ? demo.scenario?.drafts[scenarioChampion.currentDraftId]
    : undefined
  const scenarioCurrentCheckpoint = scenarioDraft
    ? demo.scenario?.checkpoints[scenarioDraft.currentCheckpointId]
    : undefined
  const requestedWorkspaceFixture = findWorkspaceFixture(championId)
  const workspaceFixture: WorkspaceFixture =
    requestedWorkspaceFixture ?? workspaceFixtures[0]
  const requestedSession = runtime.sessions[championId]
  const session = requestedSession ?? runtime.sessions[workspaceFixture.champion.id]

  const {
    evaluations: sessionEvaluations,
    draftState,
    paperPortfolios: sessionPaperPortfolios,
    paperLifecycleOperation,
    paperLifecycleReview,
    draftSelection,
    paperSelection,
    launchReviewOpen,
    conversation,
    authorityOperation,
    authorityError,
  } = session
  const strategyEntries = useMemo<DemoStrategyNavigationEntry[]>(() => {
    if (!demo.scenario || !scenarioChampion) {
      return [{
        id: `${championId}-draft`,
        title: workspaceFixture.draft.title,
        version: 1,
        status: "Draft",
        href: draftHref(championId),
        draftHref: draftHref(championId),
        kind: "draft",
      }]
    }
    const scenario = demo.scenario
    const currentDraft = scenario.drafts[scenarioChampion.currentDraftId]
    const currentCheckpoint = currentDraft
      ? scenario.checkpoints[currentDraft.currentCheckpointId]
      : undefined
    const draftEntry: DemoStrategyNavigationEntry[] = currentDraft && currentCheckpoint
      ? [{
          id: currentDraft.id,
          title: currentCheckpoint.strategy.title,
          version: currentDraft.generation,
          status: `Draft · Checkpoint ${currentCheckpoint.ordinal}`,
          href: draftHref(championId),
          draftHref: draftHref(championId),
          kind: "draft",
        }]
      : []
    const paperEntries = Object.values(scenario.strategies)
      .filter((strategy) => strategy.championId === scenarioChampion.id)
      .sort((left, right) => right.version - left.version)
      .flatMap((strategy) => {
        const portfolio = Object.values(scenario.portfolios).find(
          (candidate) => candidate.strategyId === strategy.id
        )
        if (!portfolio) return []
        return [{
          id: strategy.id,
          title: strategy.strategy.title,
          version: strategy.version,
          status: paperSidebarStatus(scenario, portfolio),
          href: paperPortfolioHref(championId, portfolio.id),
          draftHref: checkpointHref(championId, strategy.sourceCheckpointId),
          paperHref: paperPortfolioHref(championId, portfolio.id),
          kind: "paper" as const,
        }]
      })
    return [...draftEntry, ...paperEntries]
  }, [championId, demo.scenario, scenarioChampion, workspaceFixture.draft.title])
  const selectedStrategyId =
    route.kind === "paper-portfolio" || route.kind === "paper-run"
      ? demo.scenario?.portfolios[route.portfolioId]?.strategyId
      : route.kind === "draft-checkpoint"
        ? Object.values(demo.scenario?.strategies ?? {}).find(
            (strategy) => strategy.sourceCheckpointId === route.checkpointId
          )?.id
      : scenarioChampion?.currentDraftId
  const selectedStrategy =
    strategyEntries.find((entry) => entry.id === selectedStrategyId) ??
    strategyEntries[0]
  const evaluations = sessionEvaluations
  const paperPortfolios = sessionPaperPortfolios
  const activeContext = contextFromRoute(route)
  const checkpoint = draftState.checkpoint
  const paperLaunched = paperPortfolios.length > 0
  const draftLabel = formatDraftLabel(draftLabelFromCheckpoint(checkpoint))
  const checkpointLabel = formatCheckpointLabel(checkpoint)
  const draftReadOnly = scenarioChampion && demo.scenario
    ? demo.scenario.drafts[scenarioChampion.currentDraftId]?.status !== "active"
    : false
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

  useEffect(() => {
    if (route.kind !== "paper-index") return
    const available = paperPortfolios.filter(
      (portfolio) => portfolio.operationalState !== "archived"
    )
    if (available.length === 1) {
      router.replace(
        paperPortfolioHref(route.championId, available[0].id) as Route
      )
    }
  }, [paperPortfolios, route, router])

  useEffect(() => {
    if (
      route.kind === "draft-checkpoint" &&
      route.checkpointId === scenarioCurrentCheckpoint?.id
    ) {
      router.replace(draftHref(route.championId) as Route)
    }
  }, [route, router, scenarioCurrentCheckpoint?.id])

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

  const draftView = {
    ...workspaceFixture.draft,
    title: scenarioCurrentCheckpoint?.strategy.title ?? workspaceFixture.draft.title,
    label: draftLabel,
    checkpoint,
    rules: draftState.rules,
  }

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

  const routedChangeSet =
    route.kind === "draft-change" && scenarioChampion
      ? demo.scenario?.changeSets[route.changeSetId]
      : undefined
  const validRoutedChangeSet =
    routedChangeSet?.championId === scenarioChampion?.id ? routedChangeSet : undefined
  const routedChangeSetBase = validRoutedChangeSet
    ? demo.scenario?.checkpoints[validRoutedChangeSet.baseCheckpointId]
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
        .filter(
          (candidate) =>
            candidate.championId === scenarioChampion.id &&
            candidate.generation === selectedStrategy.version
        )
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
  const evidenceTab: WorkspaceEvidenceTab | null =
    route.panel ?? bottomPanel.tab
  const evidenceExpanded =
    route.kind !== "data" &&
    (route.panel !== undefined || bottomPanel.expanded)
  const selectedPaperLifecycleOperation =
    paperLifecycleOperation && paperLifecycleOperation.portfolioId === paperSnapshot?.id
      ? paperLifecycleOperation.action
      : null

  const defaultViewedContext =
    activeContext === "draft"
      ? route.kind === "data"
        ? "Drafting · Datasets"
        : selectedDryRun
        ? `Evaluation · ${selectedDryRun.label} · ${titleCase(dryRunTab)}`
        : `Drafting · ${titleCase(draftSurface)}`
      : activeContext === "paper"
        ? paperLaunched
          ? selectedPaperRun
            ? `Paper · ${selectedPaperRun.label} · ${titleCase(paperRunTab)}`
            : `Paper · ${titleCase(paperDetailsTab)}`
          : "Paper · Readiness"
        : "Live · Readiness"
  const viewedContext = defaultViewedContext
  const attachedContext = conversation.context
  const workspaceActivity = [
    ...[...conversation.exchanges].reverse().map((exchange) => ({
      id: `atlas-${exchange.id}`,
      title: "Atlas request sent",
      detail: `${exchange.request} · ${exchange.viewedContext}`,
    })),
    ...[...evaluations].reverse().map((evaluation) => ({
      id: `evaluation-${evaluation.id}`,
      title: `${evaluation.label} completed`,
      detail: `${formatCheckpointLabel(evaluation.checkpoint)} · ${evaluation.completedAt}`,
    })),
  ].slice(0, 12)

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
    setBottomPanel({ tab: null, expanded: false })
    setEvaluationReviewOpen(false)
    setResetReviewOpen(false)
    setProfileOpen(false)
    navigate(nextHref)
  }

  function selectStrategy(strategy: DemoStrategyNavigationEntry) {
    setBottomPanel({ tab: null, expanded: false })
    navigate(strategy.href)
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
        ? selectedStrategy.draftHref
        : context === "paper"
          ? selectedStrategy.paperHref ?? paperIndexHref(sourceChampionId)
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

  async function confirmPaperLaunch(simulatedCapital: number) {
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
          simulatedCapital,
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
      setBottomPanel({ tab: null, expanded: false })
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

  function returnToDraftRuns() {
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
    setBottomPanel({ tab: "dry-runs", expanded: true })
    navigate(`${draftHref(championId)}?panel=dry-runs`)
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
      (action === "archive" &&
        (sourcePortfolio.state === "active" || sourcePortfolio.state === "stopped")) ||
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
      className="h-svh overflow-hidden"
      style={{ "--sidebar-width": "17rem" } as CSSProperties}
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
          <div className="flex items-start justify-between">
            <span className="px-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em]">
              Vantheon
            </span>
            <SidebarTrigger className="max-md:hidden" />
          </div>
          <Select
            value={championId}
            onValueChange={(value) => value && selectChampion(value)}
          >
            <SelectTrigger className="w-full" aria-label="Champion workspace">
              <SelectValue>{workspaceFixture.champion.name}</SelectValue>
            </SelectTrigger>
            <SelectContent align="start">
              {workspaceFixtures.map((fixture) => (
                <SelectItem
                  key={fixture.champion.id}
                  value={fixture.champion.id}
                  onClick={() => selectChampion(fixture.champion.id)}
                >
                  {fixture.champion.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => navigate("/champions")}>
                    <LayoutGrid />
                    <span>All Champions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

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
                {strategyEntries.map((strategy) => (
                  <SidebarMenuItem key={strategy.id}>
                    <SidebarMenuButton
                      size="lg"
                      isActive={
                        strategy.id === selectedStrategy.id &&
                        activeContext !== "live" &&
                        route.kind !== "paper-archived"
                      }
                      onClick={() => selectStrategy(strategy)}
                    >
                      <span
                        aria-hidden="true"
                        className="grid size-7 shrink-0 place-items-center rounded-md border bg-background text-[0.6875rem] font-semibold tabular-nums"
                      >
                        V{strategy.version}
                      </span>
                      <span className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                        <span className="truncate" title={strategy.title}>
                          {strategy.title}
                        </span>
                        <span className="truncate text-xs text-muted-foreground">
                          {strategy.status}
                        </span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {paperLaunched ? (
            <SidebarGroup>
              <SidebarGroupLabel>Archive</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={route.kind === "paper-archived"}
                      onClick={() => navigate(paperArchivedHref(championId))}
                    >
                      <Archive />
                      <span className="grid min-w-0 flex-1 text-left leading-tight">
                        <span>Archived Paper</span>
                        <span className="text-xs text-muted-foreground">
                          {
                            paperPortfolios.filter(
                              (portfolio) => portfolio.operationalState === "archived"
                            ).length
                          }{" "}
                          retained
                        </span>
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ) : null}
        </SidebarContent>

        <SidebarFooter className="border-t">
          <SidebarMenu>
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
        <div className="shrink-0 border-b px-5 pt-2 sm:pt-3">
          <div className="flex items-center gap-3">
            <DesktopSidebarReopenTrigger />
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span className="rounded-md border bg-muted/40 px-2 py-0.5 text-xs font-semibold tabular-nums">
                V{selectedStrategy.version}
              </span>
              <h1 className="min-w-0 truncate text-base font-semibold">
                {selectedStrategy.title}
              </h1>
            </div>
            <WorkspaceContextStatus
                {...(activeContext === "live"
                  ? { kind: "live" as const }
                  : activeContext === "paper"
                    ? {
                        kind: "paper" as const,
                        freshness: paperView?.freshness ?? "Paper collection · local evidence",
                        marketRelevant: paperSnapshot?.operationalState === "active",
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
          <div
            className={
              activeContext === "live"
                ? "mt-1 flex items-center sm:mt-1.5 md:hidden"
                : "mt-1 flex items-center gap-1 sm:mt-1.5"
            }
          >
            <SidebarTrigger className="md:hidden" />
            {activeContext !== "live" ? (
              <Tabs
                value={activeContext}
                onValueChange={(value) =>
                  selectWorkspaceContext(championId, value as WorkspaceContext)
                }
              >
                <TabsList variant="line">
                  <TabsTrigger
                    value="draft"
                    onClick={() => selectWorkspaceContext(championId, "draft")}
                  >
                    {selectedStrategy.kind === "paper" ? "Strategy" : "Drafting"}
                  </TabsTrigger>
                  <TabsTrigger
                    value="paper"
                    onClick={() => selectWorkspaceContext(championId, "paper")}
                  >
                    Paper
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            ) : null}
          </div>
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
                    onBack={() => navigate(draftHref(championId))}
                    onOpenCheckpoints={() =>
                      navigate(`${draftHref(championId)}?panel=checkpoints`)
                    }
                    onRestore={
                      draftReadOnly
                        ? undefined
                        : () => forkCheckpoint(validRoutedCheckpoint.label)
                    }
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Checkpoint"
                    onBack={() => navigate(draftHref(championId))}
                  />
                )
              ) : route.kind === "data" ? (
                demo.scenario && scenarioChampion ? (
                  <DataWorkspace />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Datasets"
                    onBack={() => navigate(draftHref(championId))}
                  />
                )
              ) : route.kind === "source" ? (
                routedSource && routedSourceBelongsToChampion ? (
                  <SourceArtifactWorkspace
                    source={routedSource}
                    onBack={() => navigate(dataHref(championId))}
                  />
                ) : (
                  <UnavailableWorkspaceResource
                    label="Source artifact"
                    onBack={() => navigate(dataHref(championId))}
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
                    onBack={returnToDraftWorkspace}
                    onOpenRuns={returnToDraftRuns}
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
                    key={`${championId}-${selectedStrategy.id}`}
                    draft={draftView}
                    authorityOperation={authorityOperation}
                    readOnly={draftReadOnly}
                    saveStatus={localSaveStatus}
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
              ) : activeContext === "paper" &&
                (route.kind === "paper-index" || route.kind === "paper-compare") ? (
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
                  onOpenArchived={() => undefined}
                />
              ) : activeContext === "paper" &&
                route.kind === "paper-run" &&
                (!selectedPaperRun || !selectedPaperDecisionAvailable) ? (
                <UnavailablePaperResource onBack={() => navigate(paperIndexHref(championId))} />
              ) : activeContext === "paper" && paperView ? (
                <div className="h-full overflow-auto p-5">
                  <PaperPortfolioWorkspace
                    paper={paperView}
                    selectedReference={selectedPaperReference}
                    runTab={paperRunTab}
                    onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                    onOpenPortfolio={returnToPaperOverview}
                    onOpenRuns={openPaperRuns}
                    onDeployLive={() => navigate(liveHref(championId))}
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
                authorityError={authorityError}
                activity={workspaceActivity}
                activeTab={evidenceTab}
                expanded={evidenceExpanded}
                onActiveTabChange={(tab) => {
                  setBottomPanel({ tab, expanded: true })
                  navigate(`${draftHref(championId)}?panel=${encodeURIComponent(tab)}`)
                }}
                onExpandedChange={(expanded) =>
                  {
                    setBottomPanel((current) => ({
                      tab: expanded ? current.tab : null,
                      expanded,
                    }))
                    if (!expanded) updateRouteQuery({ panel: null })
                  }
                }
                forkPending={authorityOperation === "forking-checkpoint"}
                onForkCheckpoint={forkCheckpoint}
                readOnly={draftReadOnly}
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
                expanded={
                  paperSelection.panelExpanded ||
                  (route.kind === "paper-portfolio" && route.tab !== "overview")
                }
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
                onExpandedChange={(panelExpanded) => {
                  updateChampionSession(championId, (current) => ({
                    ...current,
                    paperSelection: {
                      ...current.paperSelection,
                      panelExpanded,
                    },
                  }))
                  if (
                    !panelExpanded &&
                    route.kind === "paper-portfolio" &&
                    route.tab !== "overview" &&
                    currentPaperPortfolioId
                  ) {
                    navigate(
                      paperPortfolioHref(championId, currentPaperPortfolioId, "overview")
                    )
                  }
                }}
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
            forceCollapsed={
              evidenceExpanded ||
              (activeContext === "paper" &&
                (paperSelection.panelExpanded ||
                  (route.kind === "paper-portfolio" && route.tab !== "overview")))
            }
            viewedContext={viewedContext}
            attachedContext={attachedContext}
            focusRequest={conversation.focusRequest}
            message={composerMessage}
            exchanges={conversation.exchanges}
            paperLaunchReviewAvailable={
              activeContext === "draft" &&
              scenarioDraft?.status === "active" &&
              paperLaunchReviewAvailable
            }
            onMessageChange={(message) =>
              setConversationMessage(championId, message)
            }
            onSubmit={(request) =>
              submitConversation(
                championId,
                request,
                attachedContext ?? viewedContext,
                `${draftView.title} · ${checkpointLabel}`,
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
        onConfirm={(simulatedCapital) => void confirmPaperLaunch(simulatedCapital)}
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
            projectEvaluation(scenario, evaluation, fixture, index + 1, all[index - 1])
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
  sequence: number,
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
    label: `Dry Run ${sequence}`,
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

  return {
    id: portfolio.id,
    label: portfolio.displayName,
    source: checkpoint
      ? `Checkpoint ${checkpoint.ordinal}`
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
  const accountHistory = Object.values(scenario.accountSnapshots)
    .filter((snapshot) => snapshot.portfolioId === portfolio.id)
    .sort((left, right) => left.asOf.localeCompare(right.asOf))
  const equityHistory = [
    {
      timestamp: portfolio.launchedAt,
      value: portfolio.simulatedCapital,
      quality: "confirmed" as const,
    },
    ...accountHistory
      .filter((snapshot) => snapshot.asOf !== portfolio.launchedAt)
      .map((snapshot) => ({
        timestamp: snapshot.asOf,
        value: snapshot.accountValue,
        quality: "confirmed" as const,
        runId: snapshot.sourceRunId,
        decisionIds: snapshot.sourceRunId
          ? [...(scenario.runs[snapshot.sourceRunId]?.decisionIds ?? [])]
          : [],
      })),
  ]
  const benchmarkHistory = Object.values(scenario.benchmarkObservations)
    .filter((observation) => observation.portfolioId === portfolio.id)
    .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
    .map((observation) => ({
      timestamp: observation.observedAt,
      value: observation.normalizedValue,
      quality: "confirmed" as const,
    }))
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
    strategy: strategy ? `Running ${strategy.label}` : "Unavailable",
    source: checkpoint
      ? `Checkpoint ${checkpoint.ordinal}`
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

function paperSidebarStatus(
  scenario: WorkspaceScenario,
  portfolio: PaperPortfolioRecord
) {
  if (portfolio.state !== "active") {
    return `Paper · ${titleCase(portfolio.state)}`
  }
  const account = scenario.accountSnapshots[portfolio.currentAccountSnapshotId]
  const portfolioReturn = account?.cumulativeTimeWeightedReturn ?? 0
  const benchmarkPoints = Object.values(scenario.benchmarkObservations)
    .filter((point) => point.portfolioId === portfolio.id)
    .sort((left, right) => left.observedAt.localeCompare(right.observedAt))
  const firstBenchmark = benchmarkPoints[0]?.normalizedValue
  const lastBenchmark = benchmarkPoints.at(-1)?.normalizedValue
  const spyReturn = firstBenchmark && lastBenchmark
    ? lastBenchmark / firstBenchmark - 1
    : 0
  return `Paper ${formatSignedPercent(portfolioReturn)} · SPY ${formatSignedPercent(spyReturn)}`
}

function formatSignedPercent(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
    signDisplay: "always",
  }).format(value)
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
      checkpoint: fixture.draft.checkpoint,
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
      className="h-svh overflow-hidden"
      style={{ "--sidebar-width": "17rem" } as CSSProperties}
    >
      <Sidebar collapsible="offcanvas" role="navigation" aria-label="Champion workspace navigation">
        <SidebarHeader>
          <div className="flex items-start justify-between">
            <span className="px-2 pt-1 text-xs font-semibold uppercase tracking-[0.18em]">
              Vantheon
            </span>
            <SidebarTrigger />
          </div>
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
  onOpenArchived,
}: {
  title: string
  portfolios: readonly PaperLaunchSnapshot[]
  archived?: boolean
  archivedCount: number
  onOpen: (portfolioId: string) => void
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
  return (
    <section className="h-full overflow-auto p-4 sm:p-5" aria-label={title}>
      <WorkspacePageHeader
        title={title}
        details={
          archived
            ? "Stopped portfolios retained for inspection."
            : "Independent simulated portfolios pinned to immutable strategies."
        }
        action={
          <div className="flex flex-wrap gap-2">
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
  pending,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (simulatedCapital: number) => void
  pending: boolean
  error: string | null
}) {
  const [description, setDescription] = useState("Initial version")
  const [buyingPower, setBuyingPower] = useState("10,000")
  const [cadence, setCadence] = useState("daily")
  const [timing, setTiming] = useState("market-open")
  const [runOnMarketHolidays, setRunOnMarketHolidays] = useState(false)
  const simulatedCapital = Number(buyingPower.replaceAll(",", ""))
  const buyingPowerValid = Number.isFinite(simulatedCapital) && simulatedCapital > 0

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!pending) onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Paper Trading</DialogTitle>
          <DialogDescription>
            Evaluate how your strategy performs with simulated trading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-1">
          <div className="space-y-2">
            <div>
              <label htmlFor="paper-description" className="text-sm font-semibold">
                Description
              </label>
              <p className="text-sm text-muted-foreground">
                What changed since the last version?
              </p>
            </div>
            <Input
              id="paper-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div>
              <label htmlFor="paper-buying-power" className="text-sm font-semibold">
                Buying Power
              </label>
              <p className="text-sm text-muted-foreground">
                Starting capital your strategy has to trade with.
              </p>
            </div>
            <div className="flex rounded-md border bg-background focus-within:ring-2 focus-within:ring-ring/50">
              <span className="grid w-11 shrink-0 place-items-center border-r text-muted-foreground">
                $
              </span>
              <Input
                id="paper-buying-power"
                inputMode="numeric"
                value={buyingPower}
                onChange={(event) => setBuyingPower(event.target.value)}
                className="border-0 focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div>
              <span className="text-sm font-semibold">Schedule</span>
              <p className="text-sm text-muted-foreground">
                Trades daily at 9:30am ET.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={cadence} onValueChange={(value) => value && setCadence(value)}>
                <SelectTrigger aria-label="Schedule frequency">
                  <SelectValue>Daily</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
              <Select value={timing} onValueChange={(value) => value && setTiming(value)}>
                <SelectTrigger aria-label="Schedule timing">
                  <SelectValue>Market Open</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="market-open">Market Open</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={runOnMarketHolidays}
              onChange={(event) => setRunOnMarketHolidays(event.target.checked)}
              className="mt-0.5 size-4 rounded border"
            />
            <span>
              <span className="block text-sm font-medium">Run on market holidays</span>
              <span className="block text-sm text-muted-foreground">
                When off, runs that land on a US market holiday are skipped.
              </span>
            </span>
          </label>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            disabled={pending || !buyingPowerValid}
            onClick={() => onConfirm(simulatedCapital)}
          >
            {pending ? "Promoting…" : "Promote"}
            {!pending ? <ArrowRight aria-hidden="true" /> : null}
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
        ? "Future runs stop and this portfolio moves to Archived Paper. Existing strategy, runs, decisions, and evidence remain available."
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
