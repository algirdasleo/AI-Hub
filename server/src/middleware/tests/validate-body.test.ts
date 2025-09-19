import { describe, it, expect, vi, beforeEach } from "vitest";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { validateBody } from "../validate-body.js";

describe("validateBody middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { body: {} };
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    mockNext = vi.fn();
  });

  const TestSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const TransformSchema = z.object({
    name: z.string(),
    age: z.coerce.number(),
  });

  it("should pass validation with valid data", () => {
    mockReq.body = { name: "John", age: 25 };

    const middleware = validateBody(TestSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({ name: "John", age: 25 });
  });

  it("should transform data according to schema", () => {
    mockReq.body = { name: "John", age: "25" };

    const middleware = validateBody(TransformSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body.age).toBe(25);
  });

  it("should reject invalid data", () => {
    mockReq.body = { name: "John" };

    const middleware = validateBody(TestSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: expect.any(Object),
    });
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle completely invalid body", () => {
    mockReq.body = "not an object";

    const middleware = validateBody(TestSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should handle empty body", () => {
    mockReq.body = {};

    const middleware = validateBody(TestSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it("should work with optional fields", () => {
    const OptionalSchema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });

    mockReq.body = { name: "John" };

    const middleware = validateBody(OptionalSchema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.body).toEqual({ name: "John" });
  });
});
