import { Response, NextFunction } from "express";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { ErrorType } from "@shared/utils/error-type.js";
import { ErrorResponseDTO } from "@shared/types/core/index.js";
import { supabaseServer } from "@server/db/supabase.js";
import { AuthRequest, SupabaseJWTPayload } from "@server/modules/auth/index.js";
import { createUserFromJWT, createUserFromSupabase, setAuthCookies } from "@server/utils/index.js";

if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable must be set");
}

const JWKS = createRemoteJWKSet(new URL(`${process.env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  let accessToken = req.cookies["sb-access-token"];
  let refreshToken = req.cookies["sb-refresh-token"];

  const authHeader = req.headers.authorization;
  const headerRefreshToken = req.headers["x-refresh-token"] as string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.substring(7);
  }

  if (headerRefreshToken) {
    refreshToken = headerRefreshToken;
  }

  try {
    const { payload } = await jwtVerify(accessToken, JWKS);
    const jwtPayload = payload as SupabaseJWTPayload;
    req.user = createUserFromJWT(jwtPayload);
    next();
  } catch (err: any) {
    console.error("JWT verification error:", err.code, err.message);

    if (err.code === "ERR_JWT_EXPIRED" && refreshToken) {
      try {
        const { data, error } = await supabaseServer.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          console.error("Token refresh failed:", error?.message);
          res.clearCookie("sb-access-token");
          res.clearCookie("sb-refresh-token");
          return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
        }

        try {
          const { payload: newPayload } = await jwtVerify(data.session.access_token, JWKS);
          const newJwtPayload = newPayload as SupabaseJWTPayload;
          req.user = createUserFromSupabase(data.session.user);
        } catch (verifyErr) {
          req.user = createUserFromSupabase(data.session.user);
        }
        setAuthCookies(res, data.session.access_token, data.session.refresh_token);
        res.setHeader("X-New-Access-Token", data.session.access_token);
        res.setHeader("X-New-Refresh-Token", data.session.refresh_token);
        req.user = createUserFromSupabase(data.session.user);
        next();
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        res.clearCookie("sb-access-token");
        res.clearCookie("sb-refresh-token");
        return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
      }
    } else {
      console.error("JWT verification failed");
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");
      return res.status(401).json({
        type: ErrorType.Unauthorized,
        message: "Invalid or expired token",
      } as ErrorResponseDTO);
    }
  }
}
