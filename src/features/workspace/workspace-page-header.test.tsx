import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { WorkspacePageHeader } from "./workspace-page-header"

describe("WorkspacePageHeader", () => {
  it("keeps the page title before status metadata", () => {
    render(
      <WorkspacePageHeader
        title="Momentum"
        badges={[
          { label: "Drafting V2" },
          { label: "Untested" },
        ]}
      />
    )

    const title = screen.getByRole("heading", { name: "Momentum", level: 1 })
    const status = screen.getByText("Drafting V2")

    expect(
      title.compareDocumentPosition(status) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })
})
