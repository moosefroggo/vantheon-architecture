"use client"

import { useMemo, useRef, useState } from "react"
import { MessageSquareText } from "lucide-react"

import { ChampionIdentity } from "@/components/domain/champion/champion-identity"
import {
  ChampionWorkspaceSwitcher,
  type ChampionWorkspaceContext,
  type ChampionWorkspaceOption,
} from "@/components/domain/champion/champion-workspace-switcher"
import {
  ContextualChampionPanel,
  type ChampionReference,
} from "@/components/domain/conversation/contextual-champion-panel"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import { DraftOnboardingSurface } from "./draft-onboarding-surface"
import { onboardingFixture } from "./fixtures"
import { PaperLaunchReview } from "./paper-launch-review"
import { PaperOnboardingSurface } from "./paper-onboarding-surface"

export function OnboardingWorkspace() {
  const [activeContext, setActiveContext] =
    useState<ChampionWorkspaceContext>("draft")
  const [evaluationComplete, setEvaluationComplete] = useState(false)
  const [paperLaunched, setPaperLaunched] = useState(false)
  const [launchReviewOpen, setLaunchReviewOpen] = useState(false)
  const [conversationOpen, setConversationOpen] = useState(false)

  const mainSurfaceRef = useRef<HTMLElement>(null)

  const draftLabel = paperLaunched ? "Drafting V2" : onboardingFixture.draft.label
  const checkpointLabel = paperLaunched
    ? "Checkpoint 0"
    : onboardingFixture.draft.checkpointLabel

  const contextOptions = useMemo<ChampionWorkspaceOption[]>(
    () =>
      onboardingFixture.contexts.map((option) => {
        if (option.id === "draft" && paperLaunched) {
          return { ...option, label: "Drafting V2", stateLabel: "Developing" }
        }

        if (option.id === "paper" && paperLaunched) {
          return {
            ...option,
            label: onboardingFixture.paper.label,
            stateLabel: onboardingFixture.paper.statusLabel,
            disabled: false,
          }
        }

        return {
          ...option,
          disabled: option.id !== "draft",
        }
      }),
    [paperLaunched]
  )

  const selectedOption = contextOptions.find(
    (option) => option.id === activeContext
  ) ?? contextOptions[0]

  const viewedContext = {
    kind: activeContext,
    label:
      activeContext === "draft"
        ? `${draftLabel} · ${checkpointLabel}`
        : activeContext === "paper" && paperLaunched
          ? `${onboardingFixture.paper.label} overview`
          : `${selectedOption.label} readiness`,
  } as const

  const mutationTarget = { draftLabel, checkpointLabel }

  const conversationSummary = useMemo(() => {
    if (activeContext === "paper") {
      return paperLaunched
        ? "Paper runs the frozen Strategy V1. Questions can use its evidence, while any accepted change is prepared separately in Drafting V2."
        : "Paper has not started. Dry Run Drafting V1 first so its behavior is inspectable before launch."
    }

    if (activeContext === "live") {
      return "Live is not configured. No Draft or Paper action can move real capital automatically."
    }

    if (paperLaunched) {
      return "Drafting V2 starts with the same content as Strategy V1. It can evolve without changing Paper."
    }

    return evaluationComplete
      ? "The evaluation is complete. Review its behavior before deciding whether to launch a simulated Paper portfolio."
      : onboardingFixture.conversation.summary
  }, [activeContext, evaluationComplete, paperLaunched])

  const conversationReferences = useMemo<ChampionReference[]>(() => {
    if (activeContext === "draft") {
      return [
        { id: "draft-current", label: `${draftLabel} · ${checkpointLabel}` },
        {
          id: "evaluation-setup",
          label: evaluationComplete ? "Evaluation evidence" : "Evaluation setup",
        },
      ]
    }

    return [
      { id: `${activeContext}-view`, label: viewedContext.label },
      { id: "draft-target", label: `Change target: ${draftLabel}` },
    ]
  }, [activeContext, checkpointLabel, draftLabel, evaluationComplete, viewedContext.label])

  function focusPrimaryArtifact() {
    setActiveContext("draft")
    setConversationOpen(false)
    requestAnimationFrame(() => mainSurfaceRef.current?.focus())
  }

  function handleReferenceSelect(reference: ChampionReference) {
    if (reference.id.includes("paper")) {
      setActiveContext("paper")
      setConversationOpen(false)
      requestAnimationFrame(() => mainSurfaceRef.current?.focus())
      return
    }

    focusPrimaryArtifact()
  }

  function confirmPaperLaunch() {
    setPaperLaunched(true)
    setLaunchReviewOpen(false)
    setActiveContext("paper")
    requestAnimationFrame(() => mainSurfaceRef.current?.focus())
  }

  return (
    <div className="min-h-svh bg-muted/30">
      <a
        href="#primary-workspace"
        className="fixed left-3 top-3 z-50 -translate-y-20 rounded-lg bg-background px-3 py-2 text-sm font-medium shadow-sm focus:translate-y-0 focus:outline-none focus:ring-3 focus:ring-ring/50"
      >
        Skip to strategy
      </a>

      <header className="border-b bg-background">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
          <ChampionIdentity {...onboardingFixture.champion} />

          <ChampionWorkspaceSwitcher
            value={activeContext}
            options={contextOptions}
            onValueChange={setActiveContext}
            className="order-3 w-full lg:order-none lg:ml-auto lg:w-auto"
          />

          <Button
            type="button"
            variant="outline"
            onClick={() => setConversationOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={conversationOpen}
            className="ml-auto lg:ml-0"
          >
            <MessageSquareText aria-hidden="true" data-icon="inline-start" />
            Ask {onboardingFixture.champion.name}
          </Button>
        </div>
      </header>

      <main id="primary-workspace" className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {activeContext === "paper" && paperLaunched ? (
          <PaperOnboardingSurface
            paper={onboardingFixture.paper}
            containerRef={mainSurfaceRef}
            onContinueInDraft={focusPrimaryArtifact}
          />
        ) : (
          <DraftOnboardingSurface
            draft={onboardingFixture.draft}
            evaluation={onboardingFixture.evaluation}
            draftLabel={draftLabel}
            checkpointLabel={checkpointLabel}
            evaluationComplete={evaluationComplete}
            containerRef={mainSurfaceRef}
            onRunEvaluation={() => setEvaluationComplete(true)}
            onReviewPaperLaunch={() => setLaunchReviewOpen(true)}
          />
        )}
      </main>

      <Sheet open={conversationOpen} onOpenChange={setConversationOpen}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Ask {onboardingFixture.champion.name}</SheetTitle>
            <SheetDescription>
              Ask about what you are viewing. Proposed changes still target the Draft.
            </SheetDescription>
          </SheetHeader>
          <ContextualChampionPanel
            championName={onboardingFixture.champion.name}
            viewedContext={viewedContext}
            mutationTarget={mutationTarget}
            summary={conversationSummary}
            suggestions={onboardingFixture.conversation.suggestions}
            references={conversationReferences}
            onReferenceSelect={handleReferenceSelect}
            className="min-h-0 flex-1 rounded-none border-0"
          />
        </SheetContent>
      </Sheet>

      <PaperLaunchReview
        open={launchReviewOpen}
        onOpenChange={setLaunchReviewOpen}
        draft={onboardingFixture.draft}
        evaluation={onboardingFixture.evaluation}
        onConfirm={confirmPaperLaunch}
      />
    </div>
  )
}
