import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "!Password123";
const NEW_USER_EMAIL = `test-${Date.now()}@example.com`;

test.describe("Authentication Flow - Signup", () => {
  test("should successfully sign up a new user", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await page.fill('input[name="username"], input[placeholder*="sername" i]', "testuser");
    await page.fill('input[type="email"]', NEW_USER_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/verify|check your email|confirmation/i")).toBeVisible({ timeout: 10000 });
  });

  test("should show error for weak password", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await page.fill('input[name="username"], input[placeholder*="sername" i]', "testuser");
    await page.fill('input[type="email"]', NEW_USER_EMAIL);
    await page.fill('input[type="password"]', "weak");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/password|weak|strong|characters/i")).toBeVisible({ timeout: 5000 });
  });

  test("should show error for existing email", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");

    await page.fill('input[name="username"], input[placeholder*="sername" i]', "testuser");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/already|exists|registered/i")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Authentication Flow - Login", () => {
  test("should successfully login with valid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL("**/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");

    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.locator("text=/invalid|error|incorrect/i")).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Logout Flow", () => {
  test("should successfully logout authenticated user", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    await page.click(
      'button:has-text("Logout"), button:has-text("Sign out"), button:has-text("Log out"), [data-testid="logout-button"]',
    );

    await page.waitForURL("**/login");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("Email Verification", () => {
  test("should show verification page", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/verify-email");

    await expect(page.locator("text=/verify|verification|email/i")).toBeVisible({ timeout: 5000 });
  });

  test("should handle verification with token", async ({ page }) => {
    const mockToken = "mock-verification-token";
    await page.goto(`http://localhost:3000/auth/verify-email?token=${mockToken}`);

    await expect(page.locator("text=/verifying|processing|loading/i, .animate-spin")).toBeVisible({
      timeout: 5000,
    });
  });
});
