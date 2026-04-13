import { AiSuggestButton } from "@/components/AiSuggestButton";
import { ExerciseNameCombobox } from "@/components/ExerciseNameCombobox";
import { PhaseExplainButton } from "@/components/PhaseExplainButton";
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
    <article className="rounded-[2rem] border border-black/[0.08] bg-white p-5 shadow-[0_6px_32px_rgba(0,0,0,0.05)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-neutral-500">
          Exercício {index + 1}
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold uppercase tracking-wider text-rose-600 hover:text-rose-500"
          aria-label={`Remover exercício ${index + 1}`}
        >
          Remover
        </button>
      </div>
      <ExerciseNameCombobox
        id={`exercise-name-${exercise.clientId}`}
        value={exercise.name}
        onChange={(name) => onChange({ ...exercise, name })}
        placeholder="Nome (ex.: Supino inclinado halteres)"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {PHASE_ORDER.map((id) => (
          <label
            key={id}
            className={`flex cursor-pointer items-center gap-2 rounded-2xl border px-2.5 py-2 text-xs font-medium transition ${
              exercise.phases[id].enabled
                ? "border-ink/20 bg-accent/25 text-ink"
                : "border-black/10 bg-surface text-neutral-600 hover:border-black/20"
            }`}
          >
            <input
              type="checkbox"
              checked={exercise.phases[id].enabled}
              onChange={(e) => setPhase(id, e.target.checked)}
              className="rounded border-neutral-400 text-ink focus:ring-ink/30"
              aria-label={`${exercise.phases[id].enabled ? "Desativar" : "Ativar"} fase ${PHASE_LABELS[id]} do exercício ${index + 1}`}
            />
            <span className="flex items-center gap-0.5">
              {PHASE_LABELS[id]}
              <PhaseExplainButton phaseLabel={PHASE_LABELS[id]} />
            </span>
          </label>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
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
            className="focus-ring mt-1.5 w-full rounded-2xl border border-accent/50 bg-accent/15 px-3 py-2.5 font-mono text-lg text-ink placeholder:text-neutral-400"
          />
        </label>
        <div className="col-span-2 flex flex-col gap-2 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Técnicas (separe por vírgula)
            </span>
            <AiSuggestButton
              type="techniques"
              payload={{
                exerciseName: exercise.name,
                context: exercise.notes,
              }}
              label="Sugerir"
              onApply={(t) => {
                const flat = t.replace(/\n+/g, ", ").replace(/^[-•]\s*/gm, "");
                const cur = exercise.techniques.trim();
                onChange({
                  ...exercise,
                  techniques: cur ? `${cur}, ${flat}` : flat,
                });
              }}
            />
          </div>
          <input
            type="text"
            value={exercise.techniques}
            onChange={(e) =>
              onChange({ ...exercise, techniques: e.target.value })
            }
            placeholder="rest-pause, drop set, pico 2s"
            className="focus-ring w-full rounded-2xl border border-black/10 bg-surface px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400"
          />
        </div>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-surface/80">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-white text-xs font-semibold uppercase tracking-wider text-neutral-500">
              <th className="w-14 px-2 py-2.5" />
              {loads.map((l) => (
                <th key={l.id} className="px-2 py-2.5">
                  {PHASE_LABELS[l.id]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-black/5 font-mono text-neutral-800">
              <td className="px-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Carga
              </td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2.5">
                  {l.enabled ? `${fmtKg(l.kg)} kg` : "—"}
                </td>
              ))}
            </tr>
            <tr className="border-b border-black/5 text-neutral-800">
              <td className="px-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Reps
              </td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2.5 align-top">
                  {l.enabled ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={exercise.phases[l.id].reps ?? ""}
                      placeholder={DEFAULT_PHASE_REPS[l.id]}
                      onChange={(e) => setReps(l.id, e.target.value)}
                      className="focus-ring w-full min-w-[3rem] rounded-xl border border-black/10 bg-white px-2 py-1.5 text-center text-sm font-semibold text-ink placeholder:text-neutral-400"
                    />
                  ) : (
                    <span className="text-neutral-400">—</span>
                  )}
                </td>
              ))}
            </tr>
            <tr className="text-neutral-800">
              <td className="px-2 py-2.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Séries
              </td>
              {loads.map((l) => (
                <td key={l.id} className="px-2 py-2.5 align-top">
                  {l.enabled ? (
                    <input
                      type="text"
                      inputMode="numeric"
                      value={exercise.phases[l.id].sets ?? ""}
                      placeholder={String(DEFAULT_PHASE_SETS[l.id])}
                      onChange={(e) => setSets(l.id, e.target.value)}
                      className="focus-ring w-full min-w-[3rem] rounded-xl border border-black/10 bg-white px-2 py-1.5 text-center text-sm font-semibold text-ink placeholder:text-neutral-400"
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
      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
          Observações
        </span>
        <textarea
          value={exercise.notes}
          onChange={(e) => onChange({ ...exercise, notes: e.target.value })}
          rows={2}
          className="focus-ring mt-1.5 w-full resize-none rounded-2xl border border-black/10 bg-surface px-3 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400"
          placeholder="Opcional"
        />
      </label>
    </article>
  );
}
