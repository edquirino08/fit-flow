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

export type PhaseToggle = {
  enabled: boolean;
  /** Override default percentage (0–1). If omitted, uses preset default. */
  pct?: number;
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
    if (!toggle.enabled) {
      return { id, label: def.label, kg: null, enabled: false };
    }
    if (final == null) {
      return { id, label: def.label, kg: null, enabled: true };
    }
    const pct = pctForPhase(id, phases);
    const raw = id === "work" ? final : final * pct;
    const kg = id === "work" ? roundToStep(raw, step) : roundToStep(raw, step);
    return { id, label: def.label, kg, enabled: true };
  });
}
