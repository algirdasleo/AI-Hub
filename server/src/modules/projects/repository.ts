import { supabaseServer } from "@server/db/supabase.js";
import { Tables } from "@server/db/tables.js";
import { Result } from "@shared/utils/result.js";
import { ErrorType } from "@shared/utils/error-type.js";

// Project operations
export async function createProject(userId: string, name: string, description?: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECTS)
      .insert([{ user_id: userId, name, description }])
      .select("id, name, description, created_at");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No project data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error creating project",
      details: error,
    });
  }
}

export async function getProjectById(projectId: string, userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECTS)
      .select("id, name, description, created_at, updated_at")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Project not found or access denied",
      });
    }

    return Result.ok(data);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching project",
      details: error,
    });
  }
}

export async function getUserProjects(userId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.PROJECTS)
      .select("id, name, description, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching projects",
      details: error,
    });
  }
}

export async function updateProject(projectId: string, userId: string, name?: string, description?: string) {
  try {
    const updates: any = { updated_at: new Date().toISOString() };
    if (name) updates.name = name;
    if (description) updates.description = description;

    const { data, error } = await supabaseServer
      .from(Tables.PROJECTS)
      .update(updates)
      .eq("id", projectId)
      .eq("user_id", userId)
      .select("id, name, description, created_at, updated_at");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Project not found or access denied",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error updating project",
      details: error,
    });
  }
}

export async function deleteProject(projectId: string, userId: string) {
  try {
    const { data: project, error: checkError } = await supabaseServer
      .from(Tables.PROJECTS)
      .select("id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();

    if (checkError || !project) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Project not found or access denied",
      });
    }

    const { error: deleteError } = await supabaseServer.from(Tables.PROJECTS).delete().eq("id", projectId);

    if (deleteError) throw deleteError;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error deleting project",
      details: error,
    });
  }
}

export async function createDocument(projectId: string, fileName: string, fileSize: number, fileHash: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.DOCUMENTS)
      .insert([
        {
          project_id: projectId,
          file_name: fileName,
          file_size: fileSize,
          file_hash: fileHash,
          status: "pending",
        },
      ])
      .select("id, file_name, file_size, status, uploaded_at");

    if (error) throw error;
    if (!data || data.length === 0) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: "No document data returned",
      });
    }

    return Result.ok(data[0]);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error creating document",
      details: error,
    });
  }
}

export async function findDocumentByHash(fileHash: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.DOCUMENTS)
      .select("id, project_id, file_name, status")
      .eq("file_hash", fileHash)
      .eq("status", "ready")
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found

    return Result.ok(data || null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error finding document by hash",
      details: error,
    });
  }
}

export async function getProjectDocuments(projectId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.DOCUMENTS)
      .select("id, file_name, file_size, status, uploaded_at, processed_at")
      .eq("project_id", projectId)
      .order("uploaded_at", { ascending: false });

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching project documents",
      details: error,
    });
  }
}

export async function updateDocumentStatus(documentId: string, status: string, processedAt?: Date) {
  try {
    const updates: any = { status };
    if (processedAt) updates.processed_at = processedAt.toISOString();

    const { error } = await supabaseServer.from(Tables.DOCUMENTS).update(updates).eq("id", documentId);

    if (error) throw error;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error updating document status",
      details: error,
    });
  }
}

export async function deleteDocument(documentId: string, projectId: string) {
  try {
    const { data: doc, error: checkError } = await supabaseServer
      .from(Tables.DOCUMENTS)
      .select("id")
      .eq("id", documentId)
      .eq("project_id", projectId)
      .single();

    if (checkError || !doc) {
      return Result.fail({
        type: ErrorType.NotFound,
        message: "Document not found or access denied",
      });
    }

    const { error: deleteError } = await supabaseServer.from(Tables.DOCUMENTS).delete().eq("id", documentId);

    if (deleteError) throw deleteError;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error deleting document",
      details: error,
    });
  }
}

