import { describe, it, expect, vi, beforeEach } from "vitest";

import { AuthService } from "../service.js";

import { ErrorType } from "@shared/utils/error-type.js";

vi.mock("@server/db/supabase.js", () => ({
  supabaseServer: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
    },
  },
}));

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

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(true);
      expect(mockAuth.signUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
        },
      });
    });

    it("should handle signup errors", async () => {
      mockAuth.signUp.mockResolvedValue({
        data: null,
        error: { message: "Email already exists" },
      });

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      expect(result.error.message).toBe("Failed to create account");
      expect(result.error.cause).toBe("Email already exists");
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
      expect(result.error.cause).toBe("Invalid credentials");
    });
  });
});
