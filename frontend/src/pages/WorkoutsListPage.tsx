import { OnboardingOverlay } from "@/components/OnboardingOverlay";
import { readOnboardingDone } from "@/lib/onboarding-storage";
import { AppShell } from "@/components/AppShell";
import { StarMark } from "@/components/StarMark";
import { duplicateWorkoutById } from "@/lib/duplicate-workout";
import { parseWorkoutFileJson } from "@/lib/workout-import-export";
import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import type { WorkoutRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export function WorkoutsListPage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();
  const importFileRef = useRef<HTMLInputElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(
    () => !readOnboardingDone(),
  );

  const { data: workouts, isLoading } = useQuery({
    queryKey: ["workouts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workouts")
        .select("id,title,created_at,updated_at")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as Pick<
        WorkoutRow,
        "id" | "title" | "created_at" | "updated_at"
      >[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("workouts")
        .insert({ title: "Treino", user_id: user.id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (id) => {
      void qc.invalidateQueries({ queryKey: ["workouts"] });
      nav(`/workouts/${id}`);
    },
  });

  const duplicate = useMutation({
    mutationFn: async (sourceId: string) => {
      if (!user) throw new Error("Não autenticado");
      return duplicateWorkoutById(sourceId, user.id);
    },
    onSuccess: (newId) => {
      void qc.invalidateQueries({ queryKey: ["workouts"] });
      nav(`/workouts/${newId}`);
    },
  });

  const importJson = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Não autenticado");
      let parsed;
      try {
        const text = await file.text();
        parsed = parseWorkoutFileJson(text);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Arquivo JSON inválido ou incompleto";
        throw new Error(msg);
      }
      const { data: w, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          title: parsed.title,
          notes: parsed.notes ?? null,
        })
        .select("id")
        .single();
      if (error) throw error;
      const wid = w.id as string;
      for (let i = 0; i < parsed.exercises.length; i++) {
        const ex = parsed.exercises[i];
        const { error: exErr } = await supabase.from("workout_exercises").insert({
          workout_id: wid,
          sort_order: i,
          exercise_name: ex.exercise_name,
          final_load_kg: ex.final_load_kg ?? null,
          phases_config: ex.phases_config,
          techniques: ex.techniques ?? [],
          notes: ex.notes ?? null,
        });
        if (exErr) throw exErr;
      }
      return wid;
    },
    onSuccess: (newId) => {
      void qc.invalidateQueries({ queryKey: ["workouts"] });
      nav(`/workouts/${newId}`);
    },
  });

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-xs font-semibold uppercase tracking-[0.2em] transition ${
      isActive ? "text-ink" : "text-neutral-400 hover:text-ink"
    }`;

  const shouldShowTour =
    showOnboarding &&
    !isLoading &&
    workouts?.length === 0 &&
    !readOnboardingDone();

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
      actions={
        <>
          <input
            ref={importFileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson.mutate(f);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => importFileRef.current?.click()}
            disabled={importJson.isPending}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40 disabled:opacity-50 sm:px-5"
            aria-label="Importar ficha a partir de arquivo JSON"
          >
            {importJson.isPending ? "…" : "Importar JSON"}
          </button>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="focus-ring rounded-full bg-ink px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50 sm:px-5"
          >
            {create.isPending ? "…" : "Nova ficha"}
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40 sm:px-5"
          >
            Sair
          </button>
        </>
      }
    >
      <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14 md:max-w-3xl">
        <div className="flex flex-col items-center text-center">
          <StarMark className="mb-5 h-4 w-4 text-ink" />
          <h1 className="font-display text-3xl uppercase tracking-wide text-ink sm:text-4xl md:text-5xl">
            Suas fichas
          </h1>
          <p className="mt-3 max-w-md text-sm font-medium text-neutral-600">
            Toque para editar. Na ficha, exporte PDF com um toque.
          </p>
        </div>

        {create.isError ? (
          <p className="mt-8 text-center text-sm font-medium text-rose-600">
            {(create.error as Error).message}
          </p>
        ) : null}
        {importJson.isError ? (
          <p className="mt-8 text-center text-sm font-medium text-rose-600">
            {(importJson.error as Error).message}
          </p>
        ) : null}

        <ul className="mt-12 space-y-4 sm:mt-14">
          {isLoading ? (
            <li className="rounded-[2rem] border border-dashed border-black/15 bg-white/50 py-12 text-center text-sm font-medium text-neutral-500">
              Carregando…
            </li>
          ) : null}
          {!isLoading && workouts?.length === 0 ? (
            <li className="rounded-[2rem] border border-dashed border-black/12 bg-white/70 py-14 text-center">
              <p className="text-sm font-medium text-neutral-600">
                Nenhuma ficha ainda.
              </p>
              <p className="mt-2 text-xs uppercase tracking-widest text-neutral-400">
                Crie uma para começar
              </p>
            </li>
          ) : null}
          {workouts?.map((w) => (
            <li key={w.id}>
              <div className="flex flex-col gap-2 rounded-[2rem] border border-black/[0.07] bg-white p-5 shadow-[0_6px_32px_rgba(0,0,0,0.05)] transition hover:border-black/15 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                <Link
                  to={`/workouts/${w.id}`}
                  className="group flex min-w-0 flex-1 items-center justify-between gap-4"
                >
                  <div className="min-w-0 text-left">
                    <div className="font-display text-xl uppercase tracking-wide text-ink sm:text-2xl">
                      {w.title}
                    </div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-neutral-400">
                      Atualizado{" "}
                      {new Date(w.updated_at).toLocaleString("pt-BR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </div>
                  </div>
                  <span
                    className="shrink-0 text-2xl text-ink/30 transition group-hover:text-ink group-hover:translate-x-0.5"
                    aria-hidden
                  >
                    →
                  </span>
                </Link>
                <button
                  type="button"
                  disabled={duplicate.isPending}
                  onClick={(e) => {
                    e.preventDefault();
                    duplicate.mutate(w.id);
                  }}
                  className="focus-ring shrink-0 rounded-full border border-ink/15 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/35 disabled:opacity-50"
                  aria-label={`Duplicar ficha ${w.title}`}
                >
                  Duplicar
                </button>
              </div>
            </li>
          ))}
        </ul>

        {shouldShowTour ? (
          <OnboardingOverlay
            onDismiss={() => {
              setShowOnboarding(false);
            }}
          />
        ) : null}
      </div>
    </AppShell>
  );
}
