import { roundToStep } from "./round.js";

export const PHASE_ORDER = ["aq1", "aq2", "aj1", "aj2", "work"] as const;

export type PhaseId = (typeof PHASE_ORDER)[number];

export type PhaseDefinition = {
  id: PhaseId;
  label: string;
  /** Default fraction of final load (work = 1). */
  defaultPct: number;
};

export const PHASE_DEFINITIONS: readonly PhaseDefinition[] = [
  { id: "aq1", label: "AQ1", defaultPct: 0.33 },
  { id: "aq2", label: "AQ2", defaultPct: 0.5 },
  { id: "aj1", label: "AJ1", defaultPct: 0.67 },
  { id: "aj2", label: "AJ2", defaultPct: 0.83 },
  { id: "work", label: "Trabalho", defaultPct: 1 },
] as const;

/** Default rep prescription per phase when `reps` is not set on the toggle. */
export const DEFAULT_PHASE_REPS: Record<PhaseId, string> = {
  aq1: "15",
  aq2: "10",
  aj1: "4-6",
  aj2: "4-6",
  work: "6-10",
};

/** Default number of sets per phase when `sets` is not set on the toggle. */
export const DEFAULT_PHASE_SETS: Record<PhaseId, number> = {
  aq1: 1,
  aq2: 1,
  aj1: 1,
  aj2: 1,
  work: 1,
};

export type PhaseToggle = {
  enabled: boolean;
  /** Override default percentage (0–1). If omitted, uses preset default. */
  pct?: number;
  /** Rep range or count (e.g. "15", "4-6"). If omitted, uses DEFAULT_PHASE_REPS. */
  reps?: string;
  /** Number of sets. If omitted, uses DEFAULT_PHASE_SETS. */
  sets?: number;
};

export type PhasesConfig = Record<PhaseId, PhaseToggle>;

export function defaultPhasesConfig(overrides?: Partial<PhasesConfig>): PhasesConfig {
  const base: PhasesConfig = {
    aq1: { enabled: true },
    aq2: { enabled: true },
    aj1: { enabled: true },
    aj2: { enabled: true },
    work: { enabled: true },
  };
  if (!overrides) return base;
  return { ...base, ...overrides };
}

export function repsForPhase(id: PhaseId, phases: PhasesConfig): string {
  const raw = phases[id]?.reps?.trim();
  if (raw) return raw;
  return DEFAULT_PHASE_REPS[id];
}

export function setsForPhase(id: PhaseId, phases: PhasesConfig): number {
  const val = phases[id]?.sets;
  if (val != null && Number.isFinite(val) && val > 0) return val;
  return DEFAULT_PHASE_SETS[id];
}

function pctForPhase(id: PhaseId, config: PhasesConfig): number {
  const toggle = config[id];
  const def = PHASE_DEFINITIONS.find((p) => p.id === id);
  const fallback = def?.defaultPct ?? 1;
  if (toggle.pct !== undefined && Number.isFinite(toggle.pct)) {
    return toggle.pct;
  }
  return fallback;
}

export type ComputedPhaseLoad = {
  id: PhaseId;
  label: string;
  kg: number | null;
  enabled: boolean;
  reps: string;
  sets: number;
};

export type ComputeOptions = {
  /** Round loads to nearest step (default 2.5 kg). */
  stepKg?: number;
};

/**
 * Given final working weight, returns per-phase loads (null when phase disabled).
 */
export function computePhaseLoads(
  finalKg: number | null | undefined,
  phases: PhasesConfig,
  options: ComputeOptions = {},
): ComputedPhaseLoad[] {
  const step = options.stepKg ?? 2.5;
  const final = finalKg == null || !Number.isFinite(finalKg) ? null : finalKg;

  return PHASE_ORDER.map((id) => {
    const toggle = phases[id];
    const def = PHASE_DEFINITIONS.find((p) => p.id === id)!;
    const reps = repsForPhase(id, phases);
    const sets = setsForPhase(id, phases);
    if (!toggle.enabled) {
      return { id, label: def.label, kg: null, enabled: false, reps, sets };
    }
    if (final == null) {
      return { id, label: def.label, kg: null, enabled: true, reps, sets };
    }
    const pct = pctForPhase(id, phases);
    const raw = id === "work" ? final : final * pct;
    const kg = id === "work" ? raw : roundToStep(raw, step);
    return { id, label: def.label, kg, enabled: true, reps, sets };
  });
}
