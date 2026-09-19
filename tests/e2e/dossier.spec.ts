import { expect, test, type Page } from "@playwright/test";

// Build 04: the verdict matrix against the endpoint fixtures (a full mock run takes ~7.5 s).

const RUN_MS = 15_000;

const panel = (page: Page) => page.getByRole("complementary", { name: "Input" });
const matrix = (page: Page) => page.getByRole("region", { name: "Verdict matrix" });
const counts = (page: Page) => page.getByRole("list", { name: "Endpoints per verdict" });
const row = (page: Page, name: string | RegExp) =>
  matrix(page)
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name }) });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Recent runs", exact: true })).toBeVisible();
});

test("S07: a complete PS80 run shows the verdict matrix with sources and grades", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Load example/ }).click();
  // The skeleton shares the "Verdict matrix" name; wait for the counts, which only the real one has.
  await expect(counts(page)).toBeVisible({ timeout: RUN_MS });
  await expect(matrix(page)).toContainText("No overall score · each endpoint stands alone");
  await expect(counts(page).getByRole("listitem")).toHaveText([
    "3 Precedented",
    "2 Supported without precedent",
    "2 Data gap: test",
    "1 Alert: avoid",
  ]);
  await expect(matrix(page).getByRole("rowheader")).toHaveCount(8);
  await expect(row(page, /Peroxide impurities/)).toContainText("Alert: avoid");
  await expect(row(page, /Hydrolysis/)).toContainText("Out of domain:");

  // Expand a row for its sources.
  const toggle = page.getByRole("button", { name: /Sources for Peroxide impurities/ });
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(matrix(page)).toContainText("Sources (3)");
  await expect(matrix(page)).toContainText("Kishore et al. Degradation of polysorbates 20 and 80");

  // Grade legend on hover and on keyboard focus.
  const grade = row(page, /Regulatory precedent/).getByRole("button", { name: "Evidence grade A" });
  await grade.hover();
  await expect(page.getByRole("tooltip").filter({ visible: true })).toContainText(
    "Regulatory precedent at this route and level",
  );
  await page.mouse.move(0, 0);
  await grade.focus();
  await expect(page.getByRole("tooltip").filter({ visible: true })).toContainText(
    "In-domain prediction",
  );
  // The word "safe" appears nowhere (the footer says "safety", which is a different word).
  await expect(page.getByText(/\bsafe\b/i)).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign off" })).toBeEnabled();
});

test("S15: ALX-117 is novel for SC: banner shown and every endpoint a data gap", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Load example/ }).click();
  await expect(page.getByText(/^Single screen · RUN-/)).toBeVisible();
  await panel(page).getByRole("textbox", { name: "Name, CAS or SMILES" }).fill("ALX-117");
  await panel(page).getByRole("button", { name: "Run screen" }).click();

  const banner = page.getByRole("region", { name: "Needs a nonclinical package" });
  await expect(banner).toBeVisible({ timeout: RUN_MS });
  await expect(banner).toContainText("ALX-117 has no precedent for the SC route.");
  await expect(page.getByRole("list", { name: "Run progress" })).toContainText(
    "No precedent found",
  );
  await expect(counts(page).getByRole("listitem")).toHaveText([
    "0 Precedented",
    "0 Supported without precedent",
    "8 Data gap: test",
    "0 Alert: avoid",
  ]);
  const table = matrix(page).getByRole("table");
  await expect(table.getByText("Data gap: test")).toHaveCount(8);
  await expect(table.getByText("Precedented", { exact: true })).toHaveCount(0);
  await expect(table.getByText("Out of domain:")).toHaveCount(2);
});

test("S06: after a hazard failure only the precedent endpoints are shown", async ({ page }) => {
  await page.getByRole("button", { name: "S06: Step error" }).click();
  await expect(counts(page)).toBeVisible({ timeout: RUN_MS });
  await expect(matrix(page)).toContainText("Precedent endpoints only · hazard step failed");
  await expect(matrix(page).getByRole("rowheader")).toHaveText([
    /Regulatory precedent/,
    /Local tolerance and systemic toxicity/,
    /Residual ethylene oxide and 1,4-dioxane/,
  ]);
  await expect(page.getByRole("button", { name: "Sign off" })).toBeDisabled();

  await page.getByRole("button", { name: "Retry hazard step" }).click();
  await expect(matrix(page).getByRole("rowheader")).toHaveCount(8, { timeout: RUN_MS });
});

test("an excipient without an endpoint fixture shows a placeholder row, not verdicts", async ({
  page,
}) => {
  await page.getByRole("button", { name: /Load example/ }).click();
  await expect(page.getByText(/^Single screen · RUN-/)).toBeVisible();
  await panel(page).getByRole("textbox", { name: "Name, CAS or SMILES" }).fill("Polysorbate 20");
  await panel(page).getByRole("button", { name: "Run screen" }).click();
  await expect(page.getByText("No endpoint fixture for this excipient [PLACEHOLDER]")).toBeVisible({
    timeout: RUN_MS,
  });
  await expect(matrix(page).getByRole("rowheader")).toHaveCount(0);
});

test("the PS80 run in Recent runs opens with its verdict matrix", async ({ page }) => {
  await page.getByRole("button", { name: "Recent runs", exact: true }).click();
  await page.getByRole("menuitem", { name: /Polysorbate 80 × 1N8Z Fab/ }).click();
  await expect(matrix(page).getByRole("rowheader")).toHaveCount(8, { timeout: RUN_MS });
});
