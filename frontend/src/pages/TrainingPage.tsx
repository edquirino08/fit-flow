import { RestTimer } from "@/components/RestTimer";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { parsePhasesConfig } from "@/lib/phases-config";
import { supabase } from "@/lib/supabase";
import type { WorkoutExerciseRow, WorkoutRow } from "@/lib/types";
import {
  computePhaseLoads,
  PHASE_ORDER,
  type PhaseId,
} from "@fit-flow/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";

const PHASE_LABELS: Record<PhaseId, string> = {
  aq1: "AQ1",
  aq2: "AQ2",
  aj1: "AJ1",
  aj2: "AJ2",
  work: "Trabalho",
};

function fmtKg(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function parseFinalLoad(
  v: string | number | null | undefined,
): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-[0.2em] transition ${
    isActive ? "text-ink" : "text-neutral-400 hover:text-ink"
  }`;

export function TrainingPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [done, setDone] = useState<Record<string, boolean>>({});
  const sessionStartedAt = useRef(new Date().toISOString()).current;

  const toggle = useCallback((key: string) => {
    setDone((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const finishMutation = useMutation({
    mutationFn: async (vars: {
      blocks: Array<{
        row: WorkoutExerciseRow;
        loads: ReturnType<typeof computePhaseLoads>;
      }>;
      doneMap: Record<string, boolean>;
    }) => {
      if (!id || !user) throw new Error("Inválido");
      const { data: logRow, error: e1 } = await supabase
        .from("workout_logs")
        .insert({
          workout_id: id,
          user_id: user.id,
          started_at: sessionStartedAt,
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (e1) throw e1;
      const logId = logRow.id as string;
      const entries: Array<{
        log_id: string;
        exercise_name: string;
        phase_id: string;
        planned_kg: number | null;
        planned_reps: string;
        set_number: number;
        completed: boolean;
      }> = [];
      for (const b of vars.blocks) {
        for (const pid of PHASE_ORDER) {
          const load = b.loads.find((l) => l.id === pid);
          if (!load?.enabled) continue;
          const ck = `${b.row.id}-${pid}`;
          entries.push({
            log_id: logId,
            exercise_name: b.row.exercise_name,
            phase_id: pid,
            planned_kg: load.kg,
            planned_reps: load.reps,
            set_number: 1,
            completed: !!vars.doneMap[ck],
          });
        }
      }
      if (entries.length > 0) {
        const { error: e2 } = await supabase
          .from("exercise_log_entries")
          .insert(entries);
        if (e2) throw e2;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["workout-logs", id] });
      nav(`/workouts/${id}/historico`);
    },
  });

  const workoutQuery = useQuery({
    queryKey: ["workout", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data: w, error: e1 } = await supabase
        .from("workouts")
        .select("*")
        .eq("id", id!)
        .single();
      if (e1) throw e1;
      const { data: rows, error: e2 } = await supabase
        .from("workout_exercises")
        .select("*")
        .eq("workout_id", id!)
        .order("sort_order", { ascending: true });
      if (e2) throw e2;
      return {
        workout: w as WorkoutRow,
        exercises: rows as WorkoutExerciseRow[],
      };
    },
  });

  const blocks = useMemo(() => {
    if (!workoutQuery.data) return [];
    return workoutQuery.data.exercises.map((row) => {
      const phases = parsePhasesConfig(row.phases_config);
      const finalKg = parseFinalLoad(row.final_load_kg);
      const loads = computePhaseLoads(finalKg, phases);
      return { row, phases, loads };
    });
  }, [workoutQuery.data]);

  if (workoutQuery.isLoading) {
    return (
      <AppShell
        nav={
          <nav className="flex items-center gap-10">
            <NavLink to="/" end className={navLinkClass}>
              Fichas
            </NavLink>
            <NavLink to="/perfil" className={navLinkClass}>
              Perfil
            </NavLink>
          </nav>
        }
      >
        <div className="flex min-h-[40vh] items-center justify-center text-neutral-500">
          Carregando…
        </div>
      </AppShell>
    );
  }

  if (workoutQuery.isError || !id || !workoutQuery.data) {
    return (
      <AppShell
        nav={
          <nav className="flex items-center gap-10">
            <NavLink to="/" end className={navLinkClass}>
              Fichas
            </NavLink>
            <NavLink to="/perfil" className={navLinkClass}>
              Perfil
            </NavLink>
          </nav>
        }
      >
        <p className="px-4 py-16 text-center text-rose-600">
          Não foi possível carregar o treino.
        </p>
      </AppShell>
    );
  }

  const { workout } = workoutQuery.data;

  return (
    <AppShell
      nav={
        <nav className="flex items-center gap-10">
          <NavLink to="/" end className={navLinkClass}>
            Fichas
          </NavLink>
          <NavLink to="/perfil" className={navLinkClass}>
            Perfil
          </NavLink>
        </nav>
      }
    >
      <div className="mx-auto max-w-lg px-4 py-6 pb-28 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-wider">
              <Link
                to={`/workouts/${id}`}
                className="text-neutral-500 hover:text-ink"
              >
                ← Editar ficha
              </Link>
              <Link
                to={`/workouts/${id}/historico`}
                className="text-neutral-500 hover:text-ink"
              >
                Histórico
              </Link>
            </div>
            <h1 className="mt-3 font-display text-3xl uppercase leading-tight tracking-wide text-ink sm:text-4xl">
              {workout.title}
            </h1>
            {workout.notes?.trim() ? (
              <p className="mt-2 text-base text-neutral-700">{workout.notes}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <RestTimer />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={finishMutation.isPending || blocks.length === 0}
            onClick={() =>
              finishMutation.mutate({ blocks, doneMap: done })
            }
            className="focus-ring rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {finishMutation.isPending
              ? "Salvando…"
              : "Finalizar e registrar"}
          </button>
          {finishMutation.isError ? (
            <p className="text-sm text-rose-600">
              {(finishMutation.error as Error).message}
            </p>
          ) : null}
        </div>

        <ol className="mt-10 space-y-8">
          {blocks.map((b, idx) => (
            <li
              key={b.row.id}
              className="rounded-3xl border-2 border-black/10 bg-white p-5 shadow-md sm:p-6"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
                {idx + 1} / {blocks.length}
              </p>
              <h2 className="mt-1 font-display text-2xl uppercase tracking-wide text-ink">
                {b.row.exercise_name || "Exercício"}
              </h2>
              {(b.row.techniques?.length ?? 0) > 0 ? (
                <p className="mt-2 text-sm text-neutral-600">
                  {(b.row.techniques ?? []).join(" · ")}
                </p>
              ) : null}
              <ul className="mt-5 space-y-3">
                {PHASE_ORDER.map((pid) => {
                  const load = b.loads.find((l) => l.id === pid);
                  if (!load?.enabled) return null;
                  const ck = `${b.row.id}-${pid}`;
                  return (
                    <li
                      key={ck}
                      className="flex items-center gap-4 rounded-2xl border border-black/10 bg-surface px-4 py-3"
                    >
                      <input
                        type="checkbox"
                        checked={!!done[ck]}
                        onChange={() => toggle(ck)}
                        className="h-6 w-6 shrink-0 rounded border-neutral-400 text-ink focus:ring-ink/30"
                        aria-label={`${PHASE_LABELS[pid]} ${fmtKg(load.kg)} kg concluída`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-lg font-bold text-ink">
                            {PHASE_LABELS[pid]}
                          </span>
                          <span className="font-mono text-2xl font-bold text-ink">
                            {fmtKg(load.kg)}{" "}
                            <span className="text-base font-semibold">kg</span>
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-neutral-600">
                          {load.reps} reps · {load.sets}{" "}
                          {load.sets === 1 ? "série" : "séries"}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {b.row.notes?.trim() ? (
                <p className="mt-4 text-sm text-neutral-600">{b.row.notes}</p>
              ) : null}
            </li>
          ))}
        </ol>

        {blocks.length === 0 ? (
          <p className="mt-8 text-center text-neutral-500">
            Nenhum exercício nesta ficha.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
