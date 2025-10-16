import { test, expect } from "@playwright/test";
import { loginUser } from "./utils/helpers";

test.describe("Chat Flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should navigate to chat page", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    await expect(page).toHaveURL(/view=chat/);
  });

  test("should display chat input", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    const chatInput = page.locator('textarea[placeholder*="Ask"], textarea[placeholder*="Chat"]');
    await expect(chatInput).toBeVisible({ timeout: 10000 });
  });

  test("should show send button", async ({ page }) => {
    await page.goto("http://localhost:3000/dashboard?view=chat");
    const sendButton = page.locator('button:has-text("Send"), button[aria-label*="Send"]').first();
    await expect(sendButton).toBeVisible({ timeout: 10000 });
  });
});
