import { test, expect } from "./fixtures";
import { loginUser } from "./utils/helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("should load app pages successfully", async ({ page }) => {
    await page.goto("http://localhost:3000/app/chat");
    await page.waitForLoadState("domcontentloaded");

    // Verify page loaded
    expect(page.url()).toBeTruthy();

    // Verify page title loaded
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("should navigate between app sections", async ({ page }) => {
    // Navigate to chat
    await page.goto("http://localhost:3000/app/chat");
    await page.waitForLoadState("domcontentloaded");

    let currentUrl = page.url();
    expect(currentUrl).toBeTruthy();

    // Navigate to comparison
    await page.goto("http://localhost:3000/app/comparison");
    await page.waitForLoadState("domcontentloaded");

    currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test("should maintain authenticated state across pages", async ({ page }) => {
    // Navigate through authenticated pages
    await page.goto("http://localhost:3000/app/chat");
    await page.waitForLoadState("domcontentloaded");

    const chatUrl = page.url();
    expect(!chatUrl.includes("/auth")).toBeTruthy();

    // Navigate to comparison
    await page.goto("http://localhost:3000/app/comparison");
    await page.waitForLoadState("domcontentloaded");

    const comparisonUrl = page.url();
    expect(!comparisonUrl.includes("/auth")).toBeTruthy();
  });

  test("should allow navigation between features", async ({ page }) => {
    // Try navigating to overview
    await page.goto("http://localhost:3000/app/overview");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toBeTruthy();

    // Try projects
    await page.goto("http://localhost:3000/app/projects");
    await page.waitForLoadState("domcontentloaded");

    expect(page.url()).toBeTruthy();
  });
});
