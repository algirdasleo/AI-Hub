import { z } from "zod";

export const DocumentSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  size: z.number().min(0),
  uploadedAt: z.iso.datetime(),
  type: z.string(),
});

export type Document = z.infer<typeof DocumentSchema>;

export const ProjectSchema = z.strictObject({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  description: z.string().default(""),
  createdAt: z.iso.datetime(),
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

export const ProjectListResponseSchema = z.strictObject({
  success: z.boolean(),
  projects: z.array(ProjectSchema),
});

export type ProjectListResponse = z.infer<typeof ProjectListResponseSchema>;
