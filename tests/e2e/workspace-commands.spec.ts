import type { Page } from "@playwright/test";

import { expect, test } from "./test";

type AuthoritySnapshot = {
  champions: Record<
    string,
    { id: string; displayName: string; currentDraftId: string }
  >;
  drafts: Record<
    string,
    {
      id: string;
      championId: string;
      currentCheckpointId: string;
      generation: number;
      status: string;
    }
  >;
  strategies: Record<
    string,
    {
      id: string;
      championId: string;
      version: number;
    }
  >;
  checkpoints: Record<
    string,
    {
      id: string;
      championId: string;
      draftId: string;
      label: string;
      origin: { kind: string; changeSetId?: string };
      strategy: {
        sections: Array<{
          rules: Array<{ label: string; value: string }>;
        }>;
      };
    }
  >;
  changeSets: Record<
    string,
    {
      id: string;
      championId: string;
      status: string;
      resultCheckpointId?: string;
    }
  >;
  evaluations: Record<
    string,
    {
      id: string;
      championId: string;
      checkpointId: string;
      status: string;
    }
  >;
  portfolios: Record<
    string,
    {
      id: string;
      championId: string;
      displayName: string;
      state: string;
      sourceCheckpointId: string;
    }
  >;
  receipts: Record<
    string,
    {
      id: string;
      commandType: string;
      outcome: string;
      result?: { kind: string };
    }
  >;
  atlasExchanges: Record<
    string,
    {
      id: string;
      championId: string;
      userText: string;
      status: string;
    }
  >;
};

