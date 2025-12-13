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
  console.log(
    `Auth check for ${req.path}: authHeader=${authHeader ? "present" : "missing"}, cookie=${accessToken ? "present" : "missing"}`,
  );

  if (authHeader?.startsWith("Bearer ")) {
    accessToken = authHeader.substring(7);
    console.log(`Using Bearer token from Authorization header`);
  }

  if (!accessToken) {
    console.log(`No access token found, returning 401`);
    return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
  }

  try {
    console.log(`Attempting to verify JWT...`);
    const { payload } = await jwtVerify(accessToken, JWKS);
    const jwtPayload = payload as SupabaseJWTPayload;
    req.user = createUserFromJWT(jwtPayload);
    console.log(`JWT verified successfully for user: ${jwtPayload.email}`);
    next();
  } catch (err: any) {
    console.error("JWT verification error:", err.code, err.message);
    // If access token is invalid and we have a refresh token, try to refresh
    if ((err.code === "ERR_JWT_EXPIRED" || err.claim === "exp") && refreshToken) {
      try {
        const { data, error } = await supabaseServer.auth.refreshSession({
          refresh_token: refreshToken,
        });

        if (error || !data.session) {
          res.clearCookie("sb-access-token");
          res.clearCookie("sb-refresh-token");
          return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
        }

        setAuthCookies(res, data.session.access_token, data.session.refresh_token);
        req.user = createUserFromSupabase(data.session.user);
        next();
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        res.clearCookie("sb-access-token");
        res.clearCookie("sb-refresh-token");
        return res.status(401).json({ type: ErrorType.Unauthorized } as ErrorResponseDTO);
      }
    } else {
      console.error("JWT verification failed:", err);
      res.clearCookie("sb-access-token");
      res.clearCookie("sb-refresh-token");
      return res.status(401).json({ type: ErrorType.Unauthorized, message: "Invalid token" } as ErrorResponseDTO);
    }
  }
}
