import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import type { ExerciseLogEntryRow, WorkoutLogRow } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, useParams } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-[0.2em] transition ${
    isActive ? "text-ink" : "text-neutral-400 hover:text-ink"
  }`;

type LogWithEntries = WorkoutLogRow & {
  exercise_log_entries: ExerciseLogEntryRow[] | null;
};

function MiniLineChart({ values }: { values: { label: string; y: number }[] }) {
  if (values.length < 2) return null;
  const w = 280;
  const h = 72;
  const ys = values.map((v) => v.y);
  const min = Math.min(...ys);
  const max = Math.max(...ys);
  const span = max - min || 1;
  const pad = 4;
  const pts = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const yn = pad + (h - pad * 2) * (1 - (v.y - min) / span);
      return `${x},${yn}`;
    })
    .join(" ");
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="mt-3 w-full max-w-[280px] text-ink"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
    </svg>
  );
}

export function WorkoutHistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const logsQuery = useQuery({
    queryKey: ["workout-logs", id, user?.id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select(
          "id,workout_id,user_id,started_at,finished_at,notes,exercise_log_entries(*)",
        )
        .eq("workout_id", id!)
        .order("started_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as LogWithEntries[];
    },
  });

  const workoutQuery = useQuery({
    queryKey: ["workout", id],
    enabled: !!id && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("title")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as { title: string };
    },
  });

  const finishedLogs = (logsQuery.data ?? []).filter((l) => l.finished_at);

  const exerciseNames = Array.from(
    new Set(
      finishedLogs.flatMap((l) =>
        (l.exercise_log_entries ?? [])
          .filter((e) => e.phase_id === "work")
          .map((e) => e.exercise_name),
      ),
    ),
  );

  const firstExercise = exerciseNames[0];
  const series =
    firstExercise && finishedLogs.length >= 2
      ? finishedLogs
          .map((l) => {
            const e = (l.exercise_log_entries ?? []).find(
              (x) =>
                x.exercise_name === firstExercise && x.phase_id === "work",
            );
            if (!e?.planned_kg) return null;
            const kg = Number(e.planned_kg);
            if (!Number.isFinite(kg)) return null;
            return {
              label: new Date(l.started_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              }),
              y: kg,
            };
          })
          .filter(Boolean) as { label: string; y: number }[]
      : [];

  if (logsQuery.isLoading || workoutQuery.isLoading) {
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
        <p className="px-4 py-16 text-center text-neutral-500">Carregando…</p>
      </AppShell>
    );
  }

  if (logsQuery.isError) {
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
        <p className="px-4 py-16 text-center text-sm text-rose-600">
          Histórico indisponível. Rode a migration workout_logs no Supabase.
        </p>
      </AppShell>
    );
  }

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
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <Link
          to={`/workouts/${id}`}
          className="text-sm font-semibold uppercase tracking-wider text-neutral-500 hover:text-ink"
        >
          ← Voltar à ficha
        </Link>
        <h1 className="mt-4 font-display text-3xl uppercase tracking-wide text-ink">
          Histórico — {workoutQuery.data?.title ?? "Treino"}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          Sessões finalizadas no modo treino. Gráfico: carga planejada na fase
          trabalho do primeiro exercício com registros.
        </p>

        {series.length >= 2 && firstExercise ? (
          <div className="mt-8 rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Progressão (trabalho)
            </p>
            <p className="mt-1 font-medium text-ink">{firstExercise}</p>
            <MiniLineChart values={series} />
            <ul className="mt-4 flex flex-wrap gap-3 text-xs text-neutral-500">
              {series.map((s, i) => (
                <li key={i}>
                  {s.label}: {s.y} kg
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ul className="mt-10 space-y-4">
          {finishedLogs.length === 0 ? (
            <li className="rounded-2xl border border-dashed border-black/15 py-12 text-center text-sm text-neutral-500">
              Nenhuma sessão registrada ainda. Finalize um treino na tela de
              treino.
            </li>
          ) : null}
          {[...finishedLogs].reverse().map((log) => {
            const entries = log.exercise_log_entries ?? [];
            const done = entries.filter((e) => e.completed).length;
            const total = entries.length;
            return (
              <li
                key={log.id}
                className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {new Date(log.started_at).toLocaleString("pt-BR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {total ? `${done}/${total} fases marcadas` : "—"}
                  </span>
                </div>
                {log.finished_at ? (
                  <p className="mt-1 text-xs text-neutral-500">
                    Fim{" "}
                    {new Date(log.finished_at).toLocaleTimeString("pt-BR", {
                      timeStyle: "short",
                    })}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </AppShell>
  );
}
