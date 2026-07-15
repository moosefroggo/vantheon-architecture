import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function selectChampion(page: Page, name: string) {
  await page.getByRole("combobox", { name: "Champion workspace" }).click()
  await page.getByRole("option", { name, exact: true }).click()
}

async function makeDraftPaperEligible(page: Page) {
  await page.getByRole("button", { name: "Test Draft", exact: true }).click()
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

  const conversation = page.getByRole("complementary", { name: "Mara conversation" })
  const marketStatus = page.getByRole("status", { name: /Market open/ })
  const bottomPanel = page.getByRole("tablist", { name: "Workspace bottom panel" })
  const composer = conversation.getByRole("textbox", { name: /Message Mara about/ })
  await expect(conversation).toBeVisible()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(conversation.getByText("Draft V1 · Strategy", { exact: true })).toBeVisible()

  await composer.fill("Why is the position cap fifteen percent?")
  await conversation.getByRole("button", { name: "Send" }).click()
  await expect(conversation.getByText("Why is the position cap fifteen percent?")).toBeVisible()

  await page.getByRole("button", { name: "Live portfolio" }).click()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(conversation.getByText("Live · Readiness")).toBeVisible()
  await expect(conversation.getByText("Why is the position cap fifteen percent?")).toBeVisible()

  await page.getByRole("button", { name: /Lower-volatility momentum/ }).click()
  await expect(marketStatus).toBeVisible()
  await expect(bottomPanel).toBeVisible()
  await expect(conversation.getByText("Draft V1 · Strategy", { exact: true })).toBeVisible()
})

test("switches complete Champion sessions without leaking conversation state", async ({
  page,
}) => {
  await page.goto("/")

  const maraConversation = page.getByRole("complementary", { name: "Mara conversation" })
  await maraConversation.getByRole("textbox", { name: /Message Mara about/ }).fill("Keep this attached to Mara.")
  await maraConversation.getByRole("button", { name: "Send" }).click()

  await selectChampion(page, "Iris")
  await expect(page.getByRole("heading", { name: "Paper V1", exact: true })).toBeVisible()
  const irisConversation = page.getByRole("complementary", { name: "Iris conversation" })
  await expect(irisConversation.getByText("Keep this attached to Mara.")).toHaveCount(0)
  const irisComposer = irisConversation.getByRole("textbox", { name: /Message Iris about/ })
  await irisComposer.fill("Keep this unfinished for Iris.")
  await page.getByRole("button", { name: "Live portfolio" }).click()

  await selectChampion(page, "Mara")
  await expect(
    page.getByRole("complementary", { name: "Mara conversation" }).getByText("Keep this attached to Mara."),
  ).toBeVisible()

  await selectChampion(page, "Iris")
  await expect(irisComposer).toHaveValue("Keep this unfinished for Iris.")
  await expect(irisConversation.getByText("Live · Readiness")).toBeVisible()
})

test("renders the completed-run portfolio comparison against SPY", async ({ page }) => {
  await page.goto("/")
  await selectChampion(page, "Iris")

  const comparison = page.getByRole("figure", { name: "Portfolio value vs SPY" })
  await expect(comparison).toBeVisible()
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
