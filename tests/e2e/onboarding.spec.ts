import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function selectChampion(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Champion workspace" }).click()
  await page.getByRole("option", { name, exact: true }).click()
}

async function makeDraftPaperEligible(page: Page) {
  await page.getByRole("button", { name: "Test Draft", exact: true }).click()
  await page.getByRole("tab", { name: "Problems" }).click()
  await expect(page.getByText("No blocking problems")).toBeVisible()
  await expect(page.getByRole("button", { name: "Review launch" })).toBeVisible()
}

async function launchPaper(page: Page) {
  await page.getByRole("button", { name: "Review launch" }).click()
  const review = page.getByRole("dialog", { name: "Launch Paper V1" })
  await expect(review.getByText("Paper V1 + separate Draft V2")).toBeVisible()
  await review.getByRole("button", { name: "Confirm Paper launch" }).click()
}

test("moves from a structured Draft to immutable Paper and a separate Draft", async ({
  page,
}) => {
  await page.goto("/")

  await expect(
    page.getByRole("heading", { name: "Lower-volatility momentum" }),
  ).toBeVisible()
  await expect(
    page.getByRole("table", { name: "Current structured strategy rules" }),
  ).toBeVisible()

  await makeDraftPaperEligible(page)
  await launchPaper(page)

  await expect(page.getByRole("heading", { name: "Paper V1", exact: true })).toBeVisible()
  await expect(page.getByText("Strategy V1", { exact: true })).toBeVisible()
  await expect(page.getByText("Portfolio vs SPY")).toBeVisible()
  await expect(
    page.getByRole("figure", { name: "Portfolio vs SPY" }).getByText("No completed runs"),
  ).toBeVisible()

  await page.getByRole("tab", { name: "Draft V2" }).click()
  await expect(
    page.getByRole("heading", { name: "Lower-volatility momentum" }),
  ).toBeVisible()
  await expect(page.getByText("V2.0", { exact: true })).toBeVisible()
})

test("keeps a launched Paper strategy immutable while Draft V2 changes", async ({
  page,
}) => {
  await page.goto("/")

  await page.getByRole("button", { name: "Edit Universe rule" }).click()
  const firstEdit = page.getByRole("dialog", { name: "Edit Universe" })
  await firstEdit.getByLabel("Proposed value").fill("30 liquid U.S. large-cap equities")
  await firstEdit.getByLabel("Motivation").fill("Reduce the eligible universe before comparing evidence.")
  await firstEdit.getByRole("button", { name: "Validate and apply" }).click()
  await expect(firstEdit.getByText("Server validated · V1.3")).toBeVisible()
  await firstEdit.getByRole("button", { name: "Close" }).click()

  await makeDraftPaperEligible(page)
  await launchPaper(page)
  await page.getByRole("tab", { name: "Strategy" }).click()
  await expect(page.getByText(/30 liquid U\.S\. large-cap equities/)).toBeVisible()

  await page.getByRole("tab", { name: "Draft V2" }).click()
  await page.getByRole("button", { name: "Edit Universe rule" }).click()
  const secondEdit = page.getByRole("dialog", { name: "Edit Universe" })
  await secondEdit.getByLabel("Proposed value").fill("25 liquid U.S. large-cap equities")
  await secondEdit.getByLabel("Motivation").fill("Explore a narrower candidate set without changing Paper V1.")
  await secondEdit.getByRole("button", { name: "Validate and apply" }).click()
  await expect(secondEdit.getByText("Server validated · V2.1")).toBeVisible()
  await secondEdit.getByRole("button", { name: "Close" }).click()

  await page.getByRole("tab", { name: "Paper V1" }).click()
  await page.getByRole("tab", { name: "Strategy" }).click()
  await expect(page.getByText(/30 liquid U\.S\. large-cap equities/)).toBeVisible()
  await expect(page.getByText(/25 liquid U\.S\. large-cap equities/)).toHaveCount(0)
})

test("keeps the Champion chat docked and contextual across the workspace", async ({
  page,
}) => {
  await page.goto("/")

  const conversation = page.getByRole("complementary", { name: "Atlas conversation" })
  const marketStatus = page.getByRole("status", { name: /Market open/ })
  const bottomPanel = page.getByRole("tablist", { name: "Workspace bottom panel" })
  const composer = conversation.getByRole("textbox", { name: /Message Atlas about/ })
  await expect(conversation).toBeVisible()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(page.getByRole("button", { name: "Collapse bottom panel" })).toHaveCount(0)
  await expect(conversation.getByText("Draft V1 · Summary", { exact: true })).toBeVisible()
  await expect(composer).toHaveAttribute(
    "placeholder",
    "Build or change this strategy with Atlas…"
  )

  await bottomPanel.getByRole("tab", { name: "Problems" }).click()
  await expect(page.getByRole("button", { name: "Collapse bottom panel" })).toBeVisible()
  await page.getByRole("button", { name: "Collapse bottom panel" }).click()
  await expect(page.getByRole("button", { name: "Collapse bottom panel" })).toHaveCount(0)

  await composer.fill("Why is the position cap fifteen percent?")
  await conversation.getByRole("button", { name: "Send" }).click()
  await expect(conversation.getByText("Why is the position cap fifteen percent?")).toBeVisible()
  await expect(conversation.getByText("What should I optimize first?")).toBeVisible()
  await conversation.getByRole("button", { name: "Lower drawdown" }).click()
  await expect(composer).toHaveValue("Lower drawdown")
  await composer.fill("")

  await page.getByRole("button", { name: "Live portfolio" }).click()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(conversation.getByText("Live · Readiness")).toBeVisible()
  await expect(conversation.getByText("Why is the position cap fifteen percent?")).toBeVisible()

  await page.getByRole("button", { name: /Lower-volatility momentum/ }).click()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(conversation.getByText("Draft V1 · Summary", { exact: true })).toBeVisible()
})

