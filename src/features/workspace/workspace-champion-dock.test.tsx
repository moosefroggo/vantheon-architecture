import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { WorkspaceChampionDock } from "./workspace-champion-dock"

describe("WorkspaceChampionDock context attachment", () => {
  it("places selected strategy context above the focused composer and clears it safely", () => {
    const onClearAttachedContext = vi.fn()

    render(
      <WorkspaceChampionDock
        championId="mara"
        viewedContext="Draft V1 · Summary"
        attachedContext="Selection · Momentum rank"
        mutationTarget="Draft V1 · V1.2"
        focusRequest={1}
        message=""
        exchanges={[]}
        onMessageChange={vi.fn()}
        onSubmit={vi.fn()}
        onClearAttachedContext={onClearAttachedContext}
      />
    )

    expect(screen.getByText("Selection · Momentum rank")).toBeVisible()
    expect(
      screen.getByRole("textbox", {
        name: "Message Atlas about Selection · Momentum rank",
      })
    ).toHaveFocus()
    expect(
      screen.getByPlaceholderText("Tell Atlas how this should change…")
    ).toBeVisible()

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove Selection · Momentum rank from conversation",
      })
    )

    expect(onClearAttachedContext).toHaveBeenCalledOnce()
  })
})
