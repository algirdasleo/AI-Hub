import { z } from "zod";

export const ToolPartSchema = z.strictObject({
  type: z.literal("tool"),
  toolName: z.string(),
  data: z.any(),
});

export const TextPartSchema = z.strictObject({
  type: z.literal("text"),
  text: z.string(),
});

export const ImagePartSchema = z.strictObject({
  type: z.literal("image"),
  url: z.url(),
});

export const PartSchema = z.union([TextPartSchema, ImagePartSchema, ToolPartSchema]);

export const UIMessageSchema = z.strictObject({
  id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  parts: z.array(PartSchema),
  tools: z.record(z.string(), z.any()).optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type UIMessage = z.infer<typeof UIMessageSchema>;
