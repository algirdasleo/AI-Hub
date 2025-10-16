import z from "zod";
import { UserSchema } from "./user";
import { BaseResponseSchema, ErrorResponseSchema } from "@shared/types/core/index";

export const LoginSuccessSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  user: UserSchema,
  sessionToken: z.string().optional(),
});

export const SignupSuccessSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  requiresEmailVerification: z.boolean(),
});

export const LogoutSuccessSchema = BaseResponseSchema.extend({
  success: z.literal(true),
});

export const CurrentUserSuccessSchema = BaseResponseSchema.extend({
  success: z.literal(true),
  user: UserSchema,
});

export const LoginResponseSchema = z.discriminatedUnion("success", [LoginSuccessSchema, ErrorResponseSchema]);

export const SignupResponseSchema = z.discriminatedUnion("success", [SignupSuccessSchema, ErrorResponseSchema]);

export const LogoutResponseSchema = z.discriminatedUnion("success", [LogoutSuccessSchema, ErrorResponseSchema]);

export const CurrentUserResponseSchema = z.discriminatedUnion("success", [
  CurrentUserSuccessSchema,
  ErrorResponseSchema,
]);

export type LoginResponseDTO = z.infer<typeof LoginResponseSchema>;
export type SignupResponseDTO = z.infer<typeof SignupResponseSchema>;
export type LogoutResponseDTO = z.infer<typeof LogoutResponseSchema>;
export type CurrentUserResponseDTO = z.infer<typeof CurrentUserResponseSchema>;
