"use client";

import { create } from "zustand";

import type {
  AnyDomainReference,
  EntityReference,
} from "@/domain/identity";

export type ConversationPanelState = "expanded" | "collapsed";

interface WorkspaceInteractionValues {
  readonly conversationPanel: ConversationPanelState;
  readonly activityPanelOpen: boolean;
  readonly focusedReference: AnyDomainReference | null;
  readonly paperComparison: readonly EntityReference<"paper-portfolio">[];
  readonly composerDraft: string;
}

interface WorkspaceInteractionActions {
  setConversationPanel: (state: ConversationPanelState) => void;
  setActivityPanelOpen: (open: boolean) => void;
  focusReference: (reference: AnyDomainReference | null) => void;
  togglePaperComparison: (
    portfolio: EntityReference<"paper-portfolio">,
  ) => void;
  setComposerDraft: (value: string) => void;
  resetInteractions: () => void;
}

export type WorkspaceInteractionStore = WorkspaceInteractionValues &
  WorkspaceInteractionActions;

const initialValues: WorkspaceInteractionValues = {
  conversationPanel: "expanded",
  activityPanelOpen: false,
  focusedReference: null,
  paperComparison: [],
  composerDraft: "",
};

/** Disposable UI state only. Server-backed entities belong in TanStack Query. */
export const useWorkspaceInteractionStore = create<WorkspaceInteractionStore>()(
  (set) => ({
    ...initialValues,
    setConversationPanel: (conversationPanel) => set({ conversationPanel }),
    setActivityPanelOpen: (activityPanelOpen) => set({ activityPanelOpen }),
    focusReference: (focusedReference) => set({ focusedReference }),
    togglePaperComparison: (portfolio) =>
      set((state) => {
        const selected = state.paperComparison.some(
          (item) => item.id === portfolio.id,
        );

        return {
          paperComparison: selected
            ? state.paperComparison.filter((item) => item.id !== portfolio.id)
            : [...state.paperComparison, portfolio],
        };
      }),
    setComposerDraft: (composerDraft) => set({ composerDraft }),
    resetInteractions: () => set(initialValues),
  }),
);
