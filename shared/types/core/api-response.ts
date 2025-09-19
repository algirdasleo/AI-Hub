import { z } from "zod";
import { ErrorType } from "@shared/utils/index.js";

export const BaseResponseSchema = z.strictObject({
  success: z.boolean(),
});

export const ErrorResponseSchema = z.strictObject({
  success: z.literal(false),
  type: z.enum(ErrorType),
  message: z.string().optional(),
  code: z.string().optional(),
});

export type ErrorResponseDTO = z.infer<typeof ErrorResponseSchema>;
