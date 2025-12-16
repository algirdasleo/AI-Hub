import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";

vi.mock("@server/db/supabase.js", () => ({
  supabaseServer: {
    from: vi.fn(),
  },
}));

import { supabaseServer } from "@server/db/supabase.js";
import {
  createProject,
  getProjectById,
  getUserProjects,
  updateProject,
  deleteProject,
  getProjectDocuments,
  deleteDocument,
  findDocumentByHash,
  createDocument,
  updateDocumentStatus,
  storeChunks,
  searchSimilarChunks,
  recordUsedDocument,
} from "../repository.js";

describe("projects repository", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("createProject", () => {
    it("creates project successfully", async () => {
      const mockProject = { id: "proj-1", name: "Test", description: "Desc", created_at: new Date() };
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [mockProject], error: null }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await createProject("user-1", "Test", "Desc");

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe("proj-1");
    });

    it("handles database error", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await createProject("user-1", "Test");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("DatabaseError");
    });

    it("handles empty data response", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await createProject("user-1", "Test");

      expect(result.isSuccess).toBe(false);
    });
  });

  describe("getProjectById", () => {
    it("gets project successfully", async () => {
      const mockProject = {
        id: "proj-1",
        name: "Test",
        description: "Desc",
        created_at: new Date(),
        updated_at: new Date(),
      };
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: mockProject, error: null }),
            }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getProjectById("proj-1", "user-1");

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe("proj-1");
    });

    it("returns NotFound when project doesn't exist", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") }),
            }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getProjectById("proj-1", "user-1");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("NotFound");
    });
  });

  describe("getUserProjects", () => {
    it("gets user projects successfully", async () => {
      const mockProjects = [
        { id: "proj-1", name: "Project 1", description: "Desc 1", created_at: new Date(), updated_at: new Date() },
        { id: "proj-2", name: "Project 2", description: "Desc 2", created_at: new Date(), updated_at: new Date() },
      ];
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockProjects, error: null }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getUserProjects("user-1");

      expect(result.isSuccess).toBe(true);
      expect(result.value.length).toBe(2);
    });

    it("handles database error", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error("DB error") }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getUserProjects("user-1");

      expect(result.isSuccess).toBe(false);
    });

    it("returns empty array when user has no projects", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getUserProjects("user-1");

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual([]);
    });
  });

  describe("updateProject", () => {
    it("updates project successfully", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [
            { id: "proj-1", name: "Updated", description: "Desc", created_at: new Date(), updated_at: new Date() },
          ],
          error: null,
        }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await updateProject("proj-1", "user-1", "Updated", "New desc");

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe("proj-1");
    });

    it("handles update error", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({ data: null, error: new Error("Update failed") }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await updateProject("proj-1", "user-1", "Updated");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("DatabaseError");
    });
  });

  describe("deleteProject", () => {
    it("deletes project successfully", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "proj-1" }, error: null }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockFrom = vi.fn((table) => {
        if (table === "projects") {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
        return { delete: mockDelete };
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await deleteProject("proj-1", "user-1");

      expect(result.isSuccess).toBe(true);
    });

    it("returns NotFound when project doesn't exist", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await deleteProject("proj-1", "user-1");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("NotFound");
    });
  });

  describe("getProjectDocuments", () => {
    it("gets project documents successfully", async () => {
      const mockDocuments = [
        { id: "doc-1", file_name: "file1.pdf", file_size: 1024, uploaded_at: new Date(), status: "ready" },
      ];
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockDocuments, error: null }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getProjectDocuments("proj-1");

      expect(result.isSuccess).toBe(true);
      expect(result.value.length).toBe(1);
    });

    it("handles fetch error", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: new Error("Fetch failed") }),
          }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await getProjectDocuments("proj-1");

      expect(result.isSuccess).toBe(false);
    });
  });

  describe("deleteDocument", () => {
    it("deletes document successfully", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: { id: "doc-1" }, error: null }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      });
      const mockFrom = vi.fn((table) => {
        if (table === "documents") {
          return {
            select: mockSelect,
            delete: mockDelete,
          };
        }
        return { delete: mockDelete };
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await deleteDocument("doc-1", "proj-1");

      expect(result.isSuccess).toBe(true);
    });

    it("returns NotFound when document not found", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await deleteDocument("doc-1", "proj-1");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("NotFound");
    });
  });

  describe("findDocumentByHash", () => {
    it("finds document by hash", async () => {
      const mockDocument = { id: "doc-1", file_hash: "abc123" };
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: mockDocument, error: null }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await findDocumentByHash("abc123");

      expect(result.isSuccess).toBe(true);
    });

    it("returns null when document not found with PGRST116 error", async () => {
      const mockEq2 = vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: { code: "PGRST116" } }),
      });
      const mockEq1 = vi.fn().mockReturnValue({
        eq: mockEq2,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq1,
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await findDocumentByHash("abc123");

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });
  });

  describe("createDocument", () => {
    it("creates document successfully", async () => {
      const mockDocument = { id: "doc-1", file_name: "file.pdf", file_size: 1024 };
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: [mockDocument], error: null }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await createDocument("proj-1", "file.pdf", 1024, "hash123");

      expect(result.isSuccess).toBe(true);
      expect(result.value.id).toBe("doc-1");
    });

    it("handles insert error", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: null, error: new Error("Insert failed") }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await createDocument("proj-1", "file.pdf", 1024, "hash123");

      expect(result.isSuccess).toBe(false);
    });
  });

  describe("updateDocumentStatus", () => {
    it("updates document status successfully", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await updateDocumentStatus("doc-1", "ready", new Date());

      expect(result.isSuccess).toBe(true);
    });

    it("handles update error", async () => {
      const mockFrom = vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: new Error("Update failed") }),
        }),
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await updateDocumentStatus("doc-1", "failed");

      expect(result.isSuccess).toBe(false);
    });
  });

  describe("storeChunks", () => {
    it("stores chunks successfully", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });
      (supabaseServer.from as any) = mockFrom;

      const chunks = [{ text: "chunk1", index: 0, embedding: [0.1, 0.2] }];
      const result = await storeChunks("doc-1", chunks);

      expect(result.isSuccess).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("handles insert error", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: new Error("Insert failed") });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });
      (supabaseServer.from as any) = mockFrom;

      const chunks = [{ text: "chunk1", index: 0, embedding: [0.1] }];
      const result = await storeChunks("doc-1", chunks);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("DatabaseError");
    });
  });

  describe("searchSimilarChunks", () => {
    it("searches similar chunks successfully via RPC", async () => {
      const mockChunks = [
        { id: "chunk-1", chunk_text: "Similar text", relevance_score: 0.95, file_name: "doc.pdf" },
      ];
      const mockRpc = vi.fn().mockResolvedValue({ data: mockChunks, error: null });
      (supabaseServer.rpc as any) = mockRpc;

      const result = await searchSimilarChunks("proj-1", [0.1, 0.2], 5);

      expect(result.isSuccess).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith("search_document_chunks", expect.any(Object));
    });

    it("falls back to table search on RPC error", async () => {
      const mockChunks = [
        { id: "chunk-1", chunk_text: "Text", embedding: "[0.1,0.2]", documents: { file_name: "doc.pdf" } },
      ];
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          not: vi.fn().mockResolvedValue({ data: mockChunks, error: null }),
        }),
      });
      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: new Error("RPC failed") });

      (supabaseServer.rpc as any) = mockRpc;
      (supabaseServer.from as any) = mockFrom;

      const result = await searchSimilarChunks("proj-1", [0.1, 0.2], 5);

      expect(result.isSuccess).toBe(true);
    });
  });

  describe("recordUsedDocument", () => {
    it("records used document successfully", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });
      (supabaseServer.from as any) = mockFrom;

      const result = await recordUsedDocument("msg-1", "doc-1", "chunk-1", 0.9);

      expect(result.isSuccess).toBe(true);
      expect(mockInsert).toHaveBeenCalled();
    });

    it("logs and returns success even on error (graceful degradation)", async () => {
      const mockInsert = vi.fn().mockResolvedValue({ error: new Error("Insert failed") });
      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert,
      });
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      (supabaseServer.from as any) = mockFrom;

      const result = await recordUsedDocument("msg-1", "doc-1", "chunk-1", 0.9);

      // Function returns ok even on error (graceful degradation)
      expect(result.isSuccess).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });
});
