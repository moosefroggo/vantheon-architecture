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
        focusRequest={1}
        message=""
        exchanges={[]}
        onMessageChange={vi.fn()}
        onSubmit={vi.fn()}
        onClearAttachedContext={onClearAttachedContext}
      />
    )

    expect(screen.getByText("Selection · Momentum rank")).toBeVisible()
    const composer = screen.getByRole("textbox", {
      name: "Message Atlas about Selection · Momentum rank",
    })
    const sendButton = screen.getByRole("button", { name: "Send" })

    expect(composer).toHaveFocus()
    expect(composer.parentElement).toContainElement(sendButton)
    expect(
      screen.getByPlaceholderText("Tell Atlas how this should change…")
    ).toBeVisible()
    expect(screen.queryByText(/Changes →/)).not.toBeInTheDocument()

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove Selection · Momentum rank from conversation",
      })
    )

    expect(onClearAttachedContext).toHaveBeenCalledOnce()
  })
})
