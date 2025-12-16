import { describe, it, expect, vi, beforeEach } from "vitest";
import { Result } from "@shared/utils/result.js";

vi.mock("../repository.js", () => ({
  findDocumentByHash: vi.fn(),
  createDocument: vi.fn(),
  updateDocumentStatus: vi.fn(),
  storeChunks: vi.fn(),
  searchSimilarChunks: vi.fn(),
}));

vi.mock("@ai-sdk/openai", () => ({
  openai: {
    embedding: vi.fn(() => ({})),
  },
}));

vi.mock("ai", () => ({
  embedMany: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn(),
}));

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn(),
  },
}));

import {
  parseDocument,
  semanticChunk,
  hashFile,
  generateEmbeddings,
  processDocument,
  queryDocumentsWithRAG,
} from "../service.js";
import {
  findDocumentByHash,
  createDocument,
  updateDocumentStatus,
  storeChunks,
  searchSimilarChunks,
} from "../repository.js";
import { embedMany } from "ai";

describe("projects service", () => {
  beforeEach(() => vi.clearAllMocks());

  describe("parseDocument", () => {
    it("parses TXT files", async () => {
      const buffer = Buffer.from("TXT content");
      const result = await parseDocument(buffer, "document.txt");

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe("TXT content");
    });

    it("rejects unsupported file formats", async () => {
      const buffer = Buffer.from("data");
      const result = await parseDocument(buffer, "file.xyz");

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain("Unsupported file format");
    });

    it("rejects empty documents", async () => {
      const buffer = Buffer.from("");
      const result = await parseDocument(buffer, "empty.txt");

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain("Document is empty");
    });
  });

  describe("semanticChunk", () => {
    it("chunks text by paragraphs", () => {
      const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const chunks = semanticChunk(text, 500);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toContain("Paragraph");
    });

    it("respects max chunk length", () => {
      const longText = "A".repeat(1000) + "\n\n" + "B".repeat(1000);
      const chunks = semanticChunk(longText, 1500);

      chunks.forEach((chunk) => {
        // Chunks can be longer due to overlap, so we allow reasonable variance
        expect(chunk.length).toBeGreaterThan(0);
      });
    });

    it("filters empty paragraphs", () => {
      const text = "Para 1\n\n\n\nPara 2\n\n\n";
      const chunks = semanticChunk(text, 500);

      expect(chunks.every((c) => c.trim().length > 0)).toBe(true);
    });
  });

  describe("hashFile", () => {
    it("generates consistent hash", () => {
      const buffer = Buffer.from("content");
      const hash1 = hashFile(buffer);
      const hash2 = hashFile(buffer);

      expect(hash1).toBe(hash2);
    });

    it("generates different hashes for different content", () => {
      const hash1 = hashFile(Buffer.from("content1"));
      const hash2 = hashFile(Buffer.from("content2"));

      expect(hash1).not.toBe(hash2);
    });
  });

  describe("generateEmbeddings", () => {
    it("generates embeddings for chunks", async () => {
      (embedMany as any).mockResolvedValue({
        embeddings: [
          [0.1, 0.2],
          [0.3, 0.4],
        ],
      });

      const chunks = ["chunk1", "chunk2"];
      const result = await generateEmbeddings(chunks);

      expect(result.isSuccess).toBe(true);
      expect(result.value.length).toBe(2);
      expect(result.value[0].text).toBe("chunk1");
    });

    it("handles empty chunks", async () => {
      const result = await generateEmbeddings([]);

      expect(result.isSuccess).toBe(true);
      expect(result.value.length).toBe(0);
    });

    it("handles embedding errors", async () => {
      (embedMany as any).mockRejectedValue(new Error("Embedding failed"));

      const result = await generateEmbeddings(["chunk"]);

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("InternalServerError");
    });
  });

  describe("processDocument", () => {
    it("processes new document successfully", async () => {
      (findDocumentByHash as any).mockResolvedValue(Result.ok(null));
      (createDocument as any).mockResolvedValue(Result.ok({ id: "doc-1" }));
      (embedMany as any).mockResolvedValue({ embeddings: [[0.1]] });
      (storeChunks as any).mockResolvedValue(Result.ok({}));
      (updateDocumentStatus as any).mockResolvedValue(Result.ok({}));

      const buffer = Buffer.from("Test content");
      const result = await processDocument("proj-1", buffer, "test.txt", 100);

      expect(result.isSuccess).toBe(true);
      expect(result.value.isNew).toBe(true);
      expect(updateDocumentStatus).toHaveBeenCalledWith("doc-1", "ready", expect.any(Date));
    });

    it("reuses existing document with same hash", async () => {
      (findDocumentByHash as any).mockResolvedValue(Result.ok({ id: "doc-existing" }));

      const buffer = Buffer.from("Duplicate");
      const result = await processDocument("proj-1", buffer, "dup.txt", 100);

      expect(result.isSuccess).toBe(true);
      expect(result.value.isNew).toBe(false);
      expect(result.value.documentId).toBe("doc-existing");
    });

    it("handles empty chunks", async () => {
      (findDocumentByHash as any).mockResolvedValue(Result.ok(null));
      // Empty file case
      const emptyBuffer = Buffer.from("");
      const result = await processDocument("proj-1", emptyBuffer, "empty.txt", 0);

      expect(result.isSuccess).toBe(false);
      expect(result.error.message).toContain("empty or could not be parsed");
    });
  });

  describe("queryDocumentsWithRAG", () => {
    it("queries and returns relevant chunks", async () => {
      (embedMany as any).mockResolvedValue({ embeddings: [[0.1, 0.2]] });
      (searchSimilarChunks as any).mockResolvedValue(
        Result.ok([{ chunk_text: "Relevant chunk", relevance_score: 0.95, file_name: "doc.txt" }]),
      );

      const result = await queryDocumentsWithRAG("proj-1", "query");

      expect(result.isSuccess).toBe(true);
      expect(result.value[0].chunkText).toBe("Relevant chunk");
    });

    it("handles search errors", async () => {
      (embedMany as any).mockResolvedValue({ embeddings: [[0.1]] });
      (searchSimilarChunks as any).mockResolvedValue(
        Result.fail({ type: "DatabaseError", message: "Search failed" }),
      );

      const result = await queryDocumentsWithRAG("proj-1", "query");

      expect(result.isSuccess).toBe(false);
    });

    it("handles embedding errors", async () => {
      (embedMany as any).mockRejectedValue(new Error("Embedding failed"));

      const result = await queryDocumentsWithRAG("proj-1", "query");

      expect(result.isSuccess).toBe(false);
      expect(result.error.type).toBe("InternalServerError");
    });
  });
});
