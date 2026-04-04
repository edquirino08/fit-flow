import {
  computePhaseLoads,
  DEFAULT_PHASE_REPS,
  DEFAULT_PHASE_SETS,
  PHASE_ORDER,
  type PhasesConfig,
  type PhaseId,
} from "@fit-flow/domain";
import { useMemo } from "react";

const PHASE_LABELS: Record<PhaseId, string> = {
  aq1: "AQ1",
  aq2: "AQ2",
  aj1: "AJ1",
  aj2: "AJ2",
  work: "Trab.",
};

function fmtKg(n: number | null): string {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export type ExerciseDraft = {
  clientId: string;
  dbId: string | null;
  name: string;
  finalLoad: string;
  phases: PhasesConfig;
  techniques: string;
  notes: string;
};

type Props = {
  index: number;
  exercise: ExerciseDraft;
  onChange: (next: ExerciseDraft) => void;
  onRemove: () => void;
};

export function ExerciseCard({ index, exercise, onChange, onRemove }: Props) {
  const finalNum = useMemo(() => {
    const t = exercise.finalLoad.trim().replace(",", ".");
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  }, [exercise.finalLoad]);

  const loads = useMemo(
    () => computePhaseLoads(finalNum, exercise.phases),
    [finalNum, exercise.phases],
  );

  function setPhase(id: PhaseId, enabled: boolean) {
    onChange({
      ...exercise,
      phases: {
        ...exercise.phases,
        [id]: { ...exercise.phases[id], enabled },
      },
    });
  }

  function setReps(id: PhaseId, value: string) {
    const trimmed = value.trim();
    onChange({
      ...exercise,
      phases: {
        ...exercise.phases,
        [id]: {
          ...exercise.phases[id],
          reps: trimmed === "" ? undefined : trimmed,
        },
      },
    });
  }

  function setSets(id: PhaseId, value: string) {
    const n = Number.parseInt(value, 10);
    onChange({
      ...exercise,
      phases: {
        ...exercise.phases,
        [id]: {
          ...exercise.phases[id],
          sets: Number.isFinite(n) && n > 0 ? n : undefined,
        },
      },
    });
  }

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Exercício {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-rose-600 hover:text-rose-500"
        >
          Remover
        </button>
      </div>
      <input
        type="text"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        placeholder="Nome (ex.: Supino inclinado halteres)"
        className="mt-2 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-base font-medium text-neutral-900 placeholder:text-neutral-400 focus:border-fit-coral focus:outline-none focus:ring-2 focus:ring-fit-coral/20"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {PHASE_ORDER.map((id) => (
          <label
            key={id}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-2.5 py-1.5 text-xs text-neutral-700 hover:border-fit-coral/40"
          >
            <input
              type="checkbox"
              checked={exercise.phases[id].enabled}
              onChange={(e) => setPhase(id, e.target.checked)}
              className="rounded border-neutral-300 text-fit-coral focus:ring-fit-coral/30"
            />
            {PHASE_LABELS[id]}
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-medium text-neutral-500">
            Carga final (kg)
          </span>
          <input
            type="text"
            inputMode="decimal"
            value={exercise.finalLoad}
            onChange={(e) =>
              onChange({ ...exercise, finalLoad: e.target.value })
            }
            placeholder="20"
            className="mt-1 w-full rounded-xl border border-amber-200/80 bg-amber-50/50 px-3 py-2 font-mono text-lg text-neutral-900 placeholder:text-amber-800/40 focus:border-fit-coral focus:outline-none focus:ring-2 focus:ring-fit-coral/20"
          />
        </label>
        <label className="col-span-2 block sm:col-span-2">
          <span className="text-xs font-medium text-neutral-500">
            Técnicas (separe por vírgula)
          </span>
          <input
            type="text"
            value={exercise.techniques}
            onChange={(e) =>
              onChange({ ...exercise, techniques: e.target.value })
            }
            placeholder="rest-pause, drop set, pico 2s"
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-fit-coral focus:outline-none focus:ring-2 focus:ring-fit-coral/20"
          />
        </label>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50/50">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-white text-xs font-medium uppercase tracking-wide text-neutral-500">
              <th className="px-2 py-2 w-14" />
              {loads.map((l) => (
                <th key={l.id} className="px-2 py-2">
                  {PHASE_LABELS[l.id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-neutral-100 font-mono text-neutral-800">
              <td className="px-2 py-2 text-xs font-medium text-neutral-500">Carga</td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2">
                  {l.enabled ? `${fmtKg(l.kg)} kg` : "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-neutral-100 text-neutral-800">
              <td className="px-2 py-2 text-xs font-medium text-neutral-500">Reps</td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2 align-top">
                  {l.enabled ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={exercise.phases[l.id].reps ?? ""}
                      placeholder={DEFAULT_PHASE_REPS[l.id]}
                      onChange={(e) => setReps(l.id, e.target.value)}
                      className="w-full min-w-[3rem] rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center text-sm text-fit-coral placeholder:text-neutral-400 focus:border-fit-coral focus:outline-none focus:ring-1 focus:ring-fit-coral/30"
                    />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="text-neutral-800">
              <td className="px-2 py-2 text-xs font-medium text-neutral-500">Séries</td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2 align-top">
                  {l.enabled ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={exercise.phases[l.id].sets ?? ""}
                      placeholder={String(DEFAULT_PHASE_SETS[l.id])}
                      onChange={(e) => setSets(l.id, e.target.value)}
                      className="w-full min-w-[3rem] rounded-lg border border-neutral-200 bg-white px-2 py-1 text-center text-sm text-fit-coral placeholder:text-neutral-400 focus:border-fit-coral focus:outline-none focus:ring-1 focus:ring-fit-coral/30"
                    />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <label className="mt-3 block">
        <span className="text-xs font-medium text-neutral-500">
          Observações
        </span>
        <textarea
          value={exercise.notes}
          onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
          rows={2}
          className="mt-1 w-full resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-fit-coral focus:outline-none focus:ring-2 focus:ring-fit-coral/20"
          placeholder="Opcional"
        />
      </label>
    </article>
  );
}
