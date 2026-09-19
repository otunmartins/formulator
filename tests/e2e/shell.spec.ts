import { expect, test, type Page } from "@playwright/test";

const DISCLAIMER = "Decision support, not a certification of safety. Wet-lab validation required.";

const button = (page: Page, name: string) => page.getByRole("button", { name, exact: true });

async function expectFooter(page: Page) {
  await expect(page.getByRole("contentinfo")).toHaveText(DISCLAIMER);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(button(page, "Recent runs")).toBeVisible();
});

test("S01: empty screen with every region in place", async ({ page }) => {
  await expect(page).toHaveTitle("Excipient Screen");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("New screen");
  await expect(button(page, "Single")).toHaveAttribute("aria-pressed", "true");

  const steps = page.getByRole("list", { name: "Run progress" }).getByRole("listitem");
  await expect(steps).toHaveCount(4);
  for (const step of await steps.all()) await expect(step).toContainText("Waiting");

  await expect(page.getByRole("heading", { name: "No screen yet" })).toBeVisible();

  const review = page.getByRole("region", { name: "Review and export" });
  await expect(review).toContainText("Draft");
  for (const name of ["Sign off", "Run manifest", "Export PDF", "Export DOCX", "Copy share link"]) {
    await expect(review.getByRole("button", { name })).toBeDisabled();
  }
  await expectFooter(page);
});

test("S01: Load example fills the run header in place", async ({ page }) => {
  await button(page, "Load example: polysorbate 80 × 1N8Z Fab").click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Polysorbate 80 × 1N8Z Fab");
  await expect(
    page.getByText("SC · 150 mg every 2 weeks · 0.2 mg/mL excipient · stored at 25 °C"),
  ).toBeVisible();
  await expect(page).toHaveURL("/");
});

test("S01: stubbed actions say Not connected yet", async ({ page }) => {
  await button(page, "Run screen").click();
  await expect(page.getByRole("status")).toContainText("Not connected yet");
});

test("C01: recent runs open into the same screen", async ({ page }) => {
  await button(page, "Recent runs").click();
  const menu = page.getByRole("menu", { name: "Recent runs" });
  await expect(menu.getByRole("menuitem")).toHaveCount(4);
  await expect(menu).toContainText("RUN-0917-0398");
  await expect(menu).toContainText("Signed off v1");
  await expect(menu).toContainText("Signed off v2");

  await menu.getByRole("menuitem", { name: /Polysorbate 80/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Polysorbate 80 × 1N8Z Fab");
  await expect(page.getByText("Single screen · RUN-2026-0918-0412")).toBeVisible();
  await expect(page).toHaveURL("/");
  await expectFooter(page);
});

test("C02: switching workspace reloads recent runs, only this user's", async ({ page }) => {
  await page.getByRole("button", { name: /^M\. Otun/ }).click();
  const menu = page.getByRole("menu", { name: "Account" });
  await expect(menu.getByRole("menuitemradio")).toHaveText([
    "Algonix AI · Formulation",
    "Algonix AI · Discovery",
  ]);
  await expect(
    menu.getByRole("menuitemradio", { name: "Algonix AI · Formulation" }),
  ).toHaveAttribute("aria-checked", "true");
  await expect(menu).not.toContainText("Other user");

  await menu.getByRole("menuitemradio", { name: "Algonix AI · Discovery" }).click();
  await expect(page.getByRole("button", { name: /Algonix AI · Discovery/ })).toBeVisible();

  await button(page, "Recent runs").click();
  const runs = page.getByRole("menu", { name: "Recent runs" }).getByRole("menuitem");
  await expect(runs).toHaveCount(2);
  await expect(runs.first()).toContainText("[PLACEHOLDER]");
  await expectFooter(page);
});

test("C02: sign out is a visible stub", async ({ page }) => {
  await page.getByRole("button", { name: /^M\. Otun/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page.getByRole("status")).toContainText("Not connected yet");
});

test("C03: the input panel collapses to a rail and expands again", async ({ page }) => {
  const collapse = button(page, "Collapse input panel");
  await expect(collapse).toHaveAttribute("aria-expanded", "true");
  await collapse.click();
  await expect(button(page, "Run screen")).toBeHidden();

  const expand = button(page, "Expand input panel");
  await expect(expand).toHaveAttribute("aria-expanded", "false");
  await expand.click();
  await expect(button(page, "Run screen")).toBeVisible();
  await expectFooter(page);
});

test("keyboard: menus, drawer and mode toggle work without a mouse", async ({ page }) => {
  const recent = button(page, "Recent runs");
  await recent.focus();
  await page.keyboard.press("Enter");
  const items = page.getByRole("menu", { name: "Recent runs" }).getByRole("menuitem");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(items.nth(1)).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toBeHidden();
  await expect(recent).toBeFocused();

  const ask = button(page, "Ask about this result");
  await ask.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: "Ask about this result" });
  await expect(drawer).toContainText("Not connected yet");
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(ask).toBeFocused();

  await button(page, "Batch").focus();
  await page.keyboard.press("Space");
  await expect(button(page, "Batch")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("New batch");
});

test("tablet: the input panel narrows at 1024px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  const panel = page.getByRole("complementary", { name: "Input" });
  const box = await panel.boundingBox();
  expect(box?.width).toBeLessThan(344);
  await expectFooter(page);
});
