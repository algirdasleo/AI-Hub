import { z } from "zod";

export const DeleteConversationRequestSchema = z.strictObject({
  conversationId: z.string().uuid("Invalid conversation ID"),
});

export type DeleteConversationRequest = z.infer<typeof DeleteConversationRequestSchema>;

export const DeleteConversationResponseSchema = z.strictObject({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteConversationResponse = z.infer<typeof DeleteConversationResponseSchema>;
