import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceEnvironmentNavigationItem } from "./workspace-environment-navigation-item"

describe("WorkspaceEnvironmentNavigationItem Draft status", () => {
  it("presents the latest checkpoint independently from its test state", () => {
    render(
      <WorkspaceEnvironmentNavigationItem
        label="Drafting V1"
        status={{ kind: "draft", checkpoint: "V1.4", tested: false }}
        active
        compact
        onClick={vi.fn()}
      />
    )

    expect(
      screen.getByRole("button", {
        name: "Drafting V1, Checkpoint 4 · Untested",
      })
    ).toHaveAttribute("aria-current", "page")
  })
})
