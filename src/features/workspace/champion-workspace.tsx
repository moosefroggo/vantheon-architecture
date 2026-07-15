"use client"

import { useMemo, useRef, useState, type CSSProperties } from "react"
import {
  Archive,
  CircleUserRound,
  Database,
  LockKeyhole,
  NotebookTabs,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { MarketSessionStatus } from "@/components/domain/market/market-session-status"
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
import {
  formatCheckpointLabel,
  formatDraftLabel,
  formatPaperLabel,
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
  type PaperDetailsTab,
  type PaperRunTab,
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
import {
  createWorkspaceDemoAuthority,
  WorkspaceDemoAuthorityError,
  type WorkspaceDemoAuthority,
  type WorkspaceAuthorityOperation,
} from "./workspace-demo-authority"
import {
  type ConfirmedDraftRulePatch,
  type StrategyRuleFixture,
  type WorkspaceEvaluationBaselineFixture,
  type WorkspaceEvaluationFixture,
  type WorkspaceFixture,
  marketSessionFixture,
  workspaceFixtures,
} from "./workspace-fixtures"

type WorkspaceContext = "draft" | "paper" | "live"

type DraftRuntimeState = {
  checkpoint: string
  rules: StrategyRuleFixture[]
  confirmedPatch: ConfirmedDraftRulePatch | null
}

type PaperLaunchSnapshot = {
  source: string
  rules: StrategyRuleFixture[]
}

type ChampionConversationState = {
  context: string | null
  focusRequest: number
  message: string
  exchanges: ConversationExchange[]
}

type ChampionSessionState = {
  activeContext: WorkspaceContext
  evaluations: WorkspaceEvaluationFixture[]
  draftState: DraftRuntimeState
  paperSnapshot: PaperLaunchSnapshot | null
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
  const [runtime, setRuntime] = useState<WorkspaceRuntimeState>(createInitialRuntime)
  const [profileOpen, setProfileOpen] = useState(false)
  const [bottomPanel, setBottomPanel] = useState<{
    tab: WorkspaceEvidenceTab
    expanded: boolean
  }>({ tab: "problems", expanded: false })
  const runtimeRef = useRef(runtime)
  const authoritiesRef = useRef<Map<string, WorkspaceDemoAuthority> | null>(null)
  const conversationSequenceRef = useRef(0)

  if (authoritiesRef.current === null) {
    authoritiesRef.current = new Map(
      workspaceFixtures.map((fixture) => [
        fixture.champion.id,
        createWorkspaceDemoAuthority({
          championId: fixture.champion.id,
          initialDraft: fixture.draft,
          evaluationTemplate: fixture.evaluation,
        }),
      ])
    )
  }

  const championId = runtime.selectedChampionId
  const workspaceFixture = getWorkspaceFixture(championId)
  const session = runtime.sessions[championId]
  const {
    activeContext,
    evaluations,
    draftState,
    paperSnapshot,
    draftSelection,
    paperSelection,
    launchReviewOpen,
    conversation,
    authorityOperation,
    authorityError,
  } = session
  const paperLaunched = paperSnapshot !== null
  const internalDraftLabel = paperLaunched
    ? "Draft V2"
    : workspaceFixture.draft.label
  const draftLabel = formatDraftLabel(internalDraftLabel)
  const checkpoint = draftState.checkpoint
  const checkpointLabel = formatCheckpointLabel(checkpoint)
  const currentEvaluation =
    evaluations.findLast((evaluation) => evaluation.checkpoint === checkpoint) ?? null
  const latestEvaluation = evaluations.at(-1) ?? null
  const selectedDryRun = draftSelection.dryRunId
    ? evaluations.find((evaluation) => evaluation.id === draftSelection.dryRunId) ?? null
    : null
  const evaluationComplete = currentEvaluation !== null
  const paperLaunchReviewAvailable = !paperLaunched && evaluationComplete

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

    return {
      ...workspaceFixture.paper,
      label: formatPaperLabel(workspaceFixture.paper.label),
      source: formatVersionReference(paperSnapshot.source),
      strategyRules: paperSnapshot.rules.map((rule) => ({
        label: rule.group,
        value: `${rule.value} · ${rule.constraint}`,
      })),
    }
  }, [paperSnapshot, workspaceFixture.paper])

  const selectedPaperRun = paperSelection.reference
    ? workspaceFixture.paper.runs?.find((run) =>
        paperSelection.reference?.kind === "run"
          ? run.id === paperSelection.reference.id
          : run.decisions?.some(
              (decision) => decision.id === paperSelection.reference?.id
            )
      )
    : null

  const defaultViewedContext =
    activeContext === "draft"
      ? selectedDryRun
        ? `${draftLabel} · ${selectedDryRun.label} · ${titleCase(draftSelection.dryRunTab)}`
        : `${draftLabel} · ${titleCase(draftSelection.surface)}`
      : activeContext === "paper"
        ? paperLaunched
          ? selectedPaperRun
            ? `Paper · ${selectedPaperRun.label} · ${titleCase(paperSelection.runTab)}`
            : `Paper · ${titleCase(paperSelection.detailsTab)}`
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
    if (nextChampionId === runtimeRef.current.selectedChampionId) return
    getWorkspaceFixture(nextChampionId)

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
  }

  function selectWorkspaceContext(
    sourceChampionId: string,
    context: WorkspaceContext
  ) {
    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      activeContext: context,
      conversation: {
        ...current.conversation,
        context: null,
      },
    }))
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
    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      conversation: {
        ...current.conversation,
        message,
      },
    }))
  }

  function submitConversation(
    sourceChampionId: string,
    request: string,
    attachedContext: string,
    mutationTarget: string
  ) {
    conversationSequenceRef.current += 1
    const exchange: ConversationExchange = {
      id: `${sourceChampionId}:${conversationSequenceRef.current}`,
      request,
      response: atlasResponseForContext(attachedContext, mutationTarget),
      viewedContext: attachedContext,
      mutationTarget,
    }

    updateChampionSession(sourceChampionId, (current) => ({
      ...current,
      conversation: {
        ...current.conversation,
        message: "",
        exchanges: [...current.conversation.exchanges, exchange],
      },
    }))
  }

  async function confirmPaperLaunch() {
    const sourceChampionId = championId
    const sourceFixture = workspaceFixture
    const sourceSession = runtimeRef.current.sessions[sourceChampionId]
    const sourcePaperLaunched = sourceSession.paperSnapshot !== null
    const sourceDraftLabel = sourcePaperLaunched
      ? "Draft V2"
      : sourceFixture.draft.label
    const sourceCheckpoint = sourceSession.draftState.checkpoint
    const sourceRules = sourceSession.draftState.rules

    if (!beginAuthorityOperation(sourceChampionId, "launching-paper")) return

    try {
      const response = await getAuthority(
        authoritiesRef.current,
        sourceChampionId
      ).launchPaper({
        draftLabel: sourceDraftLabel,
        checkpoint: sourceCheckpoint,
        rules: sourceRules,
      })
      assertAuthorityChampion(response.championId, sourceChampionId)

      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        activeContext: "paper",
        paperSnapshot: response.paperSnapshot,
        draftState: {
          ...response.nextDraft,
          confirmedPatch: null,
        },
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
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "launching-paper")
    }
  }

  async function forkCheckpoint(sourceCheckpoint: string) {
    const sourceChampionId = championId
    const sourceSession = runtimeRef.current.sessions[sourceChampionId]

    if (!beginAuthorityOperation(sourceChampionId, "forking-checkpoint")) return

    try {
      const response = await getAuthority(
        authoritiesRef.current,
        sourceChampionId
      ).forkCheckpoint({
        sourceCheckpoint,
        baseCheckpoint: sourceSession.draftState.checkpoint,
      })
      assertAuthorityChampion(response.championId, sourceChampionId)

      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        activeContext: "draft",
        draftState: {
          ...response.draft,
          confirmedPatch: null,
        },
        draftSelection: {
          ...current.draftSelection,
          decision: null,
        },
        conversation: {
          ...current.conversation,
          context: null,
        },
      }))
    } catch (error) {
      setAuthorityError(sourceChampionId, authorityErrorMessage(error))
    } finally {
      finishAuthorityOperation(sourceChampionId, "forking-checkpoint")
    }
  }

  async function runEvaluation() {
    const sourceChampionId = championId
    const sourceSession = runtimeRef.current.sessions[sourceChampionId]
    const sourceCheckpoint = sourceSession.draftState.checkpoint
    const sourceRules = sourceSession.draftState.rules

    if (!beginAuthorityOperation(sourceChampionId, "evaluating")) return

    try {
      const result = await getAuthority(
        authoritiesRef.current,
        sourceChampionId
      ).evaluateDraft({
        checkpoint: sourceCheckpoint,
        rules: sourceRules,
      })
      assertAuthorityChampion(result.championId, sourceChampionId)

      updateChampionSession(sourceChampionId, (current) => ({
        ...current,
        evaluations: [...current.evaluations, result],
        draftSelection: {
          ...current.draftSelection,
          dryRunId: result.id,
          dryRunTab: "summary",
        },
        conversation: {
          ...current.conversation,
          context: null,
        },
      }))
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
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive={activeContext === "live"}
                    aria-label="Live, not started"
                    onClick={() => selectWorkspaceContext(championId, "live")}
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full border border-muted-foreground/60"
                    />
                    <span>Live</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Strategies</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    size="lg"
                    isActive={activeContext !== "live"}
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
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {paperLaunched ? (
            <SidebarGroup>
              <SidebarGroupLabel>Archive</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton disabled>
                      <Archive />
                      <span>Archived Paper</span>
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
              <SidebarMenuButton
                isActive={
                  activeContext === "draft" &&
                  bottomPanel.expanded &&
                  bottomPanel.tab === "data"
                }
                onClick={() => {
                  selectWorkspaceContext(championId, "draft")
                  setBottomPanel({ tab: "data", expanded: true })
                }}
              >
                <Database />
                <span>Datasets</span>
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
                {paperLaunched ? (
                  <TabsTrigger value="paper">Paper</TabsTrigger>
                ) : null}
              </TabsList>
            </Tabs>
          )}
          <MarketSessionStatus session={marketSessionFixture} />
        </div>

        <div className="flex min-h-0 flex-1 flex-col xl:flex-row">
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              id="primary-workspace"
              tabIndex={-1}
              className="min-h-0 min-w-0 flex-1 outline-none"
            >
              {activeContext === "draft" ? (
                selectedDryRun ? (
                  <DryRunWorkspace
                    run={selectedDryRun}
                    activeTab={draftSelection.dryRunTab}
                    onActiveTabChange={(dryRunTab) =>
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
                    }
                  />
                ) : (
                  <DraftStrategyWorkspace
                    draft={draftView}
                    evaluation={currentEvaluation}
                    draftLabel={draftLabel}
                  checkpoint={checkpoint}
                  evaluationComplete={evaluationComplete}
                  authorityOperation={authorityOperation}
                  activeTab={draftSelection.surface}
                  onRunEvaluation={runEvaluation}
                    onActiveTabChange={(surface) =>
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
              ) : activeContext === "paper" && paperView ? (
                <div className="h-full overflow-auto p-4 sm:p-5">
                  <PaperPortfolioWorkspace
                    paper={paperView}
                    selectedReference={paperSelection.reference}
                    runTab={paperSelection.runTab}
                    onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                    onRunTabChange={(runTab) =>
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
                    }
                    onSelectedReferenceChange={(reference) =>
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
                    }
                  />
                </div>
              ) : (
                <EmptyEnvironmentWorkspace
                  environment={activeContext === "paper" ? "Paper" : "Live"}
                  draftLabel={draftLabel}
                  evaluationComplete={evaluationComplete}
                  paperLaunched={paperLaunched}
                  measurementComplete={
                    paperLaunched && (paperView?.runs?.length ?? 0) >= 5
                  }
                  onAskAtlas={() =>
                    focusChampionConversation(
                      championId,
                      activeContext === "paper" ? "Paper · Journey" : "Live · Journey"
                    )
                  }
                  onOpenDraft={() => selectWorkspaceContext(championId, "draft")}
                  onRunDraft={runEvaluation}
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
                checkpoint={checkpoint}
                evaluation={currentEvaluation}
                evaluations={evaluations}
                baseline={evidenceBaseline}
                template={workspaceFixture.evaluation}
                authorityError={authorityError}
                activeTab={bottomPanel.tab}
                expanded={bottomPanel.expanded}
                onActiveTabChange={(tab) =>
                  setBottomPanel((current) => ({ ...current, tab }))
                }
                onExpandedChange={(expanded) =>
                  setBottomPanel((current) => ({ ...current, expanded }))
                }
                forkPending={authorityOperation === "forking-checkpoint"}
                onForkCheckpoint={forkCheckpoint}
                onOpenDryRun={(dryRunId) =>
                  updateChampionSession(championId, (current) => ({
                    ...current,
                    activeContext: "draft",
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
                }
              />
            ) : activeContext === "paper" && paperView ? (
              <PaperWorkspaceBottomPanel
                paper={paperView}
                activeTab={paperSelection.detailsTab}
                expanded={paperSelection.panelExpanded}
                onActiveTabChange={(detailsTab) =>
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
                }
              />
            ) : null}
          </div>

          <WorkspaceChampionDock
            championId={championId}
            viewedContext={viewedContext}
            attachedContext={attachedContext}
            focusRequest={conversation.focusRequest}
            message={conversation.message}
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
                `${draftLabel} · ${checkpointLabel}`
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
        pending={authorityOperation === "launching-paper"}
        error={authorityError}
      />

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
            <DialogDescription>
              Account, security, brokerage connections, and notification preferences.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border p-4">
            <p className="text-sm font-medium">Personal workspace</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your profile remains available across every Champion workspace.
            </p>
          </div>
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

function createChampionSession(
  fixture: WorkspaceFixture
): ChampionSessionState {
  const initialPaper = fixture.initialPaper === true

  return {
    activeContext: initialPaper ? "paper" : "draft",
    evaluations: [],
    draftState: {
      checkpoint: initialPaper ? "V2.0" : fixture.draft.checkpoint,
      rules: fixture.draft.rules.map((rule) => ({ ...rule })),
      confirmedPatch: null,
    },
    paperSnapshot: initialPaper
      ? {
          source: fixture.paper.source,
          rules: fixture.draft.rules.map((rule) => ({ ...rule })),
        }
      : null,
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
      message: "",
      exchanges: [],
    },
    authorityOperation: null,
    authorityError: null,
  }
}

function getWorkspaceFixture(championId: string): WorkspaceFixture {
  const fixture = workspaceFixtures.find(
    (candidate) => candidate.champion.id === championId
  )

  if (!fixture) throw new Error(`Unknown Champion workspace: ${championId}`)
  return fixture
}

function getAuthority(
  authorities: Map<string, WorkspaceDemoAuthority> | null,
  championId: string
) {
  const authority = authorities?.get(championId)
  if (!authority) throw new Error(`No authority registered for ${championId}`)
  return authority
}

function assertAuthorityChampion(actual: string, expected: string) {
  if (actual !== expected) {
    throw new Error(
      `Authority response for ${actual} cannot update Champion ${expected}.`
    )
  }
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

function titleCase(value: string) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

function PaperLaunchDialog({
  open,
  onOpenChange,
  onConfirm,
  source,
  pending,
  error,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  source: string
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
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Portfolio</span>
            <span className="px-3 py-2 font-medium">$100,000 simulated</span>
          </div>
          <div className="grid grid-cols-[7rem_1fr] border-b">
            <span className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Schedule</span>
            <span className="px-3 py-2 font-medium">Friday after market close</span>
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

function authorityErrorMessage(error: unknown) {
  if (error instanceof WorkspaceDemoAuthorityError) return error.message
  return "The demo authority could not confirm this operation. Try again."
}
