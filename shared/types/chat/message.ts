import { z } from "zod";

export const ToolPartSchema = z.strictObject({
  type: z.literal("tool"),
  toolName: z.string(),
  data: z.unknown(),
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

export enum MessageRole {
  USER = "user",
  ASSISTANT = "assistant",
  SYSTEM = "system",
}

export const UIMessageSchema = z.strictObject({
  id: z.string(),
  role: z.enum(Object.values(MessageRole)),
  parts: z.array(PartSchema),
  tools: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UIMessage = z.infer<typeof UIMessageSchema>;
