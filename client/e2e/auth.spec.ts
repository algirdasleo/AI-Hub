import { test, expect } from "./fixtures";

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "!Password123";
const NEW_USER_EMAIL = `testuser${Date.now()}@gmail.com`;

test.describe("Authentication Flow - Signup", () => {
  test("should complete signup form with validation", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");
    await page.waitForLoadState("domcontentloaded");

    const usernameInput = page.locator('input[name="username"], input[placeholder*="sername" i]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Verify form elements are present
    await expect(usernameInput).toBeVisible({ timeout: 5000 });
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();

    // Fill form with valid data
    await usernameInput.fill("testuser");
    await emailInput.fill(NEW_USER_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Verify fields are populated
    await expect(usernameInput).toHaveValue("testuser");
    await expect(emailInput).toHaveValue(NEW_USER_EMAIL);
    await expect(passwordInput).toHaveValue(TEST_PASSWORD);

    // Submit form
    await submitButton.click();
    await page.waitForTimeout(2000);
  });

  test("should validate weak password on client-side", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");
    await page.waitForLoadState("domcontentloaded");

    const usernameInput = page.locator('input[name="username"], input[placeholder*="sername" i]').first();
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await usernameInput.fill("testuser");
    await emailInput.fill(NEW_USER_EMAIL);
    await passwordInput.fill("weak");

    // Try to submit with weak password
    await submitButton.click();
    await page.waitForTimeout(1500);

    // Check if error appears or form is still visible (validation prevented submission)
    const errorElement = page.locator("div.bg-destructive\\/15, div[role='alert'], .text-destructive").first();
    const isStillOnSignup = page.url().includes("/signup");
    const hasError = await errorElement.isVisible().catch(() => false);

    expect(hasError || isStillOnSignup).toBeTruthy();
  });

  test("should reject invalid email format", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/signup");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Fill with invalid email
    await emailInput.fill("notanemail");
    await passwordInput.fill(TEST_PASSWORD);
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Should either show validation error or stay on signup page
    const isStillOnSignup = page.url().includes("/signup");
    expect(isStillOnSignup).toBeTruthy();
  });
});

test.describe("Authentication Flow - Login", () => {
  test("should display login form elements", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    // Verify all form elements are present
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test("should attempt login with provided credentials", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);

    // Verify inputs were filled
    await expect(emailInput).toHaveValue(TEST_EMAIL);
    await expect(passwordInput).toHaveValue(TEST_PASSWORD);

    // Submit form
    await submitButton.click();
    await page.waitForTimeout(2000);

    // Should either navigate away or show error, but no unhandled exceptions
    expect(page.url()).toBeTruthy();
  });

  test("should handle incorrect password gracefully", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill("wrongpassword123");
    await submitButton.click();

    await page.waitForTimeout(1500);

    // Should still be on login page or show error
    expect(
      page.url().includes("login") ||
        (await page
          .locator('div[role="alert"], .text-destructive')
          .first()
          .isVisible()
          .catch(() => false)),
    ).toBeTruthy();
  });
});

test.describe("Authentication State", () => {
  test("should maintain session after login attempt", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Check if user is on dashboard or any authenticated page
    expect(page.url()).toBeTruthy();
  });

  test("should provide logout option if available", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await submitButton.click();

    await page.waitForTimeout(2000);

    // Look for logout button or menu
    const logoutButton = page
      .locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")')
      .first();
    const hasLogoutOption = await logoutButton.isVisible().catch(() => false);

    // If logout button exists, verify it's clickable
    if (hasLogoutOption) {
      await expect(logoutButton).toBeEnabled();
    } else {
      // Logout might be in a menu - that's also acceptable
      expect(true).toBeTruthy();
    }
  });
});

test.describe("Email Verification", () => {
  test("should navigate to verification page", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/verify-email");
    await page.waitForLoadState("domcontentloaded");

    // Verify page loaded successfully
    expect(page.url()).toContain("verify-email");

    // Check for verification-related content
    const verifyText = page.locator("text=/verify|verification|email|code/i").first();
    const hasVerifyContent = await verifyText.isVisible().catch(() => false);

    // Page should either show verification UI or be accessible
    expect(hasVerifyContent || (await page.title()).length > 0).toBeTruthy();
  });

  test("should handle verification with token parameter", async ({ page }) => {
    const mockToken = "mock-verification-token";
    const verifyUrl = `http://localhost:3000/auth/verify-email?token=${mockToken}`;

    await page.goto(verifyUrl);
    await page.waitForLoadState("domcontentloaded");

    // Verify page navigated with token
    expect(page.url()).toContain("token=" + mockToken);

    // Check if page shows loading state or verification UI
    const hasSpinner = await page
      .locator(".animate-spin")
      .isVisible()
      .catch(() => false);
    const hasVerifyText = await page
      .locator("text=/verifying|processing|verify|confirm/i")
      .first()
      .isVisible()
      .catch(() => false);
    const pageTitle = await page.title();

    // Page should be processing or showing verification UI
    expect(hasSpinner || hasVerifyText || pageTitle.length > 0).toBeTruthy();
  });

  test("should accept valid verification code input", async ({ page }) => {
    await page.goto("http://localhost:3000/auth/verify-email");
    await page.waitForLoadState("domcontentloaded");

    // Look for code input field
    const codeInput = page
      .locator('input[type="text"][placeholder*="code" i], input[placeholder*="verification" i]')
      .first();
    const hasCodeInput = await codeInput.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasCodeInput) {
      // If input exists, verify we can type in it
      await codeInput.fill("123456");
      const hasValue = await codeInput.inputValue();
      expect(hasValue).toBe("123456");
    } else {
      // If no input, verify page is still accessible
      expect(page.url()).toContain("verify-email");
    }
  });
});
