create table usage_per_model (
  model text primary key,
  total_tokens bigint default 0,
  total_cost numeric default 0,
  updated_at timestamptz default now()
);

create table usage_user_model (
  user_id uuid not null,
  model text not null,
  type text not null,
  primary key(user_id, model, type),
  total_tokens bigint default 0,
  total_cost numeric default 0,
  updated_at timestamptz default now()
);

create table usage_conversation (
  conversation_id uuid primary key,
  total_tokens bigint default 0,
  total_cost numeric default 0,
  updated_at timestamptz default now()
);

create or replace function upsert_usage_per_model(p_model text, p_tokens bigint, p_cost numeric)
returns void as $$
begin
  insert into usage_per_model (model, total_tokens, total_cost, updated_at)
  values (p_model, p_tokens, p_cost, now())
  on conflict (model)
  do update set
    total_tokens = usage_per_model.total_tokens + p_tokens,
    total_cost = usage_per_model.total_cost + p_cost,
    updated_at = now();
end;
$$ language plpgsql;

create or replace function upsert_usage_user_model(p_user_id uuid, p_model text, p_tokens bigint, p_cost numeric, p_type text)
returns void as $$
begin
  insert into usage_user_model (user_id, model, type, total_tokens, total_cost, updated_at)
  values (p_user_id, p_model, p_type, p_tokens, p_cost, now())
  on conflict (user_id, model, type)
  do update set
    total_tokens = usage_user_model.total_tokens + p_tokens,
    total_cost = usage_user_model.total_cost + p_cost,
    updated_at = now();
end;
$$ language plpgsql;

create or replace function upsert_usage_conversation(p_conversation_id uuid, p_tokens bigint, p_cost numeric)
returns void as $$
begin
  insert into usage_conversation (conversation_id, total_tokens, total_cost, updated_at)
  values (p_conversation_id, p_tokens, p_cost, now())
  on conflict (conversation_id)
  do update set
    total_tokens = usage_conversation.total_tokens + p_tokens,
    total_cost = usage_conversation.total_cost + p_cost,
    updated_at = now();
end;
$$ language plpgsql;
