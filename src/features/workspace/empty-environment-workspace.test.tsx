import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { EmptyEnvironmentWorkspace } from "./empty-environment-workspace"

describe("EmptyEnvironmentWorkspace", () => {
  it("uses the journey as the Live content without repeating environment metadata", () => {
    const action = vi.fn()

    render(
      <EmptyEnvironmentWorkspace
        environment="Live"
        draftLabel="Drafting V1"
        evaluationComplete={false}
        paperLaunched={false}
        measurementComplete={false}
        onAskAtlas={action}
        onOpenDraft={action}
        onRunDraft={action}
        onReviewPaperLaunch={action}
      />
    )

    expect(screen.getByRole("region", { name: "Live setup" })).toBeInTheDocument()
    expect(screen.getByText("Dry run the strategy")).toBeInTheDocument()
    expect(screen.queryByText("Not started")).not.toBeInTheDocument()
    expect(screen.queryByText("Real capital")).not.toBeInTheDocument()
  })
})
