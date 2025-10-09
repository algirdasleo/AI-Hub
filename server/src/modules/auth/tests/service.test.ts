import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@shared/types/auth/index.js", () => ({
  UserRole: { USER: "user", ADMIN: "admin" },
  SubscriptionTier: { FREE: "free", PREMIUM: "premium" },
}));

vi.mock("@server/db/supabase.js", () => ({
  supabaseServer: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      admin: {
        updateUserById: vi.fn(),
      },
    },
  },
}));

import { AuthService } from "../service.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { supabaseServer } from "@server/db/supabase.js";

describe("AuthService", () => {
  const mockAuth = supabaseServer.auth as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("signup", () => {
    const signupData = {
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully create account", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: { id: "123" } },
        error: null,
      });

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: { user: { id: "123" } },
        error: null,
      });

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(true);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
        },
      });
      expect(mockAuth.admin.updateUserById).toHaveBeenCalled();
    });

    it("should handle signup errors", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: "Email already exists" },
      });

      mockAuth.admin.updateUserById.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      expect(result.error.message).toBe("Failed to create account");
    });
  });

  describe("login", () => {
    const loginData = {
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully login user", async () => {
      const mockSession = {
        user: { id: "123", email: "test@example.com" },
        session: { access_token: "token123", refresh_token: "refresh123" },
      };

      mockAuth.signInWithPassword.mockResolvedValue({
        data: mockSession,
        error: null,
      });

      const result = await AuthService.login(loginData);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(mockSession);
      expect(mockAuth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });

    it("should handle login errors", async () => {
      mockAuth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: "Invalid credentials" },
      });

      const result = await AuthService.login(loginData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      expect(result.error.message).toBe("Login failed");
      expect(result.error.details).toBe("Invalid credentials");
    });
  });
});
