import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page }, use) => {
    // Set test environment variables
    await page.addInitScript(() => {
      localStorage.setItem("TEST_MODE", "true");
      // Override window.fetch to prevent real Supabase calls
      const originalFetch = window.fetch;
      (window as any).fetch = function (input: RequestInfo | URL, init?: RequestInit) {
        const url = typeof input === "string" ? input : input?.toString() || "";
        if (url.includes("supabase.co")) {
          console.error("BLOCKED: Real Supabase call attempted:", url);
          return Promise.reject(new Error("Real Supabase calls are blocked in test mode"));
        }
        return originalFetch(input, init);
      };
    });

    // BLOCK all real Supabase domains - reject if any get through
    await page.route("**/*.supabase.co/**", async (route) => {
      console.error("BLOCKED ROUTE:", route.request().url());
      await route.abort("blockedbyclient");
    });

    // BLOCK all supabase.co subdomains
    await page.route("**/supabase.co/**", async (route) => {
      console.error("BLOCKED SUPABASE.CO:", route.request().url());
      await route.abort("blockedbyclient");
    });

    // Mock Supabase auth endpoints - catch all auth variations
    await page.route("**/auth/v1/**", async (route) => {
      const request = route.request();
      const url = request.url();

      try {
        let postData: Record<string, any> = {};
        if (request.method() === "POST") {
          postData = await request.postDataJSON();
        }

        if (url.includes("/signup")) {
          // Validate password strength
          if (postData.password && postData.password.length < 8) {
            return await route.fulfill({
              status: 400,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                error: "Password too weak",
                error_code: "weak_password",
              }),
            });
          }

          // Mock successful signup
          return await route.fulfill({
            status: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              user: {
                id: "mock-user-id",
                email: postData.email,
                user_metadata: { username: postData.username },
              },
              session: null,
            }),
          });
        }

        if (url.includes("/token") || url.includes("/login")) {
          // Mock successful login
          if (postData.email === "test@example.com" && postData.password === "!Password123") {
            return await route.fulfill({
              status: 200,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                access_token: "mock-access-token-" + Date.now(),
                token_type: "Bearer",
                expires_in: 3600,
                refresh_token: "mock-refresh-token",
                user: {
                  id: "mock-user-id",
                  email: "test@example.com",
                  user_metadata: { username: "testuser" },
                },
              }),
            });
          } else {
            return await route.fulfill({
              status: 401,
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ error: "Invalid credentials" }),
            });
          }
        }

        if (url.includes("/verify")) {
          // Mock email verification
          return await route.fulfill({
            status: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              user: { id: "mock-user-id", email: postData.email },
              session: {
                access_token: "mock-access-token",
                token_type: "Bearer",
              },
            }),
          });
        }

        if (url.includes("/logout") || url.includes("/revoke")) {
          return await route.fulfill({
            status: 200,
            headers: { "content-type": "application/json" },
            body: JSON.stringify({}),
          });
        }

        // Default auth response
        return await route.fulfill({
          status: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ success: true }),
        });
      } catch (error) {
        return await route.fulfill({
          status: 500,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ error: "Mock server error" }),
        });
      }
    });

    // Mock chat API
    await page.route("**/api/chat/**", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          response: "Mock chat response",
          id: "mock-message-id",
        }),
      });
    });

    // Mock comparison API
    await page.route("**/api/comparison/**", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          comparison: "Mock comparison result",
          id: "mock-comparison-id",
        }),
      });
    });

    // Mock projects API
    await page.route("**/api/projects**", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projects: [
            { id: "1", name: "Project 1" },
            { id: "2", name: "Project 2" },
          ],
        }),
      });
    });

    // Mock conversations API
    await page.route("**/api/conversations**", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          conversations: [{ id: "1", title: "Conversation 1", messages: [] }],
        }),
      });
    });

    // Block any other external API calls (safety net)
    await page.route("https://**", async (route) => {
      const url = route.request().url();
      // Allow localhost and localhost variations
      if (url.includes("localhost") || url.includes("127.0.0.1")) {
        return route.continue();
      }
      await route.abort("blockedbyclient");
    });

    await use(page);
  },
});

export { expect };
