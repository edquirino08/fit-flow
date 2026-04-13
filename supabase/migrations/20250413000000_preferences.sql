-- Optional user preferences (units, rounding step, etc.)
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.preferences is
  'JSON object: e.g. {"unit":"kg"|"lb","stepKg":2.5}';
