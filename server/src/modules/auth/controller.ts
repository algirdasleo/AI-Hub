import { Request, Response } from "express";
import { setAuthCookies, createUserFromSupabase, clearAuthCookies } from "@server/utils/index.js";
import { SignupResponseDTO, LoginResponseDTO, LogoutResponseDTO } from "@shared/types/auth/index.js";
import { ErrorResponseDTO } from "@shared/types/core/index.js";

import { AuthService } from "./service.js";

export async function signup(req: Request, res: Response) {
  const result = await AuthService.signup(req.body);

  if (!result.isSuccess) {
    return res.status(400).json({
      success: false,
      type: result.error.message,
      details: result.error.details,
    } as ErrorResponseDTO);
  }

  return res.status(201).json({
    success: true,
    requiresEmailVerification: true,
  } as SignupResponseDTO);
}

export async function login(req: Request, res: Response) {
  const result = await AuthService.login(req.body);

  if (!result.isSuccess) {
    return res.status(401).json({
      success: false,
      type: result.error.type,
      error: result.error.message,
    } as ErrorResponseDTO);
  }

  const data = result.value;
  setAuthCookies(res, data.session.access_token, data.session.refresh_token);

  res.status(200).json({
    success: true,
    user: createUserFromSupabase(data.user),
  } as LoginResponseDTO);
}

export function logout(_: Request, res: Response) {
  clearAuthCookies(res);

  res.status(200).json({
    success: true,
  } as LogoutResponseDTO);
}
