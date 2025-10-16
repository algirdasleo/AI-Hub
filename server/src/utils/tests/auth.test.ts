import { describe, it, expect, vi, beforeEach } from "vitest";
import { Response } from "express";
import { SupabaseJWTPayload } from "@server/modules/auth/index.js";

vi.mock("@shared/types/auth/index.js", () => ({
  UserSchema: {
    parse: vi.fn((data) => data),
  },
  UserRole: {
    USER: "user",
    ADMIN: "admin",
  },
  SubscriptionTier: {
    FREE: "free",
    PRO: "pro",
    ENTERPRISE: "enterprise",
  },
}));

import { createUserFromJWT, createUserFromSupabase, setAuthCookies, clearAuthCookies } from "../auth.js";
import type { UserRole } from "@shared/types/auth/index.js";
import { SubscriptionTier } from "@shared/types/auth/index.js";

describe("Auth Utils", () => {
  describe("createUserFromJWT", () => {
    const mockJWTPayload: SupabaseJWTPayload = {
      sub: "user123",
      email: "test@example.com",
      role: "authenticated",
      aud: "authenticated",
      exp: 1234567890,
      iat: 1234567890,
      user_metadata: {
        display_name: "Test User",
        role: "user" as UserRole,
        subscription_tier: SubscriptionTier.FREE,
      },
      app_metadata: {},
    };

    it("should create user from JWT payload", () => {
      const user = createUserFromJWT(mockJWTPayload);

      expect(user).toEqual({
        id: "user123",
        email: "test@example.com",
        role: "user",
        display_name: "Test User",
        subscription_tier: "free",
      });
    });

    it("should handle missing metadata gracefully", () => {
      const incompletePayload = {
        ...mockJWTPayload,
        user_metadata: { display_name: undefined },
        app_metadata: { subscription_tier: undefined },
      };

      const user = createUserFromJWT(incompletePayload as any);

      expect(user.id).toBe("user123");
      expect(user.email).toBe("test@example.com");
      expect(user.display_name).toBeUndefined();
      expect(user.subscription_tier).toBeUndefined();
    });
  });

  describe("createUserFromSupabase", () => {
    const mockSupabaseUser = {
      id: "user456",
      email: "supabase@example.com",
      role: "authenticated",
      user_metadata: {
        display_name: "Supabase User",
      },
      app_metadata: {
        subscription_tier: "premium",
      },
    };

    it("should create user from Supabase user object", () => {
      const user = createUserFromSupabase(mockSupabaseUser);

      expect(user).toEqual({
        id: "user456",
        email: "supabase@example.com",
        role: "user",
        display_name: "Supabase User",
        subscription_tier: "premium",
      });
    });

    it("should handle user without metadata", () => {
      const userWithoutMetadata = {
        id: "user789",
        email: "plain@example.com",
        role: "authenticated",
        user_metadata: {},
        app_metadata: {},
      };

      const user = createUserFromSupabase(userWithoutMetadata);

      expect(user.id).toBe("user789");
      expect(user.email).toBe("plain@example.com");
      expect(user.role).toBe("user");
    });
  });

  describe("setAuthCookies", () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {
        cookie: vi.fn(),
      };
    });

    it("should set both access and refresh token cookies", () => {
      setAuthCookies(mockRes as Response, "access-token-123", "refresh-token-456");

      expect(mockRes.cookie).toHaveBeenCalledTimes(2);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "sb-access-token",
        "access-token-123",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
        }),
      );
      expect(mockRes.cookie).toHaveBeenCalledWith(
        "sb-refresh-token",
        "refresh-token-456",
        expect.objectContaining({
          httpOnly: true,
          sameSite: "lax",
        }),
      );
    });

    it("should set secure cookies in production", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      setAuthCookies(mockRes as Response, "token", "refresh");

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "sb-access-token",
        "token",
        expect.objectContaining({
          secure: true,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should not set secure cookies in development", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";

      setAuthCookies(mockRes as Response, "token", "refresh");

      expect(mockRes.cookie).toHaveBeenCalledWith(
        "sb-access-token",
        "token",
        expect.objectContaining({
          secure: false,
        }),
      );

      process.env.NODE_ENV = originalEnv;
    });

    it("should use correct cookie options", () => {
      setAuthCookies(mockRes as Response, "test-token", "test-refresh");

      const expectedOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
      };

      expect(mockRes.cookie).toHaveBeenCalledWith("sb-access-token", "test-token", expectedOptions);
      expect(mockRes.cookie).toHaveBeenCalledWith("sb-refresh-token", "test-refresh", expectedOptions);
    });
  });

  describe("clearAuthCookies", () => {
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockRes = {
        clearCookie: vi.fn(),
      };
    });

    it("should clear both access and refresh token cookies", () => {
      clearAuthCookies(mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-access-token");
      expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-refresh-token");
      expect(mockRes.clearCookie).toHaveBeenCalledTimes(2);
    });
  });
});
