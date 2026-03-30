export type WorkoutRow = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
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
