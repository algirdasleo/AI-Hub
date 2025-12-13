import { Request, Response } from "express";
import { setAuthCookies, createUserFromSupabase, clearAuthCookies } from "@server/utils/index.js";
import {
  SignupResponseDTO,
  LoginResponseDTO,
  LogoutResponseDTO,
  CurrentUserResponseDTO,
} from "@shared/types/auth/index.js";
import { ErrorResponseDTO } from "@shared/types/core/index.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { AuthService } from "./service.js";
import { verificationEmitter } from "./verification-emitter.js";
import { AuthRequest } from "./types.js";

function handleError(
  res: Response,
  statusCode: number,
  error: { type: string; message: string; details?: string },
) {
  return res.status(statusCode).json({
    success: false,
    type: error.type,
    error: error.message,
    details: error.details,
  } as ErrorResponseDTO);
}

export async function signup(req: Request, res: Response) {
  const result = await AuthService.signup(req.body);

  if (!result.isSuccess) {
    return handleError(res, 400, { ...result.error, details: String(result.error.details ?? "") });
  }

  return res.status(201).json({
    success: true,
    requiresEmailVerification: result.value.requiresEmailVerification,
  } as SignupResponseDTO);
}

export async function login(req: Request, res: Response) {
  const result = await AuthService.login(req.body);

  if (!result.isSuccess) {
    return handleError(res, 401, { ...result.error, details: String(result.error.details ?? "") });
  }

  const data = result.value;
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);

  return res.status(200).json({
    success: true,
    user: createUserFromSupabase(data.user),
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  } as LoginResponseDTO);
}

export function logout(_: Request, res: Response) {
  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
  } as LogoutResponseDTO);
}

export async function callback(req: Request, res: Response) {
  const { access_token, refresh_token } = req.body;

  if (!access_token || !refresh_token) {
    return handleError(res, 400, {
      type: ErrorType.InvalidParameters,
      message: "Missing authentication tokens",
    });
  }

  const result = await AuthService.verifyTokens(access_token, refresh_token);

  if (!result.isSuccess) {
    return handleError(res, 400, { ...result.error, details: String(result.error.details ?? "") });
  }

  const data = result.value;
  setAuthCookies(res, access_token, refresh_token);

  if (data.user?.email) {
    verificationEmitter.notifyVerification(data.user.id, data.user.email);
  }

  return res.status(200).json({
    success: true,
    user: data.user ? createUserFromSupabase(data.user) : undefined,
    access_token: access_token,
    refresh_token: refresh_token,
  } as LoginResponseDTO);
}

export function verificationStatus(req: Request, res: Response) {
  const email = req.query.email as string;

  if (!email) {
    return handleError(res, 400, {
      type: ErrorType.InvalidParameters,
      message: "Email parameter is required",
    });
  }

  AuthService.setupVerificationSSE(req, res, email);
}

export function getCurrentUser(req: AuthRequest, res: Response) {
  if (!req.user) {
    return handleError(res, 401, {
      type: ErrorType.Unauthorized,
      message: "User not authenticated",
    });
  }

  const response = {
    success: true,
    user: req.user,
  } as CurrentUserResponseDTO;

  return res.status(200).json(response);
}

export async function verifyTokens(req: Request, res: Response) {
  const { accessToken, refreshToken } = req.body;

  console.log("[verifyTokens] Received token refresh request");

  if (!accessToken || !refreshToken) {
    console.log("[verifyTokens] Missing tokens in request body");
    return handleError(res, 400, {
      type: ErrorType.InvalidParameters,
      message: "Missing authentication tokens",
    });
  }

  console.log("[verifyTokens] Calling AuthService.verifyTokens");
  const result = await AuthService.verifyTokens(accessToken, refreshToken);

  if (!result.isSuccess) {
    console.log("[verifyTokens] Token verification failed:", result.error);
    return handleError(res, 401, { ...result.error, details: String(result.error.details ?? "") });
  }

  const data = result.value;
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);

  console.log("[verifyTokens] Successfully refreshed tokens");
  return res.status(200).json({
    success: true,
    user: data.user ? createUserFromSupabase(data.user) : undefined,
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  } as LoginResponseDTO);
}
