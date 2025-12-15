create table project_conversations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null,
  title text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_project_conversations_project_id 
  on project_conversations(project_id);

create index idx_project_conversations_user_id 
  on project_conversations(user_id);

create index idx_project_conversations_created_at 
  on project_conversations(project_id, created_at desc);

create table project_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references project_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index idx_project_messages_conversation_id 
  on project_messages(conversation_id);

create index idx_project_messages_conv_time_idx 
  on project_messages(conversation_id, created_at);

create table project_message_stats (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null unique references project_messages(id) on delete cascade,
  tokens_used bigint,
  cost_usd numeric(12, 6),
  latency_ms int,
  created_at timestamptz default now()
);

create index idx_project_message_stats_message_id 
  on project_message_stats(message_id);
