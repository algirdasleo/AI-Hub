import z from "zod";
import { User as SBUser } from "@supabase/supabase-js";

export const UserRoleSchema = z.enum(["admin", "user"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const SubscriptionTierSchema = z.enum(["free", "pro", "enterprise"]);
export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema>;

export const UserSchema = z.strictObject({
  id: z.uuid(),
  display_name: z.string(),
  email: z.email(),
  role: UserRoleSchema,
  subscription_tier: SubscriptionTierSchema,
});

export type User = z.infer<typeof UserSchema>;

export type SupabaseUser = Pick<SBUser, "id" | "email" | "role" | "app_metadata" | "user_metadata">;
