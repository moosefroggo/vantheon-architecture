import type { Page } from "@playwright/test";

import { expect, test } from "./test";

async function expectWorkspaceShell(page: Page) {
  await expect(
    page.getByRole("navigation", { name: "Champion workspace navigation" }),
  ).toBeVisible();
  await expect(page.locator("#primary-workspace")).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Atlas conversation" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Skip to workspace" })).toHaveAttribute(
    "href",
    "#primary-workspace",
  );
}

test.describe("Mara Draft scenario", () => {
  test.use({ scenario: "mara-draft" });

  test("redirects the root to a canonical, reloadable workspace shell", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/");

    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await expect(page.getByRole("heading", { name: "Lower-volatility momentum" })).toBeVisible();
    await expect(page.getByRole("status", { name: /Saved locally/ })).toBeVisible();
    await expectWorkspaceShell(page);
    await expect(page.getByRole("tab", { name: "Activity" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.getByRole("tab", { name: "Dry Runs" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.getByRole("tab", { name: /Checkpoints \(\d+\)/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.getByRole("tab", { name: "Datasets" })).toHaveCount(0);

    await page.reload();
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await expect(page.getByRole("heading", { name: "Lower-volatility momentum" })).toBeVisible();
  });

  test("restores URL-owned Draft view and evidence-panel state", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/mara/draft?view=document&panel=checkpoints",
    );

    await expect(page.getByRole("tab", { name: "Document", selected: true })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Checkpoints", selected: true }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Thesis" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Universe and selection" })).toBeVisible();
    await expect(
      page.getByRole("complementary", { name: "Atlas conversation" }).getByText(
        "Drafting · Document",
        { exact: true },
      ),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(
      /\/champions\/mara\/draft\?view=document&panel=checkpoints$/,
    );
    await expect(page.getByRole("tab", { name: "Document", selected: true })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Checkpoints", selected: true }),
    ).toBeVisible();
  });

  test("opens the mirror-backed Datasets catalogue without invented subtabs", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/champions/mara/draft");

    await page.getByRole("button", { name: "Datasets", exact: true }).click();

    await expect(page).toHaveURL(/\/champions\/mara\/draft\/data$/);
    await expect(page.getByRole("region", { name: "Datasets" })).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Datasets" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Research & News" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Prices & Charts" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Options" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Who's Buying & Selling" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Evaluation setup" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Capabilities" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Demo bindings" })).toHaveCount(0);
    await expect(page.getByRole("tab", { name: "Sources" })).toHaveCount(0);
    await expect(
      page.getByRole("complementary", { name: "Atlas conversation" }).getByText(
        "Drafting · Datasets",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Collapse bottom panel" })).toHaveCount(0);
    await expect(page.getByRole("status", { name: /Saved locally/ })).toBeVisible();
  });

  test("keeps immutable Strategy and Paper on the same version", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/champions/mara/paper/portfolio_mara_v9");

    await expect(page.getByText(/^Paper [+-]\d+\.\d% · SPY [+-]\d+\.\d%$/)).toHaveCount(9);
    await expect(page.getByText("V9", { exact: true }).last()).toBeVisible();

    await page.getByRole("tab", { name: "Strategy", exact: true }).click();
    await expect(page).toHaveURL(
      /\/champions\/mara\/draft\/checkpoints\/checkpoint_mara_v9_4$/,
    );
    await expect(page.getByRole("heading", { name: "Balanced factor rotation" })).toBeVisible();

    await page.getByRole("tab", { name: "Paper", exact: true }).click();
    await expect(page).toHaveURL(/\/champions\/mara\/paper\/portfolio_mara_v9$/);
    const deployLive = page.getByRole("button", { name: "Deploy Live" });
    await expect(deployLive).toBeEnabled();
    await deployLive.click();
    await expect(page).toHaveURL(/\/champions\/mara\/live$/);
  });

  test("redirects the current checkpoint to its existing Draft view", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/mara/draft/checkpoints/checkpoint_mara_v10_2",
    );

    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await page.getByRole("tab", { name: /Checkpoints \(2\)/ }).click();
    const currentRow = page.getByRole("row").filter({ hasText: "Active Draft" });
    await expect(currentRow.getByText("Current", { exact: true })).toBeVisible();
    await expect(currentRow.getByRole("button", { name: "Open" })).toHaveCount(0);
  });

  test("exposes the Live readiness route and context status without a market badge", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/champions/mara/live");

    await expect(page).toHaveURL(/\/champions\/mara\/live$/);
    await expect(
      page.getByRole("status", { name: "Live policy not configured" }),
    ).toBeVisible();
    await expect(page.getByRole("status", { name: /Market (open|closed)/i })).toHaveCount(0);
    await expect(
      page.getByRole("complementary", { name: "Atlas conversation" }).getByText(
        "Live · Readiness",
        { exact: true },
      ),
    ).toBeVisible();
  });
});

test.describe("Mara evaluated scenario", () => {
  test.use({ scenario: "mara-evaluated" });

  test("gives a completed evaluation a canonical Summary/Activity route", async ({
    page,
    openScenario,
  }) => {
    await openScenario();

    await expect(page).toHaveURL(
      /\/champions\/mara\/draft\/evaluations\/evaluation_mara_v10_2$/,
    );
    const dryRun = page.getByRole("region", { name: "Dry Run 1 details" });
    await expect(dryRun).toBeVisible();
    await expect(page.getByRole("tab", { name: "Drafting", selected: true })).toBeVisible();
    const navigation = page.getByRole("navigation", {
      name: "Champion workspace navigation",
    });
    await expect(
      navigation.getByRole("button", {
        name: /Lower-volatility momentum.*Draft.*Checkpoint 2/,
      }),
    ).toContainText("V10");
    await expect(
      navigation.getByRole("button", {
        name: /Balanced factor rotation.*Paper.*vs SPY/,
      }),
    ).toContainText("V9");
    const evaluationBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(
      evaluationBreadcrumb.getByRole("button", { name: "Drafting" }),
    ).toBeVisible();
    await expect(
      evaluationBreadcrumb.getByRole("button", { name: "Dry Runs" }),
    ).toBeVisible();
    await expect(dryRun.getByRole("tab", { name: "Summary", selected: true })).toBeVisible();
    await expect(page.getByRole("status", { name: /Data cutoff/ })).toBeVisible();

    await dryRun.getByRole("tab", { name: "Activity" }).click();
    await expect(page).toHaveURL(/\?tab=activity$/);
    await expect(dryRun.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();
    await page.goBack();
    await expect(dryRun.getByRole("tab", { name: "Summary", selected: true })).toBeVisible();
  });

  test("keeps zero-run Paper chart modes visible with SPY from launch", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/champions/mara/paper/portfolio_mara_v9");

    await expect(page.getByRole("heading", { name: "Balanced factor rotation" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Value", pressed: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Performance vs SPY" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Drawdown" })).toBeVisible();
    await expect(page.getByText(/Paper remains flat from launch; SPY continues/)).toBeVisible();
    await expect(page.getByRole("img", { name: "Account value history" })).toBeVisible();

    await page.getByRole("button", { name: "Performance vs SPY" }).click();
    await expect(page.getByRole("img", { name: "Performance versus SPY history" })).toBeVisible();
  });
});

test.describe("Iris Paper scenario", () => {
  test.use({ scenario: "iris-paper" });

  test("deep-links to a portfolio and restores route-owned panel state", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/iris/paper/portfolio_iris_income?tab=positions",
    );

    await expect(page).toHaveURL(
      /\/champions\/iris\/paper\/portfolio_iris_income\?tab=positions$/,
    );
    await expect(page.getByRole("heading", { name: "Portfolio" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Positions", selected: true })).toBeVisible();
    await expect(page.getByRole("status", { name: /Portfolio as of/i })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("tab", { name: "Positions", selected: true })).toBeVisible();
  });

  test("restores recorded run evidence and activity", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/iris/paper/portfolio_iris_income/runs/run_iris_2026_02?tab=activity&decision=decision_iris_run1_pg",
    );

    await expect(page.getByRole("heading", { name: "Run 1", exact: true })).toBeVisible();
    await expect(page.getByText(/Completed Feb 2, 2026/)).toBeVisible();
    await expect(page).toHaveURL(/decision=decision_iris_run1_pg$/);
    await expect(page.getByRole("tab", { name: "Paper", selected: true })).toBeVisible();
    const runBreadcrumb = page.getByRole("navigation", { name: "breadcrumb" });
    await expect(runBreadcrumb.getByRole("button", { name: "Paper" })).toBeVisible();
    await expect(runBreadcrumb.getByRole("button", { name: "Runs" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Run activity" })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Run 1", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Run activity" })).toBeVisible();
  });
});

test.describe("Invalid resource scenario", () => {
  test.use({ scenario: "invalid-resource" });

  test("does not disclose or substitute another Champion for an unknown ID", async ({
    page,
    openScenario,
  }) => {
    await openScenario();

    await expect(page.getByRole("heading", { name: "Champion unavailable" })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Lower-volatility momentum" }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("navigation", { name: "Champion workspace navigation" }),
    ).toBeVisible();
  });

  test("renders an unavailable state for an unknown Paper portfolio", async ({
    page,
    openScenario,
  }) => {
    await openScenario("/champions/iris/paper/missing-portfolio");

    await expect(
      page.getByRole("heading", { name: "Paper resource unavailable" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /Paper 1/ })).toHaveCount(0);
  });

  test("does not silently replace unknown nested resource IDs", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/iris/paper/portfolio_iris_income/runs/missing-run",
    );

    await expect(page.getByRole("heading", { name: /unavailable/i })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Quality income compounders · Paper 1" }),
    ).toHaveCount(0);
  });
});
