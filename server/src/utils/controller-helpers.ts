import { Response } from "express";
import { ErrorType } from "@shared/utils/error-type.js";
import { UidQuerySchema } from "@shared/types/common/index.js";
import { AuthRequest } from "@server/modules/auth/index.js";

export function sendUnauthorized(res: Response) {
  return res.status(401).json({ success: false, type: ErrorType.Unauthorized, message: "User not authenticated" });
}

export function sendBadRequest(res: Response, message: string) {
  return res.status(400).json({
    success: false,
    type: ErrorType.InvalidParameters,
    message,
  });
}

export function sendInternalError(res: Response, message: string) {
  return res.status(500).json({
    success: false,
    type: ErrorType.InternalServerError,
    message,
  });
}

export function sendNotFound(res: Response, message: string) {
  return res.status(404).json({
    success: false,
    type: ErrorType.NotFound,
    message,
  });
}

export function validateAuth(req: AuthRequest): { isValid: true; userId: string } | { isValid: false } {
  if (!req.user) {
    return { isValid: false };
  }
  return { isValid: true, userId: req.user.id };
}

export function getUidFromQuery(req: AuthRequest): string | null {
  const result = UidQuerySchema.safeParse(req.query);
  if (!result.success) {
    return null;
  }
  return result.data.uid;
}
