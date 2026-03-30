import {
  computePhaseLoads,
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

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-lg shadow-black/20 backdrop-blur">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Exercício {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs text-rose-400 hover:text-rose-300"
        >
          Remover
        </button>
      </div>
      <input
        type="text"
        value={exercise.name}
        onChange={(e) => onChange({ ...exercise, name: e.target.value })}
        placeholder="Nome (ex.: Supino inclinado halteres)"
        className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-base font-medium text-white placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {PHASE_ORDER.map((id) => (
          <label
            key={id}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-2 py-1 text-xs text-slate-300 hover:border-slate-600"
          >
            <input
              type="checkbox"
              checked={exercise.phases[id].enabled}
              onChange={(e) => setPhase(id, e.target.checked)}
              className="rounded border-slate-600 text-emerald-500 focus:ring-emerald-500/30"
            />
            {PHASE_LABELS[id]}
          </label>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs text-slate-500">Carga final (kg)</span>
          <input
            type="text"
            inputMode="decimal"
            value={exercise.finalLoad}
            onChange={(e) =>
              onChange({ ...exercise, finalLoad: e.target.value })
            }
            placeholder="20"
            className="mt-1 w-full rounded-lg border border-emerald-600/40 bg-emerald-950/30 px-3 py-2 font-mono text-lg text-emerald-100 placeholder:text-emerald-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </label>
        <label className="col-span-2 block sm:col-span-2">
          <span className="text-xs text-slate-500">
            Técnicas (separe por vírgula)
          </span>
          <input
            type="text"
            value={exercise.techniques}
            onChange={(e) =>
              onChange({ ...exercise, techniques: e.target.value })
            }
            placeholder="rest-pause, drop set, pico 2s"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
          />
        </label>
      </div>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/80 text-xs uppercase text-slate-500">
              {loads.map((l) => (
                <th key={l.id} className="px-2 py-2 font-medium">
                  {PHASE_LABELS[l.id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="font-mono text-emerald-100">
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2">
                  {l.enabled ? `${fmtKg(l.kg)} kg` : "—"}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <label className="mt-3 block">
        <span className="text-xs text-slate-500">Observações</span>
        <textarea
          value={exercise.notes}
          onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
          rows={2}
          className="mt-1 w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none"
          placeholder="Opcional"
        />
      </label>
    </article>
  );
}
