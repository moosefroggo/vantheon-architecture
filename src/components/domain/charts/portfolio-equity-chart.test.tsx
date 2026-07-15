import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { PortfolioEquityObservationIndex } from "@/components/domain/charts/portfolio-equity-chart"
import { portfolioEquityFixture } from "@/lib/charts/fixtures"

describe("PortfolioEquityObservationIndex", () => {
  it("provides keyboard-clickable paths to the run and decision traces", () => {
    const onOpenReference = vi.fn()
    const observation = {
      ...portfolioEquityFixture.series.points[0],
      decisionReferences: [
        {
          kind: "decision" as const,
          id: "decision-1",
          label: "Hold cash",
        },
      ],
    }

    render(
      <PortfolioEquityObservationIndex
        observations={[observation]}
        model={portfolioEquityFixture}
        onOpenReference={onOpenReference}
      />,
    )

    fireEvent.click(screen.getByRole("button", { name: /Open Run 1 trace/ }))
    expect(onOpenReference).toHaveBeenLastCalledWith(observation.reference)

    fireEvent.click(screen.getByRole("button", { name: "Hold cash" }))
    expect(onOpenReference).toHaveBeenLastCalledWith(observation.decisionReferences[0])
  })
})
