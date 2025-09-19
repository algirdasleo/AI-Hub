import { z } from "zod";
import { UIMessageSchema } from "./message.js";

export const ConversationSchema = z.strictObject({
  id: z.uuid(),
  user_id: z.uuid(),
  title: z.string().min(3).max(50),
  createdAt: z.iso.datetime().transform((str) => new Date(str)),
  updatedAt: z.iso.datetime().transform((str) => new Date(str)),
  messages: z.array(UIMessageSchema).default([]),
});

export type Conversation = z.infer<typeof ConversationSchema>;