test("switches complete Champion sessions without leaking conversation state", async ({
  page,
}) => {
  await page.goto("/")

  const atlasConversation = page.getByRole("complementary", { name: "Atlas conversation" })
  await atlasConversation.getByRole("textbox", { name: /Message Atlas about/ }).fill("Keep this attached to Mara.")
  await atlasConversation.getByRole("button", { name: "Send" }).click()

  await selectChampion(page, "Iris")
  await expect(page.getByRole("heading", { name: "Paper V1", exact: true })).toBeVisible()
  await expect(atlasConversation.getByText("Keep this attached to Mara.")).toHaveCount(0)
  const irisComposer = atlasConversation.getByRole("textbox", { name: /Message Atlas about/ })
  await irisComposer.fill("Keep this unfinished for Iris.")
  await page.getByRole("button", { name: "Live portfolio" }).click()

  await selectChampion(page, "Mara")
  await expect(
    page.getByRole("complementary", { name: "Atlas conversation" }).getByText("Keep this attached to Mara."),
  ).toBeVisible()

  await selectChampion(page, "Iris")
  await expect(irisComposer).toHaveValue("Keep this unfinished for Iris.")
  await expect(atlasConversation.getByText("Live · Readiness")).toBeVisible()
})

test("keeps Datasets and Profile in the persistent sidebar footer", async ({ page }) => {
  await page.goto("/")

  await expect(page.getByRole("button", { name: "Datasets" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Profile" })).toBeVisible()

  await page.getByRole("button", { name: "Datasets" }).click()
  await expect(page.getByRole("tab", { name: "Data", selected: true })).toBeVisible()
  await expect(page.getByRole("cell", { name: "S&P 500 Total Return" })).toBeVisible()

  await page.getByRole("button", { name: "Profile" }).click()
  await expect(page.getByRole("dialog", { name: "Profile" })).toBeVisible()
})

test("opens and forks a historical checkpoint without rewinding history", async ({ page }) => {
  await page.goto("/")

  await page.getByRole("tab", { name: "Checkpoints" }).click()
  const historical = page.getByRole("row", { name: /V1\.1 Previous tested checkpoint/ })
  await historical.getByRole("button", { name: "Open" }).click()
  await page.getByRole("button", { name: "Fork checkpoint" }).click()

  const review = page.getByRole("dialog", { name: "Fork V1.1 into the current Draft?" })
  await expect(review.getByText(/current V1\.2 remains in history/)).toBeVisible()
  await review.getByRole("button", { name: "Create V1.3" }).click()
  await expect(page.getByText("V1.3", { exact: true }).first()).toBeVisible()
})

test("opens each Paper run as a Summary and Activity work surface", async ({ page }) => {
  await page.goto("/")
  await selectChampion(page, "Iris")

  await page.getByRole("button", { name: /Run 6.*Held/ }).click()
  await expect(page.getByRole("heading", { name: "Run 6", exact: true })).toBeVisible()
  await expect(page.getByRole("tab", { name: "Summary", selected: true })).toBeVisible()
  await expect(
    page.getByRole("complementary", { name: "Atlas conversation" }).getByRole("textbox")
  ).toHaveAttribute("placeholder", "Ask Atlas about this run…")

  await page.getByRole("tab", { name: "Activity" }).click()
  await expect(page.getByText("Screened 60 companies")).toBeVisible()
  await page.getByRole("button", { name: "Paper V1 · Runs" }).click()
  await expect(page.getByRole("heading", { name: "Paper V1", exact: true })).toBeVisible()
})

test("shows a gated six-step path to Live value", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "Live portfolio" }).click()

  await expect(page.getByText("Step 1 · Brainstorm with Atlas")).toBeVisible()
  await expect(page.getByText("Step 2 · Draft your strategy")).toBeVisible()
  await expect(page.getByRole("heading", { name: "Dry run the strategy" })).toBeVisible()
  await expect(page.getByText("Step 4 · Promote to paper trading")).toBeVisible()
  await expect(page.getByText("Step 5 · Measure performance")).toBeVisible()
  await expect(page.getByText("Step 6 · Put your money to work")).toBeVisible()

  await page.getByRole("button", { name: "Test Draft V1" }).click()
  await expect(page.getByRole("heading", { name: "Promote to paper trading" })).toBeVisible()
  await expect(page.getByRole("button", { name: "Review Paper launch" })).toBeVisible()
})

test("renders the completed-run portfolio comparison against SPY", async ({ page }) => {
  await page.goto("/")
  await selectChampion(page, "Iris")

  const comparison = page.getByRole("figure", { name: "Portfolio value vs SPY" })
  await expect(comparison).toBeVisible()
  await expect(page.getByText("+3.8%", { exact: true })).toBeVisible()
  await expect(page.getByText("78%", { exact: true })).toBeVisible()
  await expect(page.getByText("2.1%", { exact: true })).toBeVisible()
  await expect(comparison.getByText("SPY", { exact: true })).toBeVisible()
  await expect(
    comparison.locator('[data-chart-engine="lightweight-charts"]'),
  ).toHaveAttribute("data-benchmark-point-count", "6")
  await expect(comparison.getByText(/portfolio minus benchmark was/)).toBeVisible()
})

test("has no automatically detectable accessibility violations", async ({ page }) => {
  await page.goto("/")
  const results = await new AxeBuilder({ page }).analyze()
  expect(results.violations).toEqual([])
})
