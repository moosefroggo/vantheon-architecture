import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceHeaderBreadcrumbs } from "./workspace-header-breadcrumbs"

describe("WorkspaceHeaderBreadcrumbs", () => {
  it("makes ancestors navigable and marks the final segment as current", () => {
    const returnToDraft = vi.fn()

    render(
      <WorkspaceHeaderBreadcrumbs
        items={[
          { label: "Drafting V1", onSelect: returnToDraft },
          { label: "Dry Run 1" },
        ]}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: "Drafting V1" }))

    expect(returnToDraft).toHaveBeenCalledOnce()
    expect(screen.getByText("Dry Run 1")).toHaveAttribute(
      "aria-current",
      "page"
    )
  })
})
