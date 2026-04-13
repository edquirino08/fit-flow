-- Rate limiting for AI suggestions (Edge Function inserts via service role)
create table public.ai_suggest_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index ai_suggest_log_user_created_idx
  on public.ai_suggest_log (user_id, created_at desc);

alter table public.ai_suggest_log enable row level security;

-- No user-facing policies: only service role (Edge Function) writes/reads
