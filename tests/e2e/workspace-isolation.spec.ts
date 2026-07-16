import { expect, test } from "./test";

test.describe("Persistence and reset scenario", () => {
  test.use({ scenario: "transient-reset" });

  test("keeps Atlas state Champion-scoped, persists sent exchanges, and resets explicitly", async ({
    page,
    openScenario,
  }) => {
    await openScenario();

    const atlas = page.getByRole("complementary", { name: "Atlas conversation" });
    const message = "Keep this in Mara's transient scenario only.";
    await atlas.getByRole("textbox", { name: /Message Atlas about/ }).fill(message);
    await atlas.getByRole("button", { name: "Send" }).click();
    await expect(atlas.getByText(message, { exact: true })).toBeVisible();

    await page.getByRole("combobox", { name: "Champion workspace" }).click();
    await page.getByRole("option", { name: "Iris", exact: true }).click();
    await expect(page).toHaveURL(/\/champions\/iris\/paper$/);
    await expect(atlas.getByText(message, { exact: true })).toHaveCount(0);
    await expect(
      atlas.getByRole("textbox", { name: /Message Atlas about Paper/ }),
    ).toBeVisible();

    await page.getByRole("combobox", { name: "Champion workspace" }).click();
    await page.getByRole("option", { name: "Mara", exact: true }).click();
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await expect(atlas.getByText(message, { exact: true })).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
    await expect(atlas.getByText(message, { exact: true })).toBeVisible();
    await expect(
      atlas.getByRole("textbox", { name: /Message Atlas about Draft/ }),
    ).toHaveValue("");

    await page.getByRole("button", { name: "Profile" }).click();
    await page.getByRole("button", { name: "Reset local demo data" }).click();
    await page.getByRole("button", { name: "Reset demo data" }).click();
    await expect(atlas.getByText(message, { exact: true })).toHaveCount(0);
    await expect(page).toHaveURL(/\/champions\/mara\/draft$/);
  });
});
