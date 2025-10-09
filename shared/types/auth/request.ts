import z from "zod";

const passwordSchema = z
  .string()
  .min(6, { message: "Password must be at least 6 characters long" })
  .max(20, { message: "Password must be at most 20 characters long" })
  .refine((password) => /[a-z]/.test(password), {
    message: "Password must contain at least one lowercase letter",
  })
  .refine((password) => /[A-Z]/.test(password), {
    message: "Password must contain at least one uppercase letter",
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "Password must contain at least one number",
  })
  .refine((password) => /[^a-zA-Z0-9]/.test(password), {
    message: "Password must contain at least one special character",
  });

const BaseAuthSchema = z.strictObject({
  email: z.email().transform((email) => email.toLowerCase().trim()),
  password: passwordSchema,
});

export const SignupRequestSchema = BaseAuthSchema.extend({
  username: z.string().min(3).max(30).optional(),
});
export const LoginRequestSchema = BaseAuthSchema.extend({});

export type SignupRequestDTO = z.infer<typeof SignupRequestSchema>;
export type LoginRequestDTO = z.infer<typeof LoginRequestSchema>;
