import { Response } from "express";
import { SupabaseJWTPayload } from "@server/modules/auth/types.js";
import { SubscriptionTier, SupabaseUser, UserRole, UserSchema } from "@shared/types/auth/index.js";

export const createUserFromJWT = (payload: SupabaseJWTPayload) =>
  UserSchema.parse({
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    display_name: payload.user_metadata.display_name,
    subscription_tier: payload.app_metadata.subscription_tier,
  });

export const createUserFromSupabase = (supabaseUser: SupabaseUser) =>
  UserSchema.parse({
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: supabaseUser.user_metadata.role || UserRole.USER,
    display_name: supabaseUser.user_metadata.display_name || "user",
    subscription_tier: supabaseUser.app_metadata.subscription_tier || SubscriptionTier.FREE,
  });

export const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
  };

  res.cookie("sb-access-token", accessToken, cookieOptions);
  res.cookie("sb-refresh-token", refreshToken, cookieOptions);
};
