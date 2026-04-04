import { ExerciseCard, type ExerciseDraft } from "@/components/ExerciseCard";
import { downloadWorkoutPdf } from "@/features/pdf/downloadPdf";
import { useAuth } from "@/lib/useAuth";
import { parsePhasesConfig, toPhasesJson } from "@/lib/phases-config";
import { supabase } from "@/lib/supabase";
import type { WorkoutExerciseRow, WorkoutRow } from "@/lib/types";
import {
  defaultPhasesConfig,
  type WorkoutSheet,
} from "@fit-flow/domain";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

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

function buildSheet(title: string, exercises: ExerciseDraft[]): WorkoutSheet {
  return {
    title: title.trim() || "Treino",
    exportedAt: new Date().toISOString(),
    exercises: exercises.map((e) => ({
      id: e.clientId,
      name: e.name.trim() || "Sem nome",
      finalLoadKg: parseFinalLoad(e.finalLoad),
      phases: e.phases,
      techniques: e.techniques
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean),
      notes: e.notes.trim() || undefined,
    })),
  };
}

export function WorkoutEditPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [hydrated, setHydrated] = useState(false);

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
        .update({ title: title.trim() || "Treino" })
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
    const sheet = buildSheet(title, exercises);
    await downloadWorkoutPdf(sheet, pdfName);
  }, [title, exercises, pdfName]);

  if (workoutQuery.isLoading) {
    return (
      <div className="px-4 py-16 text-center text-neutral-500">Carregando…</div>
    );
  }
  if (workoutQuery.isError || !id) {
    return (
      <div className="px-4 py-16 text-center text-rose-600">
        Não foi possível carregar esta ficha.
      </div>
    );
  }
  if (!hydrated) {
    return (
      <div className="px-4 py-16 text-center text-neutral-500">Carregando…</div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500">
        <Link to="/" className="font-medium text-fit-coral hover:underline">
          ← Fichas
        </Link>
      </div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label className="text-xs font-medium text-neutral-500">
            Título da ficha
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-lg font-semibold text-neutral-900 shadow-sm focus:border-fit-coral focus:outline-none focus:ring-2 focus:ring-fit-coral/20"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="rounded-xl bg-fit-coral px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-fit-coral-hover disabled:opacity-50"
          >
            {saveMutation.isPending ? "Salvando…" : "Salvar"}
          </button>
          <button
            type="button"
            onClick={() => void handlePdf()}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm hover:border-neutral-300"
          >
            Exportar PDF
          </button>
        </div>
      </div>
      {saveMutation.isError ? (
        <p className="mt-2 text-sm text-rose-600">
          {(saveMutation.error as Error).message}
        </p>
      ) : null}

      <section className="mt-10 space-y-6">
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
        className="mt-6 w-full rounded-2xl border border-dashed border-neutral-300 bg-white/50 py-4 text-sm text-neutral-500 hover:border-fit-coral/50 hover:text-fit-coral"
      >
        + Adicionar exercício
      </button>

      <div className="mt-12 border-t border-neutral-200 pt-8">
        <button
          type="button"
          onClick={() => {
            if (confirm("Excluir esta ficha permanentemente?")) {
              deleteWorkout.mutate();
            }
          }}
          className="text-sm text-rose-600 hover:text-rose-500"
        >
          Excluir ficha
        </button>
      </div>
    </div>
  );
}
