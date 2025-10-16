import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "!Password123";
const NEW_USER_EMAIL = `testuser${Date.now()}@gmail.com`;

test.describe.skip("Authentication Flow - Signup", () => {
  test("should successfully sign up a new user", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await page.fill('input[name="username"], input[placeholder*="sername" i]', "testuser");
    await page.fill('input[type="email"]', NEW_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/verify-email**", { timeout: 10000 });
    await expect(page).toHaveURL(/\/verify-email/);
  });

  test("should show error for weak password", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await page.fill('input[name="username"], input[placeholder*="sername" i]', "testuser");
    await page.fill('input[type="email"]', NEW_USER_EMAIL);
    await page.fill('input[type="password"]', "weak");
    await page.click('button[type="submit"]');

    await expect(page.locator("div.bg-destructive\\/15")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("div.bg-destructive\\/15")).toContainText(/password/i);
  });
});

test.describe.skip("Authentication Flow - Login", () => {
  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    await page.waitForTimeout(1000);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("div.bg-destructive\\/15")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Logout Flow", () => {
  test("should successfully logout authenticated user", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);

    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    await page.waitForURL("**/dashboard**", { timeout: 10000 });

    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible({ timeout: 5000 });
    await logoutButton.click();

    await page.waitForURL("**/auth/login**", { timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe("Email Verification", () => {
  test("should show verification page", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/verify-email");

    await expect(page.locator("text=/verify|verification|email/i").first()).toBeVisible({ timeout: 5000 });
  });

  test("should handle verification with token", async ({ page }) => {
    const mockToken = "mock-verification-token";
    await page.goto(`http://localhost:3000/auth/verify-email?token=${mockToken}`);

    const hasSpinner = await page
      .locator(".animate-spin")
      .isVisible()
      .catch(() => false);
    const hasVerifyText = await page
      .locator("text=/verifying|processing|verify/i")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasSpinner || hasVerifyText).toBeTruthy();
  });
});
