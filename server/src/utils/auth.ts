import { Response } from "express";
import { SupabaseJWTPayload } from "@server/modules/auth/index.js";
import { SubscriptionTier, SupabaseUser, UserRole, UserSchema } from "@shared/types/auth/index.js";

export const createUserFromJWT = (payload: SupabaseJWTPayload) =>
  UserSchema.parse({
    id: payload.sub,
    email: payload.email,
    role: payload.user_metadata.role,
    display_name: payload.user_metadata.display_name,
    subscription_tier: payload.user_metadata.subscription_tier,
  });

export const createUserFromSupabase = (supabaseUser: SupabaseUser) =>
  UserSchema.parse({
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: supabaseUser.user_metadata.role ?? "user",
    display_name: supabaseUser.user_metadata.display_name,
    subscription_tier: supabaseUser.app_metadata?.subscription_tier ?? "free",
  });

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none" as const,
    ...(isProduction && { domain: ".europe-west1.run.app" }),
  };

  res.cookie("sb-access-token", accessToken, cookieOptions);
  res.cookie("sb-refresh-token", refreshToken, cookieOptions);
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("sb-access-token");
  res.clearCookie("sb-refresh-token");
};
