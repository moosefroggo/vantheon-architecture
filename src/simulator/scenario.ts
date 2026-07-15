export type SimulatorChannel =
  | "market"
  | "portfolio"
  | "champion"
  | "risk"
  | "command-result";

export type ScenarioEvent<TPayload = unknown> = {
  id: string;
  sequence: number;
  logicalAtMs: number;
  channel: SimulatorChannel;
  type: string;
  payload: TPayload;
};

export type ScheduledScenarioEvent<TPayload = unknown> =
  ScenarioEvent<TPayload> & {
    deliveryAtMs: number;
    simulatedLatencyMs: number;
  };

export type ScenarioProfile = {
  seed: number;
  baseLatencyMs: number;
  jitterMs: number;
  failAtSequence?: number;
};

export type ScenarioFault = {
  kind: "simulated-transport-failure";
  sequence: number;
};

type RunScenarioOptions<TPayload> = {
  events: readonly ScheduledScenarioEvent<TPayload>[];
  profile: ScenarioProfile;
  wait: (durationMs: number) => Promise<void>;
  onEvent: (event: ScheduledScenarioEvent<TPayload>) => void | Promise<void>;
  onFault?: (fault: ScenarioFault) => void | Promise<void>;
};

function createRandom(seed: number) {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function scheduleScenario<TPayload>(
  events: readonly ScenarioEvent<TPayload>[],
  profile: ScenarioProfile,
): ScheduledScenarioEvent<TPayload>[] {
  const random = createRandom(profile.seed);

  return [...events]
    .sort((left, right) => left.sequence - right.sequence)
    .map((event) => {
      const signedJitter = (random() * 2 - 1) * profile.jitterMs;
      const simulatedLatencyMs = Math.max(
        0,
        Math.round(profile.baseLatencyMs + signedJitter),
      );

      return {
        ...event,
        deliveryAtMs: event.logicalAtMs + simulatedLatencyMs,
        simulatedLatencyMs,
      };
    });
}

export async function runScenario<TPayload>({
  events,
  profile,
  wait,
  onEvent,
  onFault,
}: RunScenarioOptions<TPayload>) {
  let elapsedMs = 0;

  for (const event of events) {
    if (profile.failAtSequence === event.sequence) {
      await onFault?.({
        kind: "simulated-transport-failure",
        sequence: event.sequence,
      });
      return;
    }

    const waitMs = Math.max(0, event.deliveryAtMs - elapsedMs);
    await wait(waitMs);
    elapsedMs = Math.max(elapsedMs, event.deliveryAtMs);
    await onEvent(event);
  }
}
