-- Logs de execução de treino (histórico)

create table public.workout_logs (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  notes text
);

create index workout_logs_workout_id_idx
  on public.workout_logs (workout_id, started_at desc);

create index workout_logs_user_id_idx
  on public.workout_logs (user_id, started_at desc);

alter table public.workout_logs enable row level security;

create policy "workout_logs_select_own"
  on public.workout_logs for select
  using (auth.uid() = user_id);

create policy "workout_logs_insert_own"
  on public.workout_logs for insert
  with check (auth.uid() = user_id);

create policy "workout_logs_update_own"
  on public.workout_logs for update
  using (auth.uid() = user_id);

create policy "workout_logs_delete_own"
  on public.workout_logs for delete
  using (auth.uid() = user_id);

create table public.exercise_log_entries (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.workout_logs (id) on delete cascade,
  exercise_name text not null,
  phase_id text not null,
  planned_kg numeric,
  actual_kg numeric,
  planned_reps text,
  actual_reps int,
  set_number int not null default 1,
  completed boolean not null default false
);

create index exercise_log_entries_log_id_idx
  on public.exercise_log_entries (log_id);

alter table public.exercise_log_entries enable row level security;

create policy "exercise_log_entries_select_via_log"
  on public.exercise_log_entries for select
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_log_entries.log_id and wl.user_id = auth.uid()
    )
  );

create policy "exercise_log_entries_insert_via_log"
  on public.exercise_log_entries for insert
  with check (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_log_entries.log_id and wl.user_id = auth.uid()
    )
  );

create policy "exercise_log_entries_update_via_log"
  on public.exercise_log_entries for update
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_log_entries.log_id and wl.user_id = auth.uid()
    )
  );

create policy "exercise_log_entries_delete_via_log"
  on public.exercise_log_entries for delete
  using (
    exists (
      select 1 from public.workout_logs wl
      where wl.id = exercise_log_entries.log_id and wl.user_id = auth.uid()
    )
  );
