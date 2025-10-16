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
      setSession: vi.fn(),
      admin: {
        updateUserById: vi.fn(),
      },
    },
  },
}));

import { AuthService } from "../service.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { supabaseServer } from "@server/db/supabase.js";
import { verificationEmitter } from "../verification-emitter.js";

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
          emailRedirectTo: "undefined/auth/callback",
          data: {
            display_name: "test",
            role: "user",
            subscription_tier: "free",
          },
        },
      });
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

  describe("AuthService additional coverage", () => {
    it("should fail signup with missing email", async () => {
      const req = { password: "password123" } as any;

      await expect(AuthService.signup(req)).rejects.toThrow();
    });

    it("should fail login with missing password", async () => {
      const result = await AuthService.login({ email: "test@example.com" } as any);
      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
    });

    it("should handle supabase error on signup", async () => {
      const authError = { message: "fail", code: "400", status: 400, name: "AuthError" } as any;
      const mockSignup = vi
        .spyOn(supabaseServer.auth, "signUp")
        .mockResolvedValue({ data: { user: null, session: null }, error: authError });
      const result = await AuthService.signup({ email: "test@example.com", password: "123" });
      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      mockSignup.mockRestore();
    });

    it("should handle supabase error on login", async () => {
      const authError = { message: "fail", code: "400", status: 400, name: "AuthError" } as any;
      const mockLogin = vi
        .spyOn(supabaseServer.auth, "signInWithPassword")
        .mockResolvedValue({ data: { user: null, session: null }, error: authError });
      const result = await AuthService.login({ email: "test@example.com", password: "123" });
      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.InternalServerError);
      mockLogin.mockRestore();
    });

    it("should successfully signup with display_name and call updateUserById", async () => {
      const signupData = { email: "test@example.com", password: "password123", display_name: "John Doe" };
      const mockSignUp = vi.spyOn(supabaseServer.auth, "signUp").mockResolvedValue({
        data: { user: { id: "123" } as any, session: { access_token: "token" } as any },
        error: null,
      } as any);
      const mockUpdate = vi.spyOn(supabaseServer.auth.admin, "updateUserById").mockResolvedValue({
        data: { user: { id: "123" } as any },
        error: null,
      } as any);

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(true);
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_URL}/auth/callback`,
          data: {
            display_name: "John Doe",
            role: "user",
            subscription_tier: "free",
          },
        },
      });
      mockSignUp.mockRestore();
      mockUpdate.mockRestore();
    });

    it("should handle no user data returned from signup", async () => {
      const signupData = { email: "test@example.com", password: "password123" };
      const mockSignUp = vi.spyOn(supabaseServer.auth, "signUp").mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      } as any);

      const result = await AuthService.signup(signupData);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe("Failed to create account");
      expect(result.error.details).toBe("No user data returned");
      mockSignUp.mockRestore();
    });

    it("should verify tokens successfully", async () => {
      mockAuth.setSession.mockResolvedValue({
        data: { session: { access_token: "token" }, user: { id: "123" } },
        error: null,
      });

      const result = await AuthService.verifyTokens("access", "refresh");

      expect(result.isSuccess).toBe(true);
      expect(mockAuth.setSession).toHaveBeenCalledWith({
        access_token: "access",
        refresh_token: "refresh",
      });
    });

    it("should handle verify tokens error", async () => {
      const authError = { message: "Invalid token", code: "401", status: 401, name: "AuthError" } as any;
      mockAuth.setSession.mockResolvedValue({
        data: { session: null, user: null },
        error: authError,
      });

      const result = await AuthService.verifyTokens("access", "refresh");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe(ErrorType.Unauthorized);
    });

    it("should handle verify tokens with no session data", async () => {
      mockAuth.setSession.mockResolvedValue({
        data: { session: null, user: null },
        error: null,
      });

      const result = await AuthService.verifyTokens("access", "refresh");

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toBe("Failed to verify tokens");
    });

    it("should setup verification SSE stream and handle verification event", () => {
      const mockReq = {
        headers: { origin: "http://localhost:3000" },
        on: vi.fn(),
      } as any;
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
      } as any;

      AuthService.setupVerificationSSE(mockReq, mockRes, "test@example.com");

      expect(mockRes.setHeader).toHaveBeenCalledWith("Content-Type", "text/event-stream");
      expect(mockRes.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
      expect(mockRes.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
      expect(mockRes.setHeader).toHaveBeenCalledWith("Access-Control-Allow-Origin", "http://localhost:3000");
      expect(mockRes.write).toHaveBeenCalledWith('data: {"status":"connected"}\n\n');

      verificationEmitter.notifyVerification("user-123", "test@example.com");

      expect(mockRes.write).toHaveBeenCalledWith(expect.stringContaining('"status":"verified"'));
    });

    it("should setup verification SSE stream and ignore non-matching email", () => {
      const mockReq = {
        headers: {},
        on: vi.fn(),
      } as any;
      const mockRes = {
        setHeader: vi.fn(),
        write: vi.fn(),
      } as any;

      const initialWriteCount = mockRes.write.mock.calls.length;
      AuthService.setupVerificationSSE(mockReq, mockRes, "test@example.com");

      verificationEmitter.notifyVerification("user-456", "other@example.com");

      const newWrites = mockRes.write.mock.calls.slice(initialWriteCount);
      const hasVerifiedWrite = newWrites.some((call: any) => call[0] && call[0].includes('"status":"verified"'));
      expect(hasVerifiedWrite).toBe(false);
    });
  });
});
