import { z } from "zod";

export const ChatJobResponseSchema = z.strictObject({
  uid: z.string(),
  conversationId: z.uuid(),
});

export type ChatJobResponse = z.infer<typeof ChatJobResponseSchema>;
