/** Stored in profiles.preferences JSON */
export type ProfilePreferences = {
  unit?: "kg" | "lb";
  stepKg?: number;
};

export type ProfileRow = {
  id: string;
  display_name: string | null;
  preferences: ProfilePreferences | null;
  created_at: string;
};

export type WorkoutRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutLogRow = {
  id: string;
  workout_id: string;
  user_id: string;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
};

export type ExerciseLogEntryRow = {
  id: string;
  log_id: string;
  exercise_name: string;
  phase_id: string;
  planned_kg: string | number | null;
  actual_kg: string | number | null;
  planned_reps: string | null;
  actual_reps: number | null;
  set_number: number;
  completed: boolean;
};

export type WorkoutExerciseRow = {
  id: string;
  workout_id: string;
  sort_order: number;
  exercise_name: string;
  final_load_kg: string | number | null;
  phases_config: unknown;
  techniques: string[] | null;
  notes: string | null;
};
