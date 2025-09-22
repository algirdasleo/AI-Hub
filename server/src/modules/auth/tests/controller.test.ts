import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response } from "express";

import { AuthService } from "../service.js";

import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";

vi.mock("../service.js", () => ({
  AuthService: {
    signup: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock("@server/utils/auth.js", () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn().mockImplementation((res: any) => {
    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");
    }
  }),
  createUserFromSupabase: vi.fn().mockReturnValue({ id: "123", email: "test@example.com" }),
}));

import { setAuthCookies } from "@server/utils/auth.js";

import { signup, login, logout } from "../controller.js";

describe("Auth Controller", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockAuthService = AuthService as any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
    };
  });

  describe("signup", () => {
    it("should handle successful signup", async () => {
      mockReq.body = { email: "test@example.com", password: "password123" };
      mockAuthService.signup.mockResolvedValue(Result.okVoid());

      await signup(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        requiresEmailVerification: true,
      });
    });

    it("should handle signup failure", async () => {
      mockReq.body = { email: "test@example.com", password: "password123" };
      mockAuthService.signup.mockResolvedValue(
        Result.fail({
          type: ErrorType.InternalServerError,
          message: "Failed to create account",
          cause: "Email exists",
        }),
      );

      await signup(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: "Failed to create account",
        cause: "Email exists",
      });
    });
  });

  describe("login", () => {
    it("should handle successful login", async () => {
      mockReq.body = { email: "test@example.com", password: "password123" };

      const mockLoginData = {
        user: { id: "123", email: "test@example.com" },
        session: { access_token: "token123", refresh_token: "refresh123" },
      };

      mockAuthService.login.mockResolvedValue(Result.ok(mockLoginData));

      await login(mockReq as Request, mockRes as Response);

      expect(setAuthCookies).toHaveBeenCalledWith(mockRes, "token123", "refresh123");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        user: { id: "123", email: "test@example.com" },
      });
    });

    it("should handle login failure", async () => {
      mockReq.body = { email: "test@example.com", password: "wrong-password" };
      mockAuthService.login.mockResolvedValue(
        Result.fail({
          type: ErrorType.InternalServerError,
          message: "Login failed",
          cause: "Invalid credentials",
        }),
      );

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.InternalServerError,
        error: "Login failed",
      });
    });
  });

  describe("logout", () => {
    it("should successfully logout user", () => {
      logout(mockReq as Request, mockRes as Response);

      expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-access-token");
      expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-refresh-token");
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
      });
    });
  });
});
