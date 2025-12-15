import { z } from "zod";
import { UIMessageSchema } from "../chat/message.js";

export const ProjectConversationDTOSchema = z.strictObject({
  id: z.string().uuid(),
  project_id: z.string(),
  user_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

export type ProjectConversationDTO = z.infer<typeof ProjectConversationDTOSchema>;

export const ProjectConversationSchema = z.strictObject({
  id: z.string().uuid(),
  projectId: z.string(),
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  messages: z.array(UIMessageSchema).default([]),
});

export type ProjectConversation = z.infer<typeof ProjectConversationSchema>;

export const CreateProjectConversationRequestSchema = z.strictObject({
  projectId: z.string(),
  title: z.string().min(1).max(200),
});

export type CreateProjectConversationRequest = z.infer<typeof CreateProjectConversationRequestSchema>;

export const ProjectConversationListResponseDTOSchema = z.array(ProjectConversationDTOSchema);

export type ProjectConversationListResponseDTO = z.infer<typeof ProjectConversationListResponseDTOSchema>;

export const ProjectConversationResponseDTOSchema = ProjectConversationDTOSchema;

export type ProjectConversationResponseDTO = z.infer<typeof ProjectConversationResponseDTOSchema>;
