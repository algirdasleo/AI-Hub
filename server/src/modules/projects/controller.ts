import { Response } from "express";
import z from "zod";
import { AuthRequest } from "@server/modules/auth/index.js";
import {
  sendUnauthorized,
  sendBadRequest,
  sendInternalError,
  sendNotFound,
  validateAuth,
} from "@server/utils/index.js";
import { ProjectDTOSchema, DocumentDTOSchema } from "@shared/types/projects/index.js";
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  getProjectDocuments,
  deleteDocument,
} from "./repository.js";
import { processDocument } from "./service.js";
import multer from "multer";

const CreateProjectSchema = z.strictObject({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

const UpdateProjectSchema = z.strictObject({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

function mapDocumentToDTO(doc: any) {
  return {
    id: doc.id,
    name: doc.file_name,
    size: doc.file_size,
    uploadedAt: doc.uploaded_at,
    status: doc.status,
  };
}

function mapProjectWithDocs(project: any, documents: any[]) {
  return {
    id: project.id,
    name: project.name,
    description: project.description || "",
    createdAt: project.created_at,
    updatedAt: project.updated_at,
    documents: documents.map(mapDocumentToDTO),
  };
}

export async function createProjectHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const parseResult = CreateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendBadRequest(res, "Invalid project data");
    }

    const { name, description } = parseResult.data;
    const result = await createProject(auth.userId, name, description);

    if (!result.isSuccess) {
      return sendInternalError(res, result.error.message);
    }

    res.status(201).json({
      id: result.value.id,
      name: result.value.name,
      description: result.value.description,
      createdAt: result.value.created_at,
      documents: [],
    });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function getProjectsHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const result = await getUserProjects(auth.userId);

    if (!result.isSuccess) {
      return sendInternalError(res, result.error.message);
    }

    const projectsWithDocs = await Promise.all(
      result.value.map(async (project: any) => {
        const docsResult = await getProjectDocuments(project.id);
        const documents = docsResult.isSuccess ? docsResult.value : [];
        return mapProjectWithDocs(project, documents);
      }),
    );

    res.json(projectsWithDocs);
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function getProjectHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const { projectId } = req.params;
    const result = await getProjectById(projectId, auth.userId);

    if (!result.isSuccess) {
      return sendNotFound(res, result.error.message);
    }

    const docsResult = await getProjectDocuments(projectId);
    const documents = docsResult.isSuccess ? docsResult.value : [];

    res.json(mapProjectWithDocs(result.value, documents));
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function updateProjectHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const { projectId } = req.params;
    const parseResult = UpdateProjectSchema.safeParse(req.body);
    if (!parseResult.success) {
      return sendBadRequest(res, "Invalid project data");
    }

    const { name, description } = parseResult.data;
    const result = await updateProject(projectId, auth.userId, name, description);

    if (!result.isSuccess) {
      return sendNotFound(res, result.error.message);
    }

    const docsResult = await getProjectDocuments(projectId);
    const documents = docsResult.isSuccess ? docsResult.value : [];

    res.json(mapProjectWithDocs(result.value, documents));
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function deleteProjectHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const { projectId } = req.params;
    const result = await deleteProject(projectId, auth.userId);

    if (!result.isSuccess) {
      return sendNotFound(res, result.error.message);
    }

    res.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function uploadDocumentHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const { projectId } = req.params;
    const projectResult = await getProjectById(projectId, auth.userId);
    if (!projectResult.isSuccess) {
      return sendNotFound(res, "Project not found");
    }

    if (!req.file) {
      return sendBadRequest(res, "No file provided");
    }

    const { buffer, originalname, size } = req.file;
    const processResult = await processDocument(projectId, buffer, originalname, size);

    if (!processResult.isSuccess) {
      return sendBadRequest(res, processResult.error.message);
    }

    const { documentId, chunksCount, isNew } = processResult.value;

    if (!isNew) {
      return res.status(200).json({
        documentId,
        fileName: originalname,
        fileSize: size,
        chunksCount,
        status: "ready",
        message: "Document with same content already exists, using cached embeddings",
      });
    }

    res.status(201).json({
      documentId,
      fileName: originalname,
      fileSize: size,
      chunksCount,
      status: "ready",
      message: "Document processed successfully",
    });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export async function deleteDocumentHandler(req: AuthRequest, res: Response) {
  try {
    const auth = validateAuth(req);
    if (!auth.isValid) {
      return sendUnauthorized(res);
    }

    const { projectId, documentId } = req.params;

    const projectResult = await getProjectById(projectId, auth.userId);
    if (!projectResult.isSuccess) {
      return sendNotFound(res, "Project not found");
    }

    const result = await deleteDocument(documentId, projectId);

    if (!result.isSuccess) {
      return sendNotFound(res, result.error.message);
    }

    res.json({ success: true, message: "Document deleted successfully" });
  } catch (error) {
    sendInternalError(res, String(error));
  }
}

export const upload = multer({
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file: Express.Multer.File, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed"));
    }
  },
});
