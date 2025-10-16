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

vi.mock("@server/utils/index.js", () => ({
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn().mockImplementation((res: any) => {
    if (res && typeof res.clearCookie === "function") {
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");
    }
  }),
  createUserFromSupabase: vi.fn().mockReturnValue({ id: "123", email: "test@example.com" }),
}));

import { setAuthCookies } from "@server/utils/index.js";

import { signup, login, logout, callback, verificationStatus } from "../controller.js";

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
      mockAuthService.signup.mockResolvedValue(Result.ok({ requiresEmailVerification: true }));

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
          details: "Email exists",
        }),
      );

      await signup(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.InternalServerError,
        error: "Failed to create account",
        details: "Email exists",
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
          details: "Invalid credentials",
        }),
      );

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.InternalServerError,
        error: "Login failed",
        details: "Invalid credentials",
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

describe("Auth Controller additional coverage", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  const mockAuthService = AuthService as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockReq = { body: {}, query: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      clearCookie: vi.fn(),
    };
  });

  it("should handle missing signup parameters", async () => {
    mockReq.body = {};
    mockAuthService.signup.mockResolvedValue(
      Result.fail({
        type: ErrorType.InvalidParameters,
        message: "Missing email or password",
        details: "Missing email or password",
      }),
    );
    await signup(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      type: ErrorType.InvalidParameters,
      error: "Missing email or password",
      details: "Missing email or password",
    });
  });

  it("should handle callback with missing tokens", async () => {
    mockReq.body = {};
    await callback(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      type: ErrorType.InvalidParameters,
      error: "Missing authentication tokens",
      details: undefined,
    });
  });

  it("should handle verification status with missing email", async () => {
    mockReq.query = {};
    await verificationStatus(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: false,
      type: ErrorType.InvalidParameters,
      error: "Email parameter is required",
      details: undefined,
    });
  });

  it("should handle logout with cookies cleared", () => {
    logout(mockReq as Request, mockRes as Response);
    expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-access-token");
    expect(mockRes.clearCookie).toHaveBeenCalledWith("sb-refresh-token");
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ success: true });
  });

  it("should handle callback with valid tokens", async () => {
    mockReq.body = { access_token: "access", refresh_token: "refresh" };
    mockAuthService.verifyTokens = vi.fn().mockResolvedValue(
      Result.ok({
        user: { id: "123", email: "test@example.com" },
        session: { access_token: "access", refresh_token: "refresh" },
      }),
    );
    await (await import("../controller.js")).callback(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(setAuthCookies).toHaveBeenCalledWith(mockRes, "access", "refresh");
  });

  it("should handle callback with failed verification", async () => {
    mockReq.body = { access_token: "access", refresh_token: "refresh" };
    mockAuthService.verifyTokens = vi.fn().mockResolvedValue(
      Result.fail({
        type: ErrorType.Unauthorized,
        message: "Invalid tokens",
        details: "Invalid tokens",
      }),
    );
    await (await import("../controller.js")).callback(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(400);
  });

  it("should handle callback with user without email", async () => {
    mockReq.body = { access_token: "access", refresh_token: "refresh" };
    mockAuthService.verifyTokens = vi.fn().mockResolvedValue(
      Result.ok({
        user: { id: "123" },
        session: { access_token: "access", refresh_token: "refresh" },
      }),
    );
    await (await import("../controller.js")).callback(mockReq as Request, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(200);
  });

  it("should handle verification status with valid email", async () => {
    mockReq.query = { email: "test@example.com" };
    mockAuthService.setupVerificationSSE = vi.fn();
    await (await import("../controller.js")).verificationStatus(mockReq as Request, mockRes as Response);
    expect(mockAuthService.setupVerificationSSE).toHaveBeenCalledWith(mockReq, mockRes, "test@example.com");
  });

  it("should handle getCurrentUser with authenticated user", async () => {
    const mockAuthReq = { user: { id: "123", email: "test@example.com" } };
    await (await import("../controller.js")).getCurrentUser(mockAuthReq as any, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      success: true,
      user: { id: "123", email: "test@example.com" },
    });
  });

  it("should handle getCurrentUser without authenticated user", async () => {
    const mockAuthReq = {};
    await (await import("../controller.js")).getCurrentUser(mockAuthReq as any, mockRes as Response);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});
