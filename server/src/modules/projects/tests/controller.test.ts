import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";

// Mock dependencies before importing controller
vi.mock("../repository.js", () => ({
  createProject: vi.fn(),
  getProjectById: vi.fn(),
  getUserProjects: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectDocuments: vi.fn(),
  deleteDocument: vi.fn(),
}));

vi.mock("../service.js", () => ({
  processDocument: vi.fn(),
}));

vi.mock("@server/utils/index.js", () => ({
  sendUnauthorized: vi.fn(),
  sendBadRequest: vi.fn(),
  sendInternalError: vi.fn(),
  sendNotFound: vi.fn(),
  validateAuth: vi.fn(),
}));

vi.mock("multer", () => ({
  default: vi.fn().mockReturnValue({
    single: vi.fn().mockReturnValue(vi.fn()),
  }),
}));

import {
  createProjectHandler,
  getProjectsHandler,
  getProjectHandler,
  updateProjectHandler,
  deleteProjectHandler,
  uploadDocumentHandler,
  deleteDocumentHandler,
} from "../controller.js";
import * as repo from "../repository.js";
import * as utils from "@server/utils/index.js";

describe("projects controller", () => {
  const mockReq = (body = {}, userId = "user-123", params = {}) => ({
    body,
    params,
    user: { id: userId },
    cookies: { accessToken: "token" },
    file: undefined as any,
  });

  const mockRes = () => {
    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
    return res;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.validateAuth).mockReturnValue({ isValid: true, userId: "user-123" });
  });

  describe("createProjectHandler", () => {
    it("creates project successfully", async () => {
      const mockProject = {
        id: "proj-1",
        name: "Test",
        description: "Desc",
        created_at: new Date(),
      };
      vi.mocked(repo.createProject).mockResolvedValue(Result.ok(mockProject));

      const req = mockReq({ name: "Test" });
      const res = mockRes();

      await createProjectHandler(req as any, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    it("returns 401 when unauthorized", async () => {
      vi.mocked(utils.validateAuth).mockReturnValue({ isValid: false } as any);

      const req = mockReq({ name: "Test" });
      const res = mockRes();

      await createProjectHandler(req as any, res);

      expect(utils.sendUnauthorized).toHaveBeenCalledWith(res);
    });

    it("returns 400 for invalid data", async () => {
      const req = mockReq({}); // Missing required 'name'
      const res = mockRes();

      await createProjectHandler(req as any, res);

      expect(utils.sendBadRequest).toHaveBeenCalled();
    });

    it("returns 500 on database error", async () => {
      vi.mocked(repo.createProject).mockResolvedValue(Result.fail({ type: "DatabaseError", message: "DB error" }));

      const req = mockReq({ name: "Test" });
      const res = mockRes();

      await createProjectHandler(req as any, res);

      expect(utils.sendInternalError).toHaveBeenCalled();
    });
  });

  describe("getProjectsHandler", () => {
    it("gets all user projects successfully", async () => {
      const mockProjects = [
        {
          id: "proj-1",
          name: "Project 1",
          description: "Desc",
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      vi.mocked(repo.getUserProjects).mockResolvedValue(Result.ok(mockProjects));
      vi.mocked(repo.getProjectDocuments).mockResolvedValue(Result.ok([]));

      const req = mockReq();
      const res = mockRes();

      await getProjectsHandler(req as any, res);

      expect(res.json).toHaveBeenCalled();
    });

    it("returns 401 when unauthorized", async () => {
      vi.mocked(utils.validateAuth).mockReturnValue({ isValid: false } as any);

      const req = mockReq();
      const res = mockRes();

      await getProjectsHandler(req as any, res);

      expect(utils.sendUnauthorized).toHaveBeenCalled();
    });
  });

  describe("getProjectHandler", () => {
    it("gets single project with documents", async () => {
      const mockProject = {
        id: "proj-1",
        name: "Test",
        description: "Desc",
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.mocked(repo.getProjectById).mockResolvedValue(Result.ok(mockProject));
      vi.mocked(repo.getProjectDocuments).mockResolvedValue(Result.ok([]));

      const req = mockReq({}, "user-123", { projectId: "proj-1" });
      const res = mockRes();

      await getProjectHandler(req as any, res);

      expect(res.json).toHaveBeenCalled();
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(repo.getProjectById).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));

      const req = mockReq({}, "user-123", { projectId: "invalid" });
      const res = mockRes();

      await getProjectHandler(req as any, res);

      expect(utils.sendNotFound).toHaveBeenCalled();
    });
  });

  describe("updateProjectHandler", () => {
    it("updates project successfully", async () => {
      const mockProject = {
        id: "proj-1",
        name: "Updated",
        description: "New desc",
        created_at: new Date(),
        updated_at: new Date(),
      };
      vi.mocked(repo.updateProject).mockResolvedValue(Result.ok(mockProject));
      vi.mocked(repo.getProjectDocuments).mockResolvedValue(Result.ok([]));

      const req = mockReq({ name: "Updated" }, "user-123", { projectId: "proj-1" });
      const res = mockRes();

      await updateProjectHandler(req as any, res);

      expect(res.json).toHaveBeenCalled();
    });

    it("returns 400 for invalid update data", async () => {
      const req = mockReq({ name: "" }, "user-123", { projectId: "proj-1" });
      const res = mockRes();

      await updateProjectHandler(req as any, res);

      expect(utils.sendBadRequest).toHaveBeenCalled();
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(repo.updateProject).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));

      const req = mockReq({ name: "Updated" }, "user-123", { projectId: "invalid" });
      const res = mockRes();

      await updateProjectHandler(req as any, res);

      expect(utils.sendNotFound).toHaveBeenCalled();
    });
  });

  describe("deleteProjectHandler", () => {
    it("deletes project successfully", async () => {
      vi.mocked(repo.deleteProject).mockResolvedValue(Result.ok(null));

      const req = mockReq({}, "user-123", { projectId: "proj-1" });
      const res = mockRes();

      await deleteProjectHandler(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Project deleted successfully",
      });
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(repo.deleteProject).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));

      const req = mockReq({}, "user-123", { projectId: "invalid" });
      const res = mockRes();

      await deleteProjectHandler(req as any, res);

      expect(utils.sendNotFound).toHaveBeenCalled();
    });
  });

  describe("deleteDocumentHandler", () => {
    it("deletes document successfully", async () => {
      vi.mocked(repo.getProjectById).mockResolvedValue(
        Result.ok({ id: "proj-1", name: "Test", description: "", created_at: new Date(), updated_at: new Date() }),
      );
      vi.mocked(repo.deleteDocument).mockResolvedValue(Result.ok(null));

      const req = mockReq({}, "user-123", { projectId: "proj-1", documentId: "doc-1" });
      const res = mockRes();

      await deleteDocumentHandler(req as any, res);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Document deleted successfully",
      });
    });

    it("returns 401 when unauthorized", async () => {
      vi.mocked(utils.validateAuth).mockReturnValue({ isValid: false } as any);

      const req = mockReq({}, "user-123", { projectId: "proj-1", documentId: "doc-1" });
      const res = mockRes();

      await deleteDocumentHandler(req as any, res);

      expect(utils.sendUnauthorized).toHaveBeenCalled();
    });

    it("returns 404 when document not found", async () => {
      vi.mocked(repo.getProjectById).mockResolvedValue(
        Result.ok({ id: "proj-1", name: "Test", description: "", created_at: new Date(), updated_at: new Date() }),
      );
      vi.mocked(repo.deleteDocument).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));

      const req = mockReq({}, "user-123", { projectId: "proj-1", documentId: "invalid" });
      const res = mockRes();

      await deleteDocumentHandler(req as any, res);

      expect(utils.sendNotFound).toHaveBeenCalled();
    });
  });

  describe("uploadDocumentHandler", () => {
    it("returns 401 when unauthorized", async () => {
      vi.mocked(utils.validateAuth).mockReturnValue({ isValid: false } as any);

      const req = mockReq({}, "user-123", { projectId: "proj-1" });
      req.file = { filename: "test.pdf" };
      const res = mockRes();

      await uploadDocumentHandler(req as any, res);

      expect(utils.sendUnauthorized).toHaveBeenCalled();
    });

    it("returns 400 when no file provided", async () => {
      vi.mocked(repo.getProjectById).mockResolvedValue(
        Result.ok({ id: "proj-1", name: "Test", description: "", created_at: new Date(), updated_at: new Date() }),
      );

      const req = mockReq({}, "user-123", { projectId: "proj-1" });
      // No file attached
      const res = mockRes();

      await uploadDocumentHandler(req as any, res);

      expect(utils.sendBadRequest).toHaveBeenCalled();
    });

    it("returns 404 when project not found", async () => {
      vi.mocked(repo.getProjectById).mockResolvedValue(Result.fail({ type: "NotFound", message: "Not found" }));

      const req = mockReq({}, "user-123", { projectId: "invalid" });
      req.file = { filename: "test.pdf" };
      const res = mockRes();

      await uploadDocumentHandler(req as any, res);

      expect(utils.sendNotFound).toHaveBeenCalled();
    });
  });
});
