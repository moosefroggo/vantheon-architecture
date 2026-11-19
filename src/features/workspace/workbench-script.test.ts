import { expect, it } from "vitest"

import { WORKSPACE_DEMO_IDS } from "./demo/seed"
import { parseWorkspaceRoute } from "./workspace-route"
import { createWorkbenchReplay, workbenchReplayFrame } from "./workbench-script"

it("reversibly projects the Vantheon scroll sequence over isolated snapshots", async () => {
  const replay = await createWorkbenchReplay()
  const frame = (progress: number) => workbenchReplayFrame(replay, progress)
  const draftId = WORKSPACE_DEMO_IDS.mara.draftV10

  expect(frame(0).scenario.drafts[draftId].currentCheckpointId).toBe(WORKSPACE_DEMO_IDS.mara.checkpointV102)
  expect(frame(.24).message).toMatch(/^Change this to /)
  expect(frame(.24).context).toContain("Selection")
  expect(parseWorkspaceRoute(frame(.4).href)).toMatchObject({ kind: "draft-change" })
  expect(frame(.4).scenario.changeSets[replay.changeSetId].status).toBe("proposed")
  expect(frame(.6).scenario.checkpoints[frame(.6).scenario.drafts[draftId].currentCheckpointId].ordinal).toBe(3)
  expect(frame(.78).preflight).toBe(true)
  expect(frame(.92).scenario.evaluations[replay.evaluationId].orderIds).toEqual([])
  expect(parseWorkspaceRoute(frame(.92).href)).toMatchObject({ kind: "evaluation" })

  expect(frame(.4).scenario.changeSets[replay.changeSetId].status).toBe("proposed")
  expect(frame(0).scenario.evaluations[replay.evaluationId]).toBeUndefined()
})
