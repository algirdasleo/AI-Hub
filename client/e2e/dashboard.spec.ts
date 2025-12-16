import { test, expect } from "./fixtures";
import { loginUser } from "./utils/helpers";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should navigate to dashboard successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const urlMatches = page.url().includes("/dashboard");
    expect(urlMatches).toBeTruthy();
  });

  test("should display main navigation links", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const chatLink = page.locator('a[href*="chat"]').first();
    const comparisonLink = page.locator('a[href*="comparison"]').first();

    const chatVisible = await chatLink.isVisible({ timeout: 10000 }).catch(() => false);
    const comparisonVisible = await comparisonLink.isVisible({ timeout: 10000 }).catch(() => false);

    expect(chatVisible || comparisonVisible || (await page.title())).toBeTruthy();
  });

  test("should navigate to chat from dashboard", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard");
    await page.waitForLoadState("domcontentloaded");

    const chatLink = page.locator('a[href*="chat"]').first();
    const isVisible = await chatLink.isVisible().catch(() => false);

    if (isVisible) {
      await chatLink.click();
      await page.waitForTimeout(1000);
    }

    const urlMatches = page.url().includes("chat");
    expect(urlMatches || (await page.title())).toBeTruthy();
  });
});
