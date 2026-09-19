import { expect, test, type Page } from "@playwright/test";

// Build 03: the run lifecycle against the mock event scripts (a full run takes ~7.5 s).

const RUN_MS = 15_000;

const panel = (page: Page) => page.getByRole("complementary", { name: "Input" });
const strip = (page: Page) => page.getByRole("list", { name: "Run progress" });
const step = (page: Page, n: number) => strip(page).getByRole("listitem").nth(n);
const signOff = (page: Page) => page.getByRole("button", { name: "Sign off" });

/** Loads the example (which starts the PS80 run), then reruns with another excipient. */
async function runWith(page: Page, excipient: string) {
  await page.getByRole("button", { name: /Load example/ }).click();
  await expect(page.getByText(/^Single screen · RUN-/)).toBeVisible();
  await panel(page).getByRole("textbox", { name: "Name, CAS or SMILES" }).fill(excipient);
  await panel(page).getByRole("button", { name: "Run screen" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`${excipient} × 1N8Z Fab`);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Recent runs", exact: true })).toBeVisible();
});

test("S04: Load example runs through every step to complete", async ({ page }) => {
  await page.getByRole("button", { name: /Load example/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Polysorbate 80 × 1N8Z Fab");
  await expect(page.getByText(/Filling in as steps complete · step \d of 4/)).toBeVisible();
  await expect(signOff(page)).toBeDisabled();

  await expect(step(page, 0)).toContainText("Polysorbate 80 · CAS 9005-65-6", { timeout: RUN_MS });
  await expect(step(page, 1)).toContainText("6 sources", { timeout: RUN_MS });
  await expect(step(page, 3)).toContainText("4 sites on 1N8Z", { timeout: RUN_MS });
  await expect(page.getByText("No overall score · each endpoint stands alone")).toBeVisible();
  await expect(signOff(page)).toBeEnabled();
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeEnabled();
  await expect(page).toHaveURL("/");
});

test("S05: an unresolved identity pauses the run; an override resumes it at Precedent", async ({
  page,
}) => {
  await runWith(page, "Tween 80 HP-K");
  const card = page.getByRole("region", { name: "Identity unresolved" });
  await expect(card).toBeVisible({ timeout: RUN_MS });
  await expect(step(page, 0)).toContainText("Needs your input");
  for (const n of [1, 2, 3]) await expect(step(page, n)).toContainText("Waiting");
  await expect(card.getByRole("radio")).toHaveCount(2);
  await expect(signOff(page)).toBeDisabled();

  // Paused, not failed: it stays waiting rather than timing out.
  await page.waitForTimeout(2_000);
  await expect(card).toBeVisible();

  const override = card.getByRole("textbox", { name: "Manual override (CAS or SMILES)" });
  await override.fill("not a cas");
  await card.getByRole("button", { name: "Use and continue" }).click();
  await expect(card.getByRole("alert")).toContainText("Enter a CAS number");

  await override.fill("9005-65-6");
  await card.getByRole("button", { name: "Use and continue" }).click();
  await expect(card).toBeHidden();
  await expect(strip(page)).toBeFocused();
  await expect(step(page, 0)).toContainText("Override · CAS 9005-65-6");
  await expect(step(page, 1)).toContainText("Running");
  await expect(page.getByText("No overall score · each endpoint stands alone")).toBeVisible({
    timeout: RUN_MS,
  });
  await expect(signOff(page)).toBeEnabled();
});

test("S06: a failed step shows the banner; retry keeps completed steps", async ({ page }) => {
  await runWith(page, "Polysorbate 20");
  const banner = page.getByRole("alert").filter({ hasText: "Hazard step failed" });
  await expect(banner).toBeVisible({ timeout: RUN_MS });
  await expect(banner).toContainText("PubChem hazard lookup timed out (HTTP 504, 3 attempts)");
  await expect(banner).toContainText("Precedent results below are complete.");
  await expect(step(page, 2)).toContainText("Failed · HTTP 504");
  await expect(page.getByText("Precedent endpoints only · hazard step failed")).toBeVisible();
  await expect(signOff(page)).toBeDisabled();
  await expect(page.getByRole("button", { name: "Export PDF" })).toBeEnabled();

  await banner.getByRole("button", { name: "Retry hazard step" }).click();
  await expect(banner).toBeHidden();
  // Focus doesn't fall to the page when the banner goes.
  await expect(strip(page)).toBeFocused();
  // Only the failed step runs again; Identity and Precedent stay done.
  await expect(step(page, 2)).toContainText("Running");
  await expect(step(page, 0)).toContainText("Polysorbate 20 · CAS");
  await expect(step(page, 1)).toContainText("Done: Complete");
  await expect(page.getByText("No overall score · each endpoint stands alone")).toBeVisible({
    timeout: RUN_MS,
  });
  await expect(signOff(page)).toBeEnabled();
});

test("dev switcher jumps to S05", async ({ page }) => {
  await page.getByRole("button", { name: "S05: Identity unresolved" }).click();
  await expect(page.getByRole("region", { name: "Identity unresolved" })).toBeVisible({
    timeout: RUN_MS,
  });
  await expect(panel(page).getByRole("textbox", { name: "Name, CAS or SMILES" })).toHaveValue(
    "Tween 80 HP-K",
  );
});

test.describe("tablet", () => {
  test.use({ viewport: { width: 1024, height: 768 } });

  test("the input panel collapses once a run completes", async ({ page }) => {
    await page.getByRole("button", { name: /Load example/ }).click();
    await expect(page.getByRole("button", { name: "Collapse input panel" })).toBeVisible();
    await expect(page.getByText("No overall score · each endpoint stands alone")).toBeVisible({
      timeout: RUN_MS,
    });
    await expect(page.getByRole("button", { name: "Expand input panel" })).toBeVisible();
  });
});
