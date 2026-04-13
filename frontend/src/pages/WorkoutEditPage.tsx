import { AiSuggestButton } from "@/components/AiSuggestButton";
import { ExerciseCard, type ExerciseDraft } from "@/components/ExerciseCard";
import { AppShell } from "@/components/AppShell";
import { downloadWorkoutPdf } from "@/features/pdf/downloadPdf";
import { duplicateWorkoutById } from "@/lib/duplicate-workout";
import { getMuscleGroupForName } from "@/lib/exercise-library";
import { useAuth } from "@/lib/useAuth";
import { parsePhasesConfig, toPhasesJson } from "@/lib/phases-config";
import type { WorkoutFileV1 } from "@/lib/workout-import-export";
import { supabase } from "@/lib/supabase";
import type { WorkoutExerciseRow, WorkoutRow } from "@/lib/types";
import {
  defaultPhasesConfig,
  type WorkoutSheet,
} from "@fit-flow/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useNavigate, useParams } from "react-router-dom";

/* eslint-disable react-hooks/set-state-in-effect -- hydrate local form from TanStack Query snapshot */

function rowToDraft(row: WorkoutExerciseRow): ExerciseDraft {
  const fl =
    row.final_load_kg == null || row.final_load_kg === ""
      ? ""
      : String(row.final_load_kg);
  return {
    clientId: row.id,
    dbId: row.id,
    name: row.exercise_name,
    finalLoad: fl,
    phases: parsePhasesConfig(row.phases_config),
    techniques: (row.techniques ?? []).join(", "),
    notes: row.notes ?? "",
  };
}

function newEmptyExercise(): ExerciseDraft {
  return {
    clientId: crypto.randomUUID(),
    dbId: null,
    name: "",
    finalLoad: "",
    phases: defaultPhasesConfig(),
    techniques: "",
    notes: "",
  };
}

