import { z } from "zod";

export const DocumentDTOSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  size: z.number().min(0),
  uploadedAt: z.string(),
  status: z.string().optional(),
  type: z.string().optional(),
});

export type DocumentDTO = z.infer<typeof DocumentDTOSchema>;

export const ProjectDTOSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  description: z.string().default(""),
  createdAt: z.string(),
  updatedAt: z.string().optional(),
  documents: z.array(DocumentDTOSchema).default([]),
});

export type ProjectDTO = z.infer<typeof ProjectDTOSchema>;

export const DocumentSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  size: z.number().min(0),
  uploadedAt: z.string(),
  type: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const ProjectSchema = z.strictObject({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().default(""),
  createdAt: z.string(),
  documents: z.array(DocumentSchema).default([]),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectRequestSchema = z.strictObject({
  name: z.string().min(1, "Project name is required"),
  description: z.string().optional().default(""),
});

export type CreateProjectRequest = z.infer<typeof CreateProjectRequestSchema>;

export const ProjectResponseSchema = ProjectSchema;

export type ProjectResponse = z.infer<typeof ProjectResponseSchema>;

export const DocumentUploadRequestSchema = z.strictObject({
  projectId: z.string(),
  files: z.array(z.instanceof(File)).or(
    z.array(
      z.object({
        name: z.string(),
        size: z.number(),
        type: z.string(),
      }),
    ),
  ),
});

export type DocumentUploadRequest = z.infer<typeof DocumentUploadRequestSchema>;

export const ProjectListResponseDTOSchema = z.array(ProjectDTOSchema);

export type ProjectListResponseDTO = z.infer<typeof ProjectListResponseDTOSchema>;

export * from "./conversation.js";