test.describe("Mara command authority", () => {
  test.use({ scenario: "mara-draft" });

  test("rejects an attached Atlas semantic proposal without creating a checkpoint", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);
    const maraId = championIdFor(before, "Mara");
    const checkpointCount = recordsForChampion(before.checkpoints, maraId).length;

    const changeSetId = await proposeRuleChange(
      page,
      "Selection",
      "Change this to top decile by 12-month momentum",
    );

    await expect(page.getByRole("heading", { name: "Strategy change proposal" })).toBeVisible();
    const delta = page.getByRole("row").filter({ hasText: "Momentum rank" });
    await expect(delta).toContainText("Top quartile by 6-month momentum");
    await expect(delta).toContainText("top decile by 12-month momentum");

    const proposed = await readAuthority(page);
    expect(proposed.changeSets[changeSetId]).toMatchObject({
      championId: maraId,
      status: "proposed",
    });
    expect(recordsForChampion(proposed.checkpoints, maraId)).toHaveLength(
      checkpointCount,
    );
    expect(recordsForChampion(proposed.atlasExchanges, maraId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          userText: "Change this to top decile by 12-month momentum",
          status: "completed",
        }),
      ]),
    );

    await page.getByRole("button", { name: "Reject", exact: true }).click();
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);

    const rejected = await readAuthority(page);
    expect(rejected.changeSets[changeSetId]?.status).toBe("rejected");
    expect(recordsForChampion(rejected.checkpoints, maraId)).toHaveLength(
      checkpointCount,
    );
    expectAppliedReceipts(rejected, "reject", 1, "change-set-rejected");
  });

  test("attaches Fork strategy to Atlas without creating a version", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);

    await page.getByRole("button", { name: "Fork strategy" }).click();
    const atlas = page.getByRole("complementary", { name: "Atlas conversation" });
    await expect(atlas.getByText("Strategy V9 · Balanced factor rotation", { exact: true })).toBeVisible();
    await expect(atlas.getByText(/What would you like to change/)).toBeVisible();

    const after = await readAuthority(page);
    expect(Object.keys(after.strategies)).toEqual(Object.keys(before.strategies));
    expect(Object.keys(after.drafts)).toEqual(Object.keys(before.drafts));
  });

  test("accepts one proposal into exactly one reload-persistent checkpoint", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);
    const maraId = championIdFor(before, "Mara");
    const checkpointCount = recordsForChampion(before.checkpoints, maraId).length;

    const changeSetId = await proposeRuleChange(
      page,
      "Portfolio",
      "Set this to equal weight with 8 positions maximum",
    );

    await page.getByRole("button", { name: "Accept and checkpoint" }).click();
    await expect(page).toHaveURL(
      /\/champions\/mara\/draft\/checkpoints\/draft_checkpoint_[^/?]+$/,
    );
    await expect(
      page.getByRole("heading", { name: "Strategy V10 · Checkpoint 3" }),
    ).toBeVisible();

    const checkpointId = decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
    expect(checkpointId).toMatch(/^draft_checkpoint_/);

    const accepted = await readAuthority(page);
    const acceptedChangeSet = accepted.changeSets[changeSetId];
    expect(acceptedChangeSet).toMatchObject({
      championId: maraId,
      status: "accepted",
      resultCheckpointId: checkpointId,
    });
    expect(recordsForChampion(accepted.checkpoints, maraId)).toHaveLength(
      checkpointCount + 1,
    );
    expect(
      recordsForChampion(accepted.checkpoints, maraId).filter(
        (checkpoint) =>
          checkpoint.origin.kind === "accepted-change-set" &&
          checkpoint.origin.changeSetId === changeSetId,
      ),
    ).toHaveLength(1);
    expect(
      Object.values(accepted.drafts).find(
        (draft) => draft.id === accepted.champions[maraId]?.currentDraftId,
      )?.currentCheckpointId,
    ).toBe(checkpointId);
    expect(
      accepted.checkpoints[checkpointId]?.strategy.sections
        .flatMap((section) => section.rules)
        .find((rule) => rule.label === "Position sizing")?.value,
    ).toBe("equal weight with 8 positions maximum");
    expectAppliedReceipts(accepted, "accept", 1, "change-set-accepted");

    await page.reload();
    await expect(page).toHaveURL(
      new RegExp(`/champions/mara/draft/checkpoints/${checkpointId}$`),
    );
    await expect(
      page.getByRole("heading", { name: "Strategy V10 · Checkpoint 3" }),
    ).toBeVisible();
    const reloaded = await readAuthority(page);
    expect(recordsForChampion(reloaded.checkpoints, maraId)).toHaveLength(
      checkpointCount + 1,
    );
    expect(reloaded.changeSets[changeSetId]?.resultCheckpointId).toBe(checkpointId);
  });

  test("runs the locked preflight repeatedly with unique normalized Evaluation IDs", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);
    const maraId = championIdFor(before, "Mara");
    const evaluationCount = recordsForChampion(before.evaluations, maraId).length;
    const evaluationIds: string[] = [];

    for (let run = 0; run < 2; run += 1) {
      await page.getByRole("button", { name: "Dry Run", exact: true }).click();
      const preflight = page.getByRole("dialog", {
        name: "Locked Evaluation preflight",
      });
      await expect(preflight).toBeVisible();
      await expect(preflight).toContainText("Checkpoint");
      await expect(preflight).toContainText("Content hash");
      await expect(preflight).toContainText("Universe");
      await expect(preflight).toContainText("Benchmark");
      await expect(preflight).toContainText("Window");
      await expect(preflight).toContainText("Costs / fills");
      await expect(preflight).toContainText("Schedule / timezone");
      await expect(preflight).toContainText("Data cutoff");
      await expect(preflight).toContainText("Deterministic demo");
      await expect(preflight.getByRole("textbox")).toHaveCount(0);
      await expect(preflight.getByRole("combobox")).toHaveCount(0);
      await expect(preflight.getByRole("spinbutton")).toHaveCount(0);

      await preflight.getByRole("button", { name: "Run Evaluation" }).click();
      await expect(page).toHaveURL(
        /\/champions\/mara\/draft\/evaluations\/evaluation_[^/?]+$/,
      );
      const evaluationId = decodeURIComponent(
        new URL(page.url()).pathname.split("/").at(-1)!,
      );
      expect(evaluationId).toMatch(/^evaluation_/);
      evaluationIds.push(evaluationId);
      await expect(
        page.getByRole("region", {
          name: `Dry Run ${evaluationCount + run + 1} details`,
        }),
      ).toBeVisible();

      if (run === 0) {
        await page.goto("/champions/mara/draft");
        await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
      }
    }

    expect(new Set(evaluationIds).size).toBe(2);
    const after = await readAuthority(page);
    expect(recordsForChampion(after.evaluations, maraId)).toHaveLength(
      evaluationCount + 2,
    );
    for (const evaluationId of evaluationIds) {
      expect(after.evaluations[evaluationId]).toMatchObject({
        championId: maraId,
        status: "completed",
      });
    }
    expectAppliedReceipts(after, "evaluate", 2, "evaluation-completed");
  });

  test("launches one Paper and opens the next Draft version", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);
    const maraId = championIdFor(before, "Mara");

    await reviewAndConfirmPaperLaunch(page, "evaluation_mara_v10_2");
    await expect(page).toHaveURL(
      /\/champions\/mara\/paper\/paper_portfolio_[^/?]+$/,
    );
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await page.getByRole("tab", { name: "Strategy" }).click();
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await expect(
      page
        .getByRole("navigation", { name: "Champion workspace navigation" })
        .getByRole("button", {
          name: /Lower-volatility momentum.*Draft.*Checkpoint 1/,
        }),
    ).toBeVisible();
    await expect(page.getByText("Read only", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Dry Run", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Edit .* rule$/ })).toHaveCount(6);

    const launched = await readAuthority(page);
    const maraPortfolios = recordsForChampion(launched.portfolios, maraId);
    expect(maraPortfolios).toHaveLength(10);
    expect(maraPortfolios.filter((portfolio) => portfolio.state === "active")).toHaveLength(2);
    expect(recordsForChampion(launched.drafts, maraId)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ generation: 10, status: "launched" }),
        expect.objectContaining({ generation: 11, status: "active" }),
      ]),
    );
    expectAppliedReceipts(launched, "launch", 1, "paper-launched");

    const response = await page.goto("/champions/mara/paper");
    expect(response?.ok()).toBe(true);
    await expect(page).toHaveURL(/\/champions\/mara\/paper$/);
    await expect(page.getByRole("heading", { name: "Paper portfolios" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Compare two" })).toHaveCount(0);
  });
});

