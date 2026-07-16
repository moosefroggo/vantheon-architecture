import { describe, expect, it, vi } from "vitest";

import {
  runScenario,
  scheduleScenario,
  type ScenarioEvent,
} from "./scenario";

const events: ScenarioEvent<{ label: string }>[] = [
  {
    id: "event-2",
    sequence: 2,
    logicalAtMs: 100,
    channel: "champion",
    type: "activity.progressed",
    payload: { label: "Evaluating" },
  },
  {
    id: "event-1",
    sequence: 1,
    logicalAtMs: 0,
    channel: "champion",
    type: "activity.started",
    payload: { label: "Interpreting" },
  },
];

describe("deterministic scenario scheduling", () => {
  it("produces the same ordered schedule for the same seed", () => {
    const profile = { seed: 42, baseLatencyMs: 80, jitterMs: 20 };

    expect(scheduleScenario(events, profile)).toEqual(
      scheduleScenario(events, profile),
    );
    expect(scheduleScenario(events, profile).map((event) => event.sequence)).toEqual([
      1, 2,
    ]);
  });

  it("stops at the configured transport failure", async () => {
    const profile = {
      seed: 7,
      baseLatencyMs: 0,
      jitterMs: 0,
      failAtSequence: 2,
    };
    const scheduled = scheduleScenario(events, profile);
    const delivered: number[] = [];
    const onFault = vi.fn();

    await runScenario({
      events: scheduled,
      profile,
      wait: async () => undefined,
      onEvent: (event) => {
        delivered.push(event.sequence);
      },
      onFault,
    });

    expect(delivered).toEqual([1]);
    expect(onFault).toHaveBeenCalledWith({
      kind: "simulated-transport-failure",
      sequence: 2,
    });
  });
});
