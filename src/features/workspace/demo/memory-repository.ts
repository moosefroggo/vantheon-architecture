import type { WorkspaceDemoRepository } from "./ports";
import type { WorkspaceScenarioStorage } from "./ports";
import { WorkspaceAuthorityRepository } from "./repository";
import { createWorkspaceDemoSeed } from "./seed";
import type { WorkspaceRuntime, WorkspaceScenario } from "./types";

export class InMemoryWorkspaceScenarioStorage
  implements WorkspaceScenarioStorage
{
  private scenario: WorkspaceScenario | undefined;
  private queue: Promise<void> = Promise.resolve();

  constructor(initialScenario?: WorkspaceScenario) {
    this.scenario = initialScenario
      ? structuredClone(initialScenario)
      : undefined;
  }

  initialize(seed: WorkspaceScenario) {
    return this.exclusive(async () => {
      if (
        !this.scenario ||
        this.scenario.schemaVersion !== seed.schemaVersion ||
        this.scenario.seedVersion !== seed.seedVersion
      ) {
        this.scenario = structuredClone(seed);
      }
    });
  }

  read() {
    return this.exclusive(async () => {
      if (!this.scenario) {
        throw new Error("Workspace demo storage has not been initialized.");
      }
      return structuredClone(this.scenario);
    });
  }

  mutate<TResult>(
    mutation: (scenario: WorkspaceScenario) => Promise<TResult>
  ) {
    return this.exclusive(async () => {
      if (!this.scenario) {
        throw new Error("Workspace demo storage has not been initialized.");
      }
      const working = structuredClone(this.scenario);
      const result = await mutation(working);
      this.scenario = working;
      return result;
    });
  }

  reset(seed: WorkspaceScenario) {
    return this.exclusive(async () => {
      this.scenario = structuredClone(seed);
    });
  }

  async close() {}

  private async exclusive<TResult>(operation: () => Promise<TResult>) {
    const previous = this.queue;
    let release = () => {};
    this.queue = new Promise<void>((resolve) => {
      release = resolve;
    });
    await previous;
    try {
      return await operation();
    } finally {
      release();
    }
  }
}

export async function createInMemoryWorkspaceRepository({
  seed,
  runtime,
  storage,
}: {
  seed?: WorkspaceScenario;
  runtime?: WorkspaceRuntime;
  storage?: InMemoryWorkspaceScenarioStorage;
} = {}): Promise<WorkspaceDemoRepository> {
  const resolvedSeed = seed ?? (await createWorkspaceDemoSeed());
  const resolvedStorage = storage ?? new InMemoryWorkspaceScenarioStorage();
  const repository = new WorkspaceAuthorityRepository(
    resolvedStorage,
    resolvedSeed,
    runtime
  );
  await repository.initialize();
  return repository;
}
