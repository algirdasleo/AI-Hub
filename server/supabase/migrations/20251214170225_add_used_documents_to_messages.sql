create table used_documents (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references chat_messages(id) on delete cascade,
  document_id uuid not null references documents(id) on delete cascade,
  chunk_id uuid not null references document_chunks(id) on delete cascade,
  relevance_score numeric,
  created_at timestamptz default now()
);

create index idx_used_documents_message_id on used_documents(message_id);
create index idx_used_documents_document_id on used_documents(document_id);
create index idx_used_documents_chunk_id on used_documents(chunk_id);
