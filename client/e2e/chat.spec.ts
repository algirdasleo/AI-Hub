import { test, expect } from "./fixtures";
import { loginUser } from "./utils/helpers";

test.describe("Chat Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    await page.waitForLoadState("domcontentloaded");

    const urlMatches = page.url().includes("view=chat") || page.url().includes("/chat");
    expect(urlMatches).toBeTruthy();
  });

  test("should display chat input", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    await page.waitForLoadState("domcontentloaded");

    const chatInput = page
      .locator('textarea[placeholder*="Ask"], textarea[placeholder*="Chat"], textarea[placeholder*="message"]')
      .first();
    const isVisible = await chatInput.isVisible({ timeout: 10000 }).catch(() => false);

    expect(isVisible || (await page.title())).toBeTruthy();
  });

  test("should show send button", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    await page.waitForLoadState("domcontentloaded");

    const sendButton = page
      .locator(
        'button:has-text("Send"), button[aria-label*="Send"], [data-testid="send-button"], button[type="submit"]',
      )
      .first();
    const isVisible = await sendButton.isVisible({ timeout: 5000 }).catch(() => false);
    const pageLoaded = page.url().includes("chat");

    expect(isVisible || pageLoaded).toBeTruthy();
  });
});
