import { expect, test, type Page } from "@playwright/test";

const panel = (page: Page) => page.getByRole("complementary", { name: "Input" });
const field = (page: Page, name: string | RegExp) =>
  panel(page).getByRole("textbox", { name, exact: typeof name === "string" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Recent runs", exact: true })).toBeVisible();
});

test("S03: fill the panel and run: startRun fills the header in place", async ({ page }) => {
  await field(page, "Name, CAS or SMILES").fill("Polysorbate 80");
  await field(page, "PDB ID").fill("1n8z");
  await field(page, "Protein dose").click();
  await expect(panel(page).getByText("Resolved: Polysorbate 80 · CAS 9005-65-6")).toBeVisible();
  await expect(panel(page).getByRole("button", { name: /Antigen, excluded/ })).toHaveAttribute(
    "aria-pressed",
    "false",
  );

  await field(page, "Protein dose").fill("150");
  await field(page, "Excipient concentration").fill("0.2");
  await page.getByRole("button", { name: "Run screen" }).click();

  await expect(page.getByText(/^Single screen · RUN-\d{4}-\d{4}-\d{4}$/)).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Polysorbate 80 × 1N8Z Fab");
  await expect(
    page.getByText("SC · 150 mg every 2 weeks · 0.2 mg/mL excipient · stored at 25 °C"),
  ).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("S03: Load example fills the panel, polymer fields and chains", async ({ page }) => {
  await page.getByRole("button", { name: /Load example/ }).click();
  await expect(field(page, "Name, CAS or SMILES")).toHaveValue("Polysorbate 80");
  await expect(panel(page).getByRole("switch", { name: "Polymer" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(field(page, "Repeat unit")).toHaveValue("-(CH2CH2O)-");
  await expect(field(page, "PDB ID")).toHaveValue("1N8Z");
  await expect(panel(page).getByRole("button", { name: /Light chain/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(field(page, "Excipient concentration")).toHaveValue("0.2");
  await page.getByRole("button", { name: "Run screen" }).click();
  await expect(page.getByText(/^Single screen · RUN-/)).toBeVisible();
});

test("S03: invalid input shows inline errors and focuses the first field", async ({ page }) => {
  await page.getByRole("button", { name: "Run screen" }).click();
  const excipient = field(page, "Name, CAS or SMILES");
  await expect(excipient).toBeFocused();
  await expect(excipient).toHaveAttribute("aria-invalid", "true");
  await expect(panel(page).getByRole("alert")).toHaveText("Check the 4 highlighted fields.");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("New screen");
});

test("S03: ALX-117 has no registry match and a placeholder SMILES", async ({ page }) => {
  await field(page, "Name, CAS or SMILES").fill("ALX-117");
  await field(page, "PDB ID").click();
  await expect(
    panel(page).getByText("ALX-117: no registry match · user SMILES [PLACEHOLDER]"),
  ).toBeVisible();
});

test("S03: protein tabs, polymer switch and storage work from the keyboard", async ({ page }) => {
  const polymer = panel(page).getByRole("switch", { name: "Polymer" });
  await polymer.focus();
  await page.keyboard.press("Space");
  await expect(field(page, "Repeat unit")).toBeVisible();

  const pdbTab = panel(page).getByRole("tab", { name: "PDB ID" });
  await pdbTab.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(panel(page).getByRole("tab", { name: "Sequence" })).toBeFocused();
  await expect(panel(page).getByRole("tab", { name: "Sequence" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(field(page, /Sequence \(FASTA/)).toBeVisible();

  const cold = panel(page).getByRole("button", { name: "4 °C" });
  await cold.focus();
  await page.keyboard.press("Enter");
  await expect(cold).toHaveAttribute("aria-pressed", "true");
});

test("S02 is gone: no Draw structure button or modal", async ({ page }) => {
  await expect(page.getByRole("button", { name: /Draw structure/ })).toHaveCount(0);
});
