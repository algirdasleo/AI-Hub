import z from "zod";
import { User as SBUser } from "@supabase/supabase-js";

export enum UserRole {
  ADMIN = "admin",
  USER = "user",
}
export const UserRoleSchema = z.enum(UserRole);

export enum SubscriptionTier {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}
export const SubscriptionTierSchema = z.enum(SubscriptionTier);

export const UserSchema = z.strictObject({
  id: z.uuid(),
  display_name: z.string(),
  email: z.email(),
  role: UserRoleSchema,
  subscription_tier: SubscriptionTierSchema,
});

export type User = z.infer<typeof UserSchema>;

export type SupabaseUser = Pick<SBUser, "id" | "email" | "role" | "app_metadata" | "user_metadata">;
