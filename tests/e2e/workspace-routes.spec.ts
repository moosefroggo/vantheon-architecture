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
    await expect(page.getByText("Complete strategy", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(
      /\/champions\/mara\/draft\?view=document&panel=checkpoints$/,
    );
    await expect(page.getByRole("tab", { name: "Document", selected: true })).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Checkpoints", selected: true }),
    ).toBeVisible();
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
      /\/champions\/mara\/draft\/evaluations\/evaluation_mara_v1_2$/,
    );
    await expect(
      page.getByRole("region", {
        name: "Evaluation evaluation_mara_v1_2 details",
      }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Summary", selected: true })).toBeVisible();
    await expect(page.getByRole("status", { name: /Data cutoff/ })).toBeVisible();

    await page.getByRole("tab", { name: "Activity" }).click();
    await expect(page).toHaveURL(/\?tab=activity$/);
    await expect(page.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();
    await page.goBack();
    await expect(page.getByRole("tab", { name: "Summary", selected: true })).toBeVisible();
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
    await expect(
      page.getByRole("heading", { name: "Quality income compounders · Paper 1" }),
    ).toBeVisible();
    await expect(page.getByRole("tab", { name: "Positions", selected: true })).toBeVisible();
    await expect(
      page.getByRole("status", { name: /Portfolio as of Jul 1, 2026/ }),
    ).toBeVisible();

    await page.reload();
    await expect(page.getByRole("tab", { name: "Positions", selected: true })).toBeVisible();
  });

  test("restores a run, Activity tab, and decision identity through history", async ({
    page,
    openScenario,
  }) => {
    await openScenario(
      "/champions/iris/paper/portfolio_iris_income/runs/run_iris_2026_02?tab=activity&decision=decision_iris_run1_pg",
    );

    await expect(page.getByRole("heading", { name: "Run 1", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();
    await expect(page.getByText("Run started", { exact: true })).toBeVisible();
    await expect(page).toHaveURL(/decision=decision_iris_run1_pg$/);

    await page.getByRole("tab", { name: "Summary" }).click();
    await expect(page).toHaveURL(
      /\/champions\/iris\/paper\/portfolio_iris_income\/runs\/run_iris_2026_02\?decision=decision_iris_run1_pg$/,
    );
    await page.goBack();
    await expect(page.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();

    await page.reload();
    await expect(page.getByRole("heading", { name: "Run 1", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Activity", selected: true })).toBeVisible();
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