test.describe("Iris Paper mirror boundary", () => {
  test.use({ scenario: "iris-paper" });

  test("does not expose lifecycle controls absent from the captured Paper surface", async ({
    page,
    openScenario,
  }) => {
    await openScenario();
    const before = await readAuthority(page);
    const irisId = championIdFor(before, "Iris");
    const portfolio = recordsForChampion(before.portfolios, irisId)[0];
    expect(portfolio?.id).toBe("portfolio_iris_income");
    expect(portfolio?.state).toBe("active");
    await expect(page.getByRole("button", { name: "Stop", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Archive", exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Unarchive", exact: true })).toHaveCount(0);
    expect((await readAuthority(page)).portfolios[portfolio.id]?.state).toBe("active");
  });
});

async function proposeRuleChange(page: Page, section: string, request: string) {
  await page.getByRole("button", { name: `Edit ${section} rule` }).click();
  const atlas = page.getByRole("complementary", { name: "Atlas conversation" });
  await expect(atlas.getByText("Selected", { exact: true })).toBeVisible();
  const composer = atlas.getByRole("textbox", {
    name: new RegExp(`Message Atlas about ${section} ·`),
  });
  await composer.fill(request);
  await atlas.getByRole("button", { name: "Send" }).click();
  await expect(page).toHaveURL(
    /\/champions\/mara\/draft\/changes\/change_set_[^/?]+$/,
  );
  return decodeURIComponent(new URL(page.url()).pathname.split("/").at(-1)!);
}

async function reviewAndConfirmPaperLaunch(page: Page, evaluationId: string) {
  const atlas = page.getByRole("complementary", { name: "Atlas conversation" });
  await atlas.getByRole("button", { name: "Review launch" }).click();
  const dialog = page.getByRole("dialog", { name: "Launch Paper" });
  await expect(dialog).toContainText(evaluationId);
  await expect(dialog).toContainText("Simulated capital only");
  await dialog.getByRole("button", { name: "Confirm Paper launch" }).click();
}

function recordsForChampion<T extends { championId: string }>(
  table: Record<string, T>,
  championId: string,
) {
  return Object.values(table).filter((record) => record.championId === championId);
}

function championIdFor(snapshot: AuthoritySnapshot, displayName: string) {
  const champion = Object.values(snapshot.champions).find(
    (candidate) => candidate.displayName === displayName,
  );
  expect(champion, `Expected normalized Champion ${displayName}`).toBeDefined();
  return champion!.id;
}

function expectAppliedReceipts(
  snapshot: AuthoritySnapshot,
  commandType: string,
  count: number,
  resultKind: string,
) {
  const receipts = Object.values(snapshot.receipts).filter(
    (receipt) => receipt.commandType === commandType,
  );
  expect(receipts).toHaveLength(count);
  for (const receipt of receipts) {
    expect(receipt).toMatchObject({
      outcome: "applied",
      result: { kind: resultKind },
    });
  }
}

async function readAuthority(page: Page): Promise<AuthoritySnapshot> {
  return page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("vantheon-workspace-demo-authority");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    try {
      return await new Promise<AuthoritySnapshot>((resolve, reject) => {
        const transaction = database.transaction("scenarios", "readonly");
        const request = transaction.objectStore("scenarios").get("active");
        request.onsuccess = () => {
          const scenario = (request.result as { scenario?: AuthoritySnapshot } | undefined)
            ?.scenario;
          if (scenario) resolve(scenario);
          else reject(new Error("The normalized demo authority has no active scenario."));
        };
        request.onerror = () => reject(request.error);
      });
    } finally {
      database.close();
    }
  });
}
