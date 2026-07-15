import { describe, expect, it } from "vitest"

import {
  formatCheckpointLabel,
  formatDraftLabel,
  formatPaperLabel,
  formatVersionReference,
} from "./version-labels"

describe("version labels", () => {
  it("keeps strategy generations, checkpoints, and portfolios visually distinct", () => {
    expect(formatDraftLabel("Draft V2")).toBe("Drafting V2")
    expect(formatCheckpointLabel("V2.0")).toBe("Checkpoint 0")
    expect(formatPaperLabel("Paper V1")).toBe("Paper")
    expect(formatVersionReference("Draft V1 · checkpoint V1.2")).toBe(
      "Drafting V1 · Checkpoint 2"
    )
  })
})
