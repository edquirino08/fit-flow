import { useAuth } from "@/lib/useAuth";
import { supabase } from "@/lib/supabase";
import type { WorkoutRow } from "@/lib/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";

export function WorkoutsListPage() {
  const { user, signOut } = useAuth();
  const qc = useQueryClient();
  const nav = useNavigate();

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Suas fichas
          </h1>
          <p className="text-sm text-neutral-500">
            Toque para editar · PDF na tela do treino
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="rounded-xl bg-fit-coral px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-fit-coral-hover disabled:opacity-50"
          >
            {create.isPending ? "…" : "Nova ficha"}
          </button>
          <button
            type="button"
            onClick={() => signOut()}
            className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 shadow-sm hover:border-neutral-300"
          >
            Sair
          </button>
        </div>
      </header>

      {create.isError ? (
        <p className="mt-4 text-sm text-rose-600">
          {(create.error as Error).message}
        </p>
      ) : null}

      <ul className="mt-8 space-y-4">
        {isLoading ? (
          <li className="text-neutral-500">Carregando…</li>
        ) : null}
        {!isLoading && workouts?.length === 0 ? (
          <li className="rounded-2xl border border-dashed border-neutral-300 bg-white/60 p-8 text-center text-neutral-500">
            Nenhuma ficha ainda. Crie uma para começar.
          </li>
        ) : null}
        {workouts?.map((w) => (
          <li key={w.id}>
            <Link
              to={`/workouts/${w.id}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition hover:border-fit-coral/35 hover:shadow-md"
            >
              <div className="font-medium text-neutral-900">{w.title}</div>
              <div className="text-xs text-neutral-500">
                Atualizado{" "}
                {new Date(w.updated_at).toLocaleString("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
