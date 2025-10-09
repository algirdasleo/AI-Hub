import z from "zod";
import { BaseStreamRequestSchema, ModelConfigSchema } from "../common/index.js";

export const ChatStreamSchema = BaseStreamRequestSchema.extend(ModelConfigSchema.shape);

export type ChatStreamParams = z.infer<typeof ChatStreamSchema>;
