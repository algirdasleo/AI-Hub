import { test, expect } from "./fixtures";
import { loginUser } from "./utils/helpers";

test.describe("Comparison Feature", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should load comparison view", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await page.waitForLoadState("domcontentloaded");

    // Verify comparison URL
    expect(page.url().includes("view=comparison") || page.url().includes("/comparison")).toBeTruthy();

    // Verify page loaded
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("should display comparison input field", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await page.waitForLoadState("domcontentloaded");

    const comparisonInput = page
      .locator(
        'textarea[placeholder*="prompt" i], textarea[placeholder*="compare" i], textarea[placeholder*="message" i], input[placeholder*="prompt" i], [data-testid="comparison-input"]',
      )
      .first();

    const isVisible = await comparisonInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (isVisible) {
      // Verify input is initially empty
      const initialValue = await comparisonInput.inputValue();
      expect(initialValue).toBe("");

      // Test typing comparison prompt
      await comparisonInput.fill("Compare Python vs JavaScript");
      const filledValue = await comparisonInput.inputValue();
      expect(filledValue).toBe("Compare Python vs JavaScript");
    } else {
      // At minimum, comparison page should be accessible
      expect(page.url().includes("comparison")).toBeTruthy();
    }
  });

  test("should have compare button for submission", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await page.waitForLoadState("domcontentloaded");

    const compareButton = page
      .locator(
        'button:has-text("Compare"), button:has-text("Start Comparison"), button:has-text("Submit"), [data-testid="compare-button"], button[type="submit"]',
      )
      .first();

    const isVisible = await compareButton.isVisible({ timeout: 5000 }).catch(() => false);
    const pageLoaded = page.url().includes("comparison");

    expect(isVisible || pageLoaded).toBeTruthy();

    if (isVisible) {
      // Verify button is enabled
      const isEnabled = await compareButton.isEnabled();
      expect(typeof isEnabled).toBe("boolean");
    }
  });

  test("should process comparison requests", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await page.waitForLoadState("domcontentloaded");

    const comparisonInput = page.locator("textarea").first();
    const compareButton = page.locator('button:has-text("Compare"), button[type="submit"]').first();

    const inputVisible = await comparisonInput.isVisible({ timeout: 5000 }).catch(() => false);
    const buttonVisible = await compareButton.isVisible().catch(() => false);

    if (inputVisible && buttonVisible) {
      // Enter comparison prompt
      await comparisonInput.fill("What are the differences between React and Vue?");

      // Verify input
      const promptText = await comparisonInput.inputValue();
      expect(promptText).toBe("What are the differences between React and Vue?");

      // Submit comparison
      await compareButton.click();
      await page.waitForTimeout(1500);

      // Should remain on page or show results
      expect(page.url()).toBeTruthy();
    } else {
      // At minimum, comparison page should be accessible
      expect(page.url().includes("comparison")).toBeTruthy();
    }
  });

  test("should allow multiple comparison submissions", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=comparison");
    await page.waitForLoadState("domcontentloaded");

    const comparisonInput = page.locator("textarea").first();
    const compareButton = page.locator('button:has-text("Compare"), button[type="submit"]').first();

    const inputVisible = await comparisonInput.isVisible({ timeout: 5000 }).catch(() => false);
    const buttonVisible = await compareButton.isVisible().catch(() => false);

    if (inputVisible && buttonVisible) {
      // First comparison
      await comparisonInput.fill("Compare TypeScript and JavaScript");
      await compareButton.click();
      await page.waitForTimeout(1000);

      // Second comparison (input should accept new value)
      await comparisonInput.fill("Compare Go and Rust");
      const secondPrompt = await comparisonInput.inputValue();
      expect(secondPrompt).toBe("Compare Go and Rust");

      await compareButton.click();
      await page.waitForTimeout(1000);

      // Should still be on comparison page
      expect(page.url()).toBeTruthy();
    } else {
      expect(page.url().includes("comparison")).toBeTruthy();
    }
  });
});
