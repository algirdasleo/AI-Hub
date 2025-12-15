create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_projects_user_id on projects(user_id);

create table documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_name text not null,
  file_size bigint,
  file_hash text not null,
  status text default 'pending',
  uploaded_at timestamptz default now(),
  processed_at timestamptz
);

create index idx_documents_project_id on documents(project_id);
create index idx_documents_file_hash on documents(file_hash);
create index idx_documents_status on documents(status);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  chunk_text text not null,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index idx_document_chunks_document_id on document_chunks(document_id);
create index idx_document_chunks_embedding on document_chunks using ivfflat (embedding vector_cosine_ops);
