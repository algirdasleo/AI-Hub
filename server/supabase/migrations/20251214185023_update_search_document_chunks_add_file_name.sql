DROP FUNCTION IF EXISTS public.search_document_chunks(UUID, VECTOR(1536), INT);

CREATE FUNCTION public.search_document_chunks(
  project_id_param UUID,
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  chunk_index INT,
  chunk_text TEXT,
  embedding VECTOR(1536),
  similarity_score FLOAT,
  file_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.chunk_text,
    dc.embedding,
    (1 - (dc.embedding <=> query_embedding)) as similarity_score,
    d.file_name
  FROM document_chunks dc
  INNER JOIN documents d ON dc.document_id = d.id
  WHERE d.project_id = project_id_param
    AND dc.embedding IS NOT NULL
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION public.search_document_chunks(UUID, VECTOR(1536), INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_document_chunks(UUID, VECTOR(1536), INT) TO anon;
