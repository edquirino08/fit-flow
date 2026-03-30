import type { PhasesConfig } from "./phases.js";

/** Serializable exercise row for UI + PDF. */
export type SheetExercise = {
  id: string;
  name: string;
  finalLoadKg: number | null;
  phases: PhasesConfig;
  /** Short labels e.g. rest-pause, drop-set */
  techniques: string[];
  notes?: string;
};

export type WorkoutSheet = {
  title: string;
  subtitle?: string;
  exercises: SheetExercise[];
  exportedAt?: string;
};
