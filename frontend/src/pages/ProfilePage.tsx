import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/useAuth";
import type { ProfilePreferences, ProfileRow } from "@/lib/types";
import { supabase } from "@/lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-[0.2em] transition ${
    isActive ? "text-ink" : "text-neutral-400 hover:text-ink"
  }`;

function normalizePreferences(raw: unknown): ProfilePreferences {
  if (!raw || typeof raw !== "object") return {};
  const o = raw as Record<string, unknown>;
  const unit = o.unit === "lb" ? "lb" : o.unit === "kg" ? "kg" : undefined;
  const step = o.stepKg;
  const stepKg =
    typeof step === "number" && Number.isFinite(step) && step > 0
      ? step
      : undefined;
  return { unit, stepKg };
}

function ProfileEditor({
  profile,
  userId,
}: {
  profile: ProfileRow;
  userId: string;
}) {
  const qc = useQueryClient();
  const prefs = normalizePreferences(profile.preferences);
  const [displayName, setDisplayName] = useState(
    () => profile.display_name ?? "",
  );
  const [unit, setUnit] = useState<"kg" | "lb">(() => prefs.unit ?? "kg");
  const [stepKg, setStepKg] = useState(() =>
    prefs.stepKg != null ? String(prefs.stepKg) : "2.5",
  );
  const [savedFlash, setSavedFlash] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const step = Number.parseFloat(stepKg.replace(",", "."));
      const preferences: ProfilePreferences = {
        unit,
        stepKg: Number.isFinite(step) && step > 0 ? step : 2.5,
      };
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName.trim() || null,
          preferences,
        })
        .eq("id", userId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile", userId] });
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2500);
    },
  });

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:py-14">
      <Link
        to="/"
        className="text-sm font-semibold uppercase tracking-wider text-neutral-500 transition hover:text-ink"
      >
        ← Fichas
      </Link>
      <h1 className="mt-6 font-display text-3xl uppercase tracking-wide text-ink">
        Perfil
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Nome exibido no app e preferências para futuras versões (unidade e passo
        de anilha).
      </p>

      <form
        className="mt-10 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          saveMutation.mutate();
        }}
      >
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Nome de exibição
          </span>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-base text-ink"
            placeholder="Seu nome"
            autoComplete="name"
          />
        </label>

        <fieldset className="space-y-3 rounded-2xl border border-black/10 bg-white/80 p-4">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Preferências
          </legend>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Unidade de carga
            </span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as "kg" | "lb")}
              className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-surface px-3 py-2.5 text-sm text-ink"
            >
              <option value="kg">Quilogramas (kg)</option>
              <option value="lb">Libras (lb)</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Passo de arredondamento (kg)
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={stepKg}
              onChange={(e) => setStepKg(e.target.value)}
              className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-surface px-3 py-2.5 font-mono text-sm text-ink"
              placeholder="2.5"
            />
            <span className="mt-1 block text-xs text-neutral-500">
              Usado nas fases de aquecimento (padrão 2,5 kg). Conversão lb virá
              em versões futuras.
            </span>
          </label>
        </fieldset>

        {saveMutation.isError ? (
          <p className="text-sm font-medium text-rose-600">
            {(saveMutation.error as Error).message}
          </p>
        ) : null}
        {savedFlash ? (
          <p className="text-sm font-medium text-emerald-700">Salvo.</p>
        ) : null}

        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="focus-ring rounded-full bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Salvando…" : "Salvar perfil"}
        </button>
      </form>
    </div>
  );
}

export function ProfilePage() {
  const { user, signOut } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,display_name,preferences,created_at")
        .eq("id", user!.id)
        .single();
      if (error) throw error;
      return data as ProfileRow;
    },
  });

  const shellNav = (
    <nav className="flex items-center gap-10">
      <NavLink to="/" end className={navLinkClass}>
        Fichas
      </NavLink>
      <NavLink to="/perfil" className={navLinkClass}>
        Perfil
      </NavLink>
    </nav>
  );

  if (profileQuery.isLoading) {
    return (
      <AppShell nav={shellNav}>
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-neutral-500">
          <p className="text-sm font-medium uppercase tracking-widest">
            Carregando…
          </p>
        </div>
      </AppShell>
    );
  }

  if (profileQuery.isError) {
    return (
      <AppShell nav={shellNav}>
        <p className="px-4 py-16 text-center text-sm text-rose-600">
          Não foi possível carregar o perfil. Rode a migration mais recente no
          Supabase se a coluna preferences ainda não existir.
        </p>
      </AppShell>
    );
  }

  if (!user || !profileQuery.data) {
    return null;
  }

  return (
    <AppShell
      nav={shellNav}
      actions={
        <button
          type="button"
          onClick={() => signOut()}
          className="focus-ring rounded-full border border-ink/20 bg-transparent px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-ink transition hover:border-ink/40 sm:px-5"
        >
          Sair
        </button>
      }
    >
      <ProfileEditor profile={profileQuery.data} userId={user.id} />
    </AppShell>
  );
}
