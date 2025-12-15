import { createHash } from "crypto";
import { openai } from "@ai-sdk/openai";
import { embedMany } from "ai";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";
import {
  createDocument,
  findDocumentByHash,
  storeChunks,
  updateDocumentStatus,
  getProjectDocuments,
  searchSimilarChunks,
} from "./repository.js";

async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${String(error)}`);
  }
}

async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${String(error)}`);
  }
}

export async function parseDocument(buffer: Buffer, fileName: string): Promise<Result<string>> {
  try {
    const ext = fileName.split(".").pop()?.toLowerCase();

    let text = "";
    if (ext === "pdf") {
      text = await parsePDF(buffer);
    } else if (ext === "docx") {
      text = await parseDOCX(buffer);
    } else if (ext === "txt") {
      text = buffer.toString("utf-8");
    } else {
      return Result.fail({
        type: ErrorType.InvalidParameters,
        message: `Unsupported file format: ${ext}. Supported formats: PDF, DOCX, TXT`,
      });
    }

    if (!text || text.trim().length === 0) {
      return Result.fail({
        type: ErrorType.InvalidParameters,
        message: "Document is empty or could not be parsed",
      });
    }

    return Result.ok(text);
  } catch (error) {
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: String(error),
    });
  }
}

export function semanticChunk(text: string, maxChunkLength: number = 1500): string[] {
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    if ((currentChunk + "\n\n" + paragraph).length <= maxChunkLength) {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  // Apply 20% overlap
  const overlapLength = Math.floor(maxChunkLength * 0.2);
  const chunksWithOverlap: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    if (i === 0) {
      chunksWithOverlap.push(chunks[i]);
    } else {
      const prevChunk = chunks[i - 1];
      const overlapText = prevChunk.slice(-overlapLength);
      chunksWithOverlap.push(overlapText + "\n\n" + chunks[i]);
    }
  }

  return chunksWithOverlap;
}

export function hashFile(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function generateEmbeddings(
  chunks: string[],
): Promise<Result<Array<{ text: string; embedding: number[] }>>> {
  try {
    if (chunks.length === 0) {
      return Result.ok([]);
    }

    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: chunks,
      maxParallelCalls: 3,
    });

    return Result.ok(
      chunks.map((text, i) => ({
        text,
        embedding: embeddings[i],
      })),
    );
  } catch (error) {
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: `Failed to generate embeddings: ${String(error)}`,
    });
  }
}

// Process document: parse, chunk, embed, and store
export async function processDocument(
  projectId: string,
  buffer: Buffer,
  fileName: string,
  fileSize: number,
): Promise<Result<{ documentId: string; chunksCount: number; isNew: boolean }>> {
  try {
    // Generate file hash
    const fileHash = hashFile(buffer);

    // Check if document with same hash exists
    const existingResult = await findDocumentByHash(fileHash);
    if (!existingResult.isSuccess) {
      return Result.fail(existingResult.error);
    }

    if (existingResult.value) {
      // Document already exists with same hash, reuse it
      return Result.ok({
        documentId: existingResult.value.id,
        chunksCount: 0, // Not recalculated
        isNew: false,
      });
    }

    // Parse document
    const parseResult = await parseDocument(buffer, fileName);
    if (!parseResult.isSuccess) {
      return Result.fail(parseResult.error);
    }

    const text = parseResult.value;

    // Semantic chunking
    const chunks = semanticChunk(text);

    if (chunks.length === 0) {
      return Result.fail({
        type: ErrorType.InvalidParameters,
        message: "Document has no content to chunk",
      });
    }

    // Create document record
    const docResult = await createDocument(projectId, fileName, fileSize, fileHash);
    if (!docResult.isSuccess) {
      return Result.fail(docResult.error);
    }

    const documentId = docResult.value.id;

    // Generate embeddings
    const embeddingsResult = await generateEmbeddings(chunks);
    if (!embeddingsResult.isSuccess) {
      await updateDocumentStatus(documentId, "failed");
      return Result.fail(embeddingsResult.error);
    }

    const embeddedChunks = embeddingsResult.value.map((item, index) => ({
      text: item.text,
      index,
      embedding: item.embedding,
    }));

    // Store chunks with embeddings
    const storeResult = await storeChunks(documentId, embeddedChunks);
    if (!storeResult.isSuccess) {
      await updateDocumentStatus(documentId, "failed");
      return Result.fail(storeResult.error);
    }

    // Update document status to ready
    await updateDocumentStatus(documentId, "ready", new Date());

    return Result.ok({
      documentId,
      chunksCount: chunks.length,
      isNew: true,
    });
  } catch (error) {
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: `Error processing document: ${String(error)}`,
    });
  }
}

export async function queryDocumentsWithRAG(
  projectId: string,
  query: string,
): Promise<Result<Array<{ chunkText: string; relevanceScore: number; fileName?: string }>>> {
  try {
    const { embeddings } = await embedMany({
      model: openai.embedding("text-embedding-3-small"),
      values: [query],
    });

    const queryEmbedding = embeddings[0];
    const searchResult = await searchSimilarChunks(projectId, queryEmbedding, 5);

    if (!searchResult.isSuccess) {
      return Result.fail(searchResult.error);
    }

    const relevantChunks = searchResult.value.map((chunk: any) => ({
      chunkText: chunk.chunk_text,
      relevanceScore: chunk.relevance_score,
      fileName: chunk.file_name,
    }));

    return Result.ok(relevantChunks);
  } catch (error) {
    return Result.fail({
      type: ErrorType.InternalServerError,
      message: `Error querying documents: ${String(error)}`,
    });
  }
}
