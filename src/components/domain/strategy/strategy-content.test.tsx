import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { StrategyDocument } from "./strategy-document"
import { StrategySummary } from "./strategy-summary"

describe("strategy content headers", () => {
  it("does not repeat Draft and checkpoint state inside the content cards", () => {
    const { rerender } = render(
      <StrategySummary rules={[]} onEditRule={vi.fn()} />
    )

    expect(screen.getByText("Strategy summary")).toBeVisible()
    expect(screen.queryByText(/Active Draft/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Checkpoint/i)).not.toBeInTheDocument()

    rerender(<StrategyDocument objective="Preserve capital." rules={[]} />)

    expect(screen.getByRole("article")).toBeVisible()
    expect(screen.getByRole("heading", { name: "Thesis" })).toBeVisible()
    expect(screen.getByText("Preserve capital.")).toBeVisible()
    expect(screen.queryByText("Complete strategy")).not.toBeInTheDocument()
    expect(screen.queryByText(/Editable working document/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/Checkpoint/i)).not.toBeInTheDocument()
  })
})
