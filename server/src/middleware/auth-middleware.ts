import { supabaseServer } from "@server/db/supabase.js";
import { AuthRequest, SupabaseJWTPayload } from "@server/modules/auth/types.js";
import { createUserFromJWT, createUserFromSupabase, setAuthCookies } from "@server/utils/auth.js";
import { ErrorResponseDTO } from "@shared/types/core/index.js";
import { ErrorType } from "@shared/utils/error-type.js";
import { Response, NextFunction } from "express";
import { jwtVerify } from "jose/jwt/verify";

const SUPABASE_JWT_SECRET = process.env.SUPABASE_JWT_SECRET!;

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const { "sb-access-token": accessToken, "sb-refresh-token": refreshToken } = req.cookies;

  if (!accessToken || !refreshToken) {
    return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
  }

  try {
    const { payload } = await jwtVerify(accessToken, new TextEncoder().encode(SUPABASE_JWT_SECRET));
    const jwtPayload = payload as SupabaseJWTPayload;

    const isExpired = (jwtPayload.exp || 0) <= Math.floor(Date.now() / 1000);

    if (isExpired) {
      const { data, error } = await supabaseServer.auth.refreshSession({
        refresh_token: refreshToken,
      });

      if (error || !data.session) {
        return res.status(401).json({ type: ErrorType.Unauthorized, message: error?.message } as ErrorResponseDTO);
      }

      setAuthCookies(res, data.session.access_token, data.session.refresh_token);
      req.user = createUserFromSupabase(data.session.user);
    } else {
      req.user = createUserFromJWT(jwtPayload);
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
