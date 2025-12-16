import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { Response } from "express";
import { AuthRequest } from "@server/modules/auth/index.js";

vi.mock("jose", () => ({
  jwtVerify: vi.fn(),
  createRemoteJWKSet: vi.fn().mockReturnValue({}),
}));

vi.mock("@server/db/supabase.js", () => ({
  supabaseServer: {
    auth: {
      refreshSession: vi.fn(),
    },
  },
}));

vi.mock("@server/utils/index.js", () => ({
  createUserFromJWT: vi.fn().mockReturnValue({ id: "jwt-user", email: "jwt@test.com" }),
  createUserFromSupabase: vi.fn().mockReturnValue({ id: "supabase-user", email: "supabase@test.com" }),
  setAuthCookies: vi.fn(),
  clearAuthCookies: vi.fn(),
}));

import { supabaseServer } from "@server/db/supabase.js";
import { setAuthCookies } from "@server/utils/index.js";
import { jwtVerify } from "jose";

import { authMiddleware } from "../auth-middleware.js";

describe("authMiddleware", () => {
  const mockReq = () => ({ cookies: {}, headers: {}, user: undefined }) as Partial<AuthRequest>;
  const mockRes = () =>
    ({
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      clearCookie: vi.fn(),
      setHeader: vi.fn(),
    }) as Partial<Response>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should reject requests with missing tokens", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle valid token", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();
    req.cookies = { "sb-access-token": "valid", "sb-refresh-token": "refresh" };
    (jwtVerify as any).mockResolvedValue({
      payload: { exp: Math.floor(Date.now() / 1000) + 3600 },
    });

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it("should refresh expired token", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();
    req.cookies = { "sb-access-token": "expired", "sb-refresh-token": "refresh" };

    let callCount = 0;
    (jwtVerify as any).mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject({
          code: "ERR_JWT_EXPIRED",
          claim: "exp",
        });
      }
      return Promise.resolve({
        payload: { email: "test@example.com", sub: "1", aud: "authenticated", iat: 1000, exp: 4600 },
      });
    });
    (supabaseServer.auth.refreshSession as any).mockResolvedValue({
      data: {
        session: { access_token: "new", refresh_token: "new", user: { id: "1", email: "test@example.com" } },
      },
      error: null,
    });

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(jwtVerify).toHaveBeenCalledTimes(2);
    expect(setAuthCookies).toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });

  it("should handle refresh failure", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();
    req.cookies = { "sb-access-token": "expired", "sb-refresh-token": "invalid" };
    (jwtVerify as any).mockRejectedValue({
      code: "ERR_JWT_EXPIRED",
      claim: "exp",
    });
    (supabaseServer.auth.refreshSession as any).mockResolvedValue({
      data: { session: null },
      error: { message: "Invalid" },
    });

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle invalid JWT", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();
    req.cookies = { "sb-access-token": "invalid", "sb-refresh-token": "refresh" };
    (jwtVerify as any).mockRejectedValue(new Error("Invalid"));

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle refresh error exception", async () => {
    const req = mockReq();
    const res = mockRes();
    const mockNext = vi.fn();
    req.cookies = { "sb-access-token": "expired", "sb-refresh-token": "refresh" };
    (jwtVerify as any).mockRejectedValue({ code: "ERR_JWT_EXPIRED" });
    (supabaseServer.auth.refreshSession as any).mockRejectedValue(new Error("Refresh failed"));

    await authMiddleware(req as AuthRequest, res as Response, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
