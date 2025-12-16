import { Page } from "@playwright/test";

export const SELECTORS = {
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  loginButton: 'button[type="submit"]',
  signupButton: 'button[type="submit"]',

  dashboardLink: 'a[href*="/app"]',
  chatLink: 'a[href*="/app/chat"]',
  comparisonLink: 'a[href*="/app/comparison"]',
  projectsLink: 'a[href*="/projects"]',
  trackingLink: 'a[href*="/tracking"]',

  sidebarTrigger: 'button[data-sidebar="trigger"]',
  conversationItem: '[data-testid="conversation-item"]',

  chatInput: 'textarea[placeholder*="message"], input[placeholder*="message"]',
  sendButton: 'button[type="submit"]',
  messageContent: '[data-testid="message-content"]',

  modelSelector: '[data-testid="model-selector"]',
  comparisonInput: 'textarea[placeholder*="prompt"], input[placeholder*="prompt"]',
  compareButton: 'button:has-text("Compare")',
  comparisonResult: '[data-testid="comparison-result"]',
};

const TEST_EMAIL = process.env.TEST_USER_EMAIL || "test@example.com";
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || "!Password123";

export async function loginUser(page: Page) {
  try {
    await page.goto("http://localhost:3000/auth/login");
    await page.waitForLoadState("domcontentloaded");

    const emailInput = page.locator(SELECTORS.emailInput).first();
    const passwordInput = page.locator(SELECTORS.passwordInput).first();
    const loginButton = page.locator(SELECTORS.loginButton).first();

    await expect(emailInput).toBeVisible({ timeout: 5000 });

    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await loginButton.click();

    // Wait a bit for login to process
    await page.waitForTimeout(2000);

    // Try to navigate to dashboard if needed
    await page.goto("http://localhost:3000/dashboard").catch(() => {
      // It's ok if this fails, we're already logged in from mocking
    });
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

// Import expect for use in other places
import { expect } from "@playwright/test";