function parseFinalLoad(s: string): number | null {
  const t = s.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function buildSheet(
  title: string,
  exercises: ExerciseDraft[],
  opts?: { subtitle?: string },
): WorkoutSheet {
  return {
    title: title.trim() || "Treino",
    subtitle: opts?.subtitle,
    exportedAt: new Date().toISOString(),
    exercises: exercises.map((e) => {
      const name = e.name.trim() || "Sem nome";
      return {
        id: e.clientId,
        name,
        finalLoadKg: parseFinalLoad(e.finalLoad),
        phases: e.phases,
        techniques: e.techniques
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        notes: e.notes.trim() || undefined,
        muscleGroup: getMuscleGroupForName(name),
      };
    }),
  };
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-[0.2em] transition ${
    isActive ? "text-ink" : "text-neutral-400 hover:text-ink"
  }`;

export function WorkoutEditPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [notesExpanded, setNotesExpanded] = useState(false);
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as { display_name: string | null };
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

  useEffect(() => {
    setHydrated(false);
  }, [id]);

  useEffect(() => {
    if (!workoutQuery.data || hydrated) return;
    const { workout, exercises: rows } = workoutQuery.data;
    setTitle(workout.title);
    setWorkoutNotes(workout.notes ?? "");
    setNotesExpanded(Boolean(workout.notes?.trim()));
    setExercises(
      rows.length > 0 ? rows.map(rowToDraft) : [newEmptyExercise()],
    );
    setHydrated(true);
  }, [workoutQuery.data, hydrated]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error("Inválido");
      const { error: e1 } = await supabase
        .from("workouts")
        .update({
          title: title.trim() || "Treino",
          notes: workoutNotes.trim() || null,
        })
        .eq("id", id);
      if (e1) throw e1;

      const keptDbIds = new Set(
        exercises.filter((e) => e.dbId).map((e) => e.dbId as string),
      );
      const { data: existing } = await supabase
        .from("workout_exercises")
        .select("id")
        .eq("workout_id", id);
      const toDelete = (existing ?? [])
        .map((r) => r.id as string)
        .filter((rid) => !keptDbIds.has(rid));
      if (toDelete.length > 0) {
        const { error: e2 } = await supabase
          .from("workout_exercises")
          .delete()
          .in("id", toDelete);
        if (e2) throw e2;
      }

      for (let i = 0; i < exercises.length; i++) {
        const ex = exercises[i];
        const payload = {
          workout_id: id,
          sort_order: i,
          exercise_name: ex.name.trim() || "Exercício",
          final_load_kg: parseFinalLoad(ex.finalLoad),
          phases_config: toPhasesJson(ex.phases),
          techniques: ex.techniques
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          notes: ex.notes.trim() || null,
        };
        if (ex.dbId) {
          const { error: e3 } = await supabase
            .from("workout_exercises")
            .update(payload)
            .eq("id", ex.dbId);
          if (e3) throw e3;
        } else {
          const { error: e4 } = await supabase
            .from("workout_exercises")
            .insert(payload);
          if (e4) throw e4;
        }
      }
    },
    onSuccess: async () => {
      await qc.refetchQueries({ queryKey: ["workout", id] });
      await qc.invalidateQueries({ queryKey: ["workouts"] });
      setHydrated(false);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error("Inválido");
      return duplicateWorkoutById(id, user.id);
    },
    onSuccess: (newId) => {
      void qc.invalidateQueries({ queryKey: ["workouts"] });
      nav(`/workouts/${newId}`);
    },
  });

  const deleteWorkout = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("workouts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["workouts"] });
      nav("/");
    },
  });

  const updateExercise = useCallback((i: number, next: ExerciseDraft) => {
    setExercises((prev) => {
      const copy = [...prev];
      copy[i] = next;
      return copy;
    });
  }, []);

  const removeExercise = useCallback((i: number) => {
    setExercises((prev) => prev.filter((_, j) => j !== i));
  }, []);

  const addExercise = useCallback(() => {
    setExercises((prev) => [...prev, newEmptyExercise()]);
  }, []);

  const pdfName = useMemo(() => {
    const slug = (title || "treino")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    const d = new Date().toISOString().slice(0, 10);
    return `ficha-${slug}-${d}.pdf`;
  }, [title]);

  const handlePdf = useCallback(async () => {
    const who = profileQuery.data?.display_name?.trim();
    const sheet = buildSheet(title, exercises, {
      subtitle: who ? who : undefined,
    });
    await downloadWorkoutPdf(sheet, pdfName);
  }, [title, exercises, pdfName, profileQuery.data?.display_name]);

  const handleExportJson = useCallback(() => {
    if (!id) return;
    const payload: WorkoutFileV1 = {
      version: 1,
      title: title.trim() || "Treino",
      notes: workoutNotes.trim() || null,
      exercises: exercises.map((ex) => ({
        exercise_name: ex.name.trim() || "Exercício",
        final_load_kg: parseFinalLoad(ex.finalLoad),
        phases_config: toPhasesJson(ex.phases),
        techniques: ex.techniques
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        notes: ex.notes.trim() || null,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `fitflow-ficha-${id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, [id, title, workoutNotes, exercises]);

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
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-neutral-500">
          <img
            src="/fit-flow-mark.svg"
            alt=""
            className="h-10 w-10 animate-pulse rounded-2xl opacity-80"
          />
          <p className="text-sm font-medium uppercase tracking-widest">
            Carregando…
          </p>
        </div>
      </AppShell>
    );
  }
  if (workoutQuery.isError || !id) {
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
        <div className="px-4 py-16 text-center text-sm font-medium text-rose-600">
          Não foi possível carregar esta ficha.
        </div>
      </AppShell>
    );
  }
  if (!hydrated) {
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
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-neutral-500">
          <img
            src="/fit-flow-mark.svg"
            alt=""
            className="h-10 w-10 animate-pulse rounded-2xl opacity-80"
          />
          <p className="text-sm font-medium uppercase tracking-widest">
            Carregando…
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      nav={
        <nav className="flex items-center gap-10">
          <NavLink to="/" className={navLinkClass}>
            Fichas
          </NavLink>
          <NavLink to="/perfil" className={navLinkClass}>
            Perfil
          </NavLink>
        </nav>
      }
      actions={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <AiSuggestButton
            type="tip"
            payload={{
              exerciseCount: exercises.length,
              workoutTitle: title,
            }}
            label="Dica IA"
          />
          <Link
            to={`/workouts/${id}/treino`}
            className="focus-ring rounded-full bg-accent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:opacity-90"
          >
            Iniciar treino
          </Link>
          <Link
            to={`/workouts/${id}/historico`}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40"
          >
            Histórico
          </Link>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="focus-ring rounded-full bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {saveMutation.isPending ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40"
          >
            PDF
          </button>
          <button
            type="button"
            onClick={handleExportJson}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40"
            aria-label="Exportar ficha como arquivo JSON"
          >
            JSON
          </button>
          <button
            type="button"
            onClick={() => duplicateMutation.mutate()}
            disabled={duplicateMutation.isPending}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40 disabled:opacity-50"
            aria-label="Duplicar esta ficha"
          >
            {duplicateMutation.isPending ? "…" : "Duplicar"}
          </button>
        </div>
      }
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/"
            className="font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-ink"
          >
            ← Fichas
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:mt-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="workout-title"
                className="text-xs font-semibold uppercase tracking-wider text-neutral-500"
              >
                Título da ficha
              </label>
              <AiSuggestButton
                type="title"
                payload={{
                  exerciseNames: exercises
                    .map((e) => e.name.trim())
                    .filter(Boolean),
                }}
                label="Gerar título"
                onApply={(t) => setTitle(t)}
              />
            </div>
            <input
              id="workout-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3.5 font-display text-2xl uppercase tracking-wide text-ink shadow-sm sm:text-3xl"
            />
          </div>
          <div className="rounded-2xl border border-black/10 bg-white/80 shadow-sm">
            <button
              type="button"
              onClick={() => setNotesExpanded((e) => !e)}
              className="focus-ring flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-600 transition hover:text-ink"
              aria-expanded={notesExpanded}
            >
              <span>Notas da ficha</span>
              <span className="text-neutral-400" aria-hidden>
                {notesExpanded ? "−" : "+"}
              </span>
            </button>
            {notesExpanded ? (
              <div className="border-t border-black/10 px-4 pb-4 pt-2">
                <label htmlFor="workout-notes" className="sr-only">
                  Notas gerais desta ficha
                </label>
                <textarea
                  id="workout-notes"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  rows={4}
                  placeholder="Objetivo do treino, lembretes, ordem sugerida…"
                  className="focus-ring w-full resize-y rounded-2xl border border-black/10 bg-surface px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400"
                />
              </div>
            ) : null}
          </div>
        </div>

        {saveMutation.isError ? (
          <p className="mt-3 text-sm font-medium text-rose-600">
            {(saveMutation.error as Error).message}
          </p>
        ) : null}

        <section className="mt-10 space-y-6 sm:mt-12">
          {exercises.map((ex, i) => (
            <ExerciseCard
              key={ex.clientId}
              index={i}
              exercise={ex}
              onChange={(next) => updateExercise(i, next)}
              onRemove={() => removeExercise(i)}
            />
          ))}
        </section>

        <button
          type="button"
          onClick={addExercise}
          className="focus-ring mt-8 flex w-full items-center justify-center gap-2 rounded-[2rem] border border-dashed border-black/15 bg-white/60 py-4 text-xs font-semibold uppercase tracking-widest text-neutral-500 transition hover:border-ink/25 hover:text-ink"
        >
          <span className="text-lg leading-none">+</span>
          Adicionar exercício
        </button>

        <div className="mt-14 border-t border-black/10 pt-10">
          <button
            type="button"
            onClick={() => {
              if (confirm("Excluir esta ficha permanentemente?")) {
                deleteWorkout.mutate();
              }
            }}
            className="text-sm font-medium text-rose-600 underline-offset-4 hover:text-rose-500 hover:underline"
          >
            Excluir ficha
          </button>
        </div>
      </div>
    </AppShell>
  );
}