export async function storeChunks(
  documentId: string,
  chunks: Array<{ text: string; index: number; embedding: number[] }>,
) {
  try {
    const chunkData = chunks.map((chunk) => ({
      document_id: documentId,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      embedding: chunk.embedding,
    }));

    const { error } = await supabaseServer.from(Tables.DOCUMENT_CHUNKS).insert(chunkData);

    if (error) throw error;

    return Result.ok(null);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error storing document chunks",
      details: error,
    });
  }
}

// Vector similarity search - retrieve top 5 similar chunks
export async function searchSimilarChunks(projectId: string, queryEmbedding: number[], topK: number = 5) {
  try {
    const { data, error } = await supabaseServer.rpc("search_document_chunks", {
      project_id_param: projectId,
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return Result.ok([]);
    }

    const rpcResults = data.map((row: any) => ({
      id: row.id,
      document_id: row.document_id,
      chunk_index: row.chunk_index,
      chunk_text: row.chunk_text,
      relevance_score: row.similarity_score,
    }));

    return Result.ok(rpcResults);
  } catch (error) {
    try {
      const { data: chunks, error: searchError } = await supabaseServer
        .from(Tables.DOCUMENT_CHUNKS)
        .select(
          `id, document_id, chunk_index, chunk_text, embedding, documents!inner(id, project_id, file_name)`,
          { count: "estimated" },
        )
        .eq("documents.project_id", projectId)
        .not("embedding", "is", null);

      if (searchError) {
        throw searchError;
      }

      if (!chunks || chunks.length === 0) {
        return Result.ok([]);
      }

      const similarities = chunks.map((chunk: any) => {
        let embedding = chunk.embedding;
        if (typeof embedding === "string") {
          try {
            embedding = embedding
              .replace(/^\[|\]$/g, "")
              .split(",")
              .map(Number);
          } catch {
            return {
              id: chunk.id,
              document_id: chunk.document_id,
              chunk_index: chunk.chunk_index,
              chunk_text: chunk.chunk_text,
              relevance_score: 0,
              file_name: chunk.documents?.file_name || "Unknown",
            };
          }
        }
        if (!Array.isArray(embedding)) {
          return {
            id: chunk.id,
            document_id: chunk.document_id,
            chunk_index: chunk.chunk_index,
            chunk_text: chunk.chunk_text,
            relevance_score: 0,
            file_name: chunk.documents?.file_name || "Unknown",
          };
        }

        const score = cosineSimilarity(queryEmbedding, embedding);
        return {
          id: chunk.id,
          document_id: chunk.document_id,
          chunk_index: chunk.chunk_index,
          chunk_text: chunk.chunk_text,
          relevance_score: score,
          file_name: chunk.documents?.file_name || "Unknown",
        };
      });

      const sorted = similarities.sort((a: any, b: any) => b.relevance_score - a.relevance_score);
      return Result.ok(sorted.slice(0, topK));
    } catch (fallbackError) {
      return Result.fail({
        type: ErrorType.DatabaseError,
        message: `Error searching similar chunks: ${String(fallbackError)}`,
        details: fallbackError,
      });
    }
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!Array.isArray(a) || !Array.isArray(b)) {
    return 0;
  }

  if (a.length === 0 || b.length === 0) {
    return 0;
  }

  if (a.length !== b.length) {
    return 0;
  }

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  return dotProduct / (magnitudeA * magnitudeB);
}

export async function recordUsedDocument(
  messageId: string,
  documentId: string,
  chunkId: string,
  relevanceScore: number,
) {
  try {
    const { error } = await supabaseServer.from(Tables.USED_DOCUMENTS).insert([
      {
        message_id: messageId,
        document_id: documentId,
        chunk_id: chunkId,
        relevance_score: relevanceScore,
      },
    ]);

    if (error) throw error;

    return Result.ok(null);
  } catch (error) {
    console.warn("Failed to record used document", error);
    return Result.ok(null);
  }
}

export async function getUsedDocuments(messageId: string) {
  try {
    const { data, error } = await supabaseServer
      .from(Tables.USED_DOCUMENTS)
      .select("document_id, chunk_id, relevance_score")
      .eq("message_id", messageId);

    if (error) throw error;

    return Result.ok(data || []);
  } catch (error) {
    return Result.fail({
      type: ErrorType.DatabaseError,
      message: "Error fetching used documents",
      details: error,
    });
  }
}
