import z from "zod";
import { BaseStreamRequestSchema, ModelConfigSchema } from "../common/index.js";

export const ChatStreamSchema = BaseStreamRequestSchema.extend({
  ...ModelConfigSchema.shape,
  projectId: z.uuid().optional(),
});

export type ChatStreamParams = z.infer<typeof ChatStreamSchema>;
