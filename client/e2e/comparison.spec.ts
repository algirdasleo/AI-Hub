import { test, expect } from "@playwright/test";
import { loginUser } from "./utils/helpers";

test.describe("Comparison Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should navigate to comparison page", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await expect(page).toHaveURL(/view=comparison/);
  });

  test("should display comparison input", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    const comparisonInput = page
      .locator('textarea[placeholder*="prompt"], textarea[placeholder*="compare"]')
      .first();
    await expect(comparisonInput).toBeVisible({ timeout: 10000 });
  });

  test("should show compare button", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    const compareButton = page.locator('button:has-text("Start Comparison")').first();
    await expect(compareButton).toBeVisible({ timeout: 10000 });
  });
});
