import Dexie, {
  type DexieOptions,
  type Table,
} from "dexie";

import type { WorkspaceDemoRepository, WorkspaceScenarioStorage } from "./ports";
import { WorkspaceAuthorityRepository } from "./repository";
import { createWorkspaceDemoSeed } from "./seed";
import type { WorkspaceRuntime, WorkspaceScenario } from "./types";

const DEFAULT_DATABASE_NAME = "vantheon-workspace-demo-authority";
const SCENARIO_KEY = "active";

interface StoredWorkspaceScenario {
  key: typeof SCENARIO_KEY;
  schemaVersion: string;
  seedVersion: number;
  scenario: WorkspaceScenario;
}

export class WorkspaceDemoDatabase extends Dexie {
  scenarios!: Table<StoredWorkspaceScenario, string>;

  constructor(
    databaseName = DEFAULT_DATABASE_NAME,
    options?: DexieOptions
  ) {
    super(databaseName, options);
    this.version(1).stores({
      scenarios: "&key, schemaVersion, seedVersion",
    });
  }
}

export class DexieWorkspaceScenarioStorage
  implements WorkspaceScenarioStorage
{
  constructor(private readonly database: WorkspaceDemoDatabase) {}

  async initialize(seed: WorkspaceScenario) {
    await this.database.open();
    await this.database.transaction(
      "rw",
      this.database.scenarios,
      async () => {
        const existing = await this.database.scenarios.get(SCENARIO_KEY);
        if (
          !existing ||
          existing.schemaVersion !== seed.schemaVersion ||
          existing.seedVersion !== seed.seedVersion
        ) {
          await this.database.scenarios.put(toStored(seed));
          if (existing) markScenarioReseeded();
        }
      }
    );
  }

  async read() {
    const stored = await this.database.scenarios.get(SCENARIO_KEY);
    if (!stored) {
      throw new Error("Workspace demo storage has not been initialized.");
    }
    return structuredClone(stored.scenario);
  }

  mutate<TResult>(
    mutation: (scenario: WorkspaceScenario) => Promise<TResult>
  ) {
    return this.database.transaction(
      "rw",
      this.database.scenarios,
      async () => {
        const stored = await this.database.scenarios.get(SCENARIO_KEY);
        if (!stored) {
          throw new Error("Workspace demo storage has not been initialized.");
        }
        const working = structuredClone(stored.scenario);
        // Command processing uses Web Crypto for hashes. waitFor keeps the
        // IndexedDB transaction alive while that non-IDB promise resolves.
        const result = await Dexie.waitFor(mutation(working));
        await this.database.scenarios.put(toStored(working));
        return result;
      }
    );
  }

  async reset(seed: WorkspaceScenario) {
    await this.database.scenarios.put(toStored(seed));
  }

  async close() {
    this.database.close();
  }
}

export const WORKSPACE_DEMO_RESEED_NOTICE_KEY =
  "vantheon-workspace-demo-schema-reseeded";

function markScenarioReseeded() {
  try {
    globalThis.sessionStorage?.setItem(WORKSPACE_DEMO_RESEED_NOTICE_KEY, "1");
  } catch {
    // Storage can be blocked in hardened/private browser contexts. Reseeding the
    // domain authority still succeeds; only the one-time notice is unavailable.
  }
}

export async function createBrowserWorkspaceRepository({
  databaseName = DEFAULT_DATABASE_NAME,
  seed,
  runtime,
  indexedDB = globalThis.indexedDB,
  IDBKeyRange = globalThis.IDBKeyRange,
}: {
  databaseName?: string;
  seed?: WorkspaceScenario;
  runtime?: WorkspaceRuntime;
  indexedDB?: IDBFactory;
  IDBKeyRange?: typeof globalThis.IDBKeyRange;
} = {}): Promise<WorkspaceDemoRepository> {
  if (!indexedDB || !IDBKeyRange) {
    throw new Error("Workspace demo authority requires browser IndexedDB.");
  }
  const resolvedSeed = seed ?? (await createWorkspaceDemoSeed());
  const database = new WorkspaceDemoDatabase(databaseName, {
    indexedDB,
    IDBKeyRange,
  });
  const repository = new WorkspaceAuthorityRepository(
    new DexieWorkspaceScenarioStorage(database),
    resolvedSeed,
    runtime
  );
  await repository.initialize();
  return repository;
}

function toStored(scenario: WorkspaceScenario): StoredWorkspaceScenario {
  return {
    key: SCENARIO_KEY,
    schemaVersion: scenario.schemaVersion,
    seedVersion: scenario.seedVersion,
    scenario: structuredClone(scenario),
  };
}
