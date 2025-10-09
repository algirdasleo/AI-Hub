create table chat_conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  user_id uuid not null,
  created_at timestamptz default now()
);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references chat_conversations(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index chat_messages_conv_time_idx
  on chat_messages(conversation_id, created_at);


create table comparison_conversations (
  id uuid primary key default gen_random_uuid(),
  title text,
  user_id uuid not null,
  created_at timestamptz default now()
);

create index idx_comparison_conversations_user
  on comparison_conversations(user_id);

create table comparison_prompts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references comparison_conversations(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create index idx_comparison_prompts_conv
  on comparison_prompts(conversation_id);

create table comparison_outputs (
  id uuid primary key default gen_random_uuid(),
  prompt_id uuid references comparison_prompts(id) on delete cascade,
  model text not null,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

create index idx_comparison_outputs_prompt on comparison_outputs(prompt_id);
create index idx_comparison_outputs_model on comparison_outputs(model);

create table comparison_output_stats (
  id uuid primary key default gen_random_uuid(),
  output_id uuid references comparison_outputs(id) on delete cascade,
  tokens_used bigint not null,
  cost_usd numeric not null,
  latency_ms int,
  created_at timestamptz default now()
);

create index idx_output_stats_output on comparison_output_stats(output_id);
create index idx_output_stats_created_at on comparison_output_stats(created_at);

create table chat_message_stats (
  id uuid primary key default gen_random_uuid(),
  message_id uuid references chat_messages(id) on delete cascade,
  tokens_used bigint not null,
  cost_usd numeric not null,
  latency_ms int,
  created_at timestamptz default now()
);

create index idx_chat_message_stats_message on chat_message_stats(message_id);
create index idx_chat_message_stats_created_at on chat_message_stats(created_at);