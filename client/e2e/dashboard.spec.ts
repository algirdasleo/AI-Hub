import { test, expect } from "@playwright/test";
import { loginUser } from "./utils/helpers";

test.describe("Dashboard Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should navigate to dashboard successfully", async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should display main navigation links", async ({ page }) => {
    const chatLink = page.locator('a[href*="chat"]');
    const comparisonLink = page.locator('a[href*="comparison"]');

    await expect(chatLink.or(comparisonLink).first()).toBeVisible({ timeout: 10000 });
  });

  test("should navigate to chat from dashboard", async ({ page }) => {
    const chatLink = page.locator('a[href*="chat"]').first();
    await chatLink.click();
    await expect(page).toHaveURL(/view=chat/);
  });
});
