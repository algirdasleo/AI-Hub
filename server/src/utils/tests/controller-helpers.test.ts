import { describe, it, expect, vi } from "vitest";
import { Response } from "express";
import { AuthRequest } from "@server/modules/auth/index.js";
import { ErrorType } from "@shared/utils/error-type.js";
import {
  sendUnauthorized,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  validateAuth,
  getUidFromQuery,
} from "../controller-helpers.js";

describe("controller-helpers", () => {
  describe("sendUnauthorized", () => {
    it("should send 401 with unauthorized error", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      sendUnauthorized(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.Unauthorized,
        message: "User not authenticated",
      });
    });
  });

  describe("sendBadRequest", () => {
    it("should send 400 with custom message", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      sendBadRequest(mockRes, "Invalid input");

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.InvalidParameters,
        message: "Invalid input",
      });
    });
  });

  describe("sendInternalError", () => {
    it("should send 500 with custom message", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      sendInternalError(mockRes, "Database error");

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.InternalServerError,
        message: "Database error",
      });
    });
  });

  describe("sendNotFound", () => {
    it("should send 404 with custom message", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      sendNotFound(mockRes, "Resource not found");

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        type: ErrorType.NotFound,
        message: "Resource not found",
      });
    });
  });

  describe("validateAuth", () => {
    it("should return valid with userId when user exists", () => {
      const mockReq = {
        user: { id: "user-123", email: "test@test.com" },
      } as AuthRequest;

      const result = validateAuth(mockReq);

      expect(result).toEqual({ isValid: true, userId: "user-123" });
    });

    it("should return invalid when user is missing", () => {
      const mockReq = {} as AuthRequest;

      const result = validateAuth(mockReq);

      expect(result).toEqual({ isValid: false });
    });

    it("should return invalid when user is undefined", () => {
      const mockReq = { user: undefined } as AuthRequest;

      const result = validateAuth(mockReq);

      expect(result).toEqual({ isValid: false });
    });
  });

  describe("getUidFromQuery", () => {
    it("should return uid when valid uid in query", () => {
      const mockReq = {
        query: { uid: "abc123" },
      } as unknown as AuthRequest;

      const result = getUidFromQuery(mockReq);

      expect(result).toBe("abc123");
    });

    it("should return null when uid is missing", () => {
      const mockReq = {
        query: {},
      } as unknown as AuthRequest;

      const result = getUidFromQuery(mockReq);

      expect(result).toBeNull();
    });

    it("should return null when query is invalid", () => {
      const mockReq = {
        query: { uid: 123 },
      } as unknown as AuthRequest;

      const result = getUidFromQuery(mockReq);

      expect(result).toBeNull();
    });
  });
});
