import { supabase } from "@/lib/supabase";

/**
 * Clones a workout and its exercises for the same user. Returns the new workout id.
 */
export async function duplicateWorkoutById(
  sourceWorkoutId: string,
  userId: string,
): Promise<string> {
  const { data: w, error: e1 } = await supabase
    .from("workouts")
    .select("title, notes")
    .eq("id", sourceWorkoutId)
    .single();
  if (e1) throw e1;

  const newTitle = `${w.title} (cópia)`;

  const { data: newRow, error: e2 } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      title: newTitle.length > 200 ? newTitle.slice(0, 200) : newTitle,
      notes: w.notes,
    })
    .select("id")
    .single();
  if (e2) throw e2;

  const { data: exercises, error: e3 } = await supabase
    .from("workout_exercises")
    .select("*")
    .eq("workout_id", sourceWorkoutId)
    .order("sort_order", { ascending: true });
  if (e3) throw e3;

  if (exercises?.length) {
    const inserts = exercises.map((ex, i) => ({
      workout_id: newRow.id,
      sort_order: i,
      exercise_name: ex.exercise_name,
      final_load_kg: ex.final_load_kg,
      phases_config: ex.phases_config,
      techniques: ex.techniques ?? [],
      notes: ex.notes,
    }));
    const { error: e4 } = await supabase
      .from("workout_exercises")
      .insert(inserts);
    if (e4) throw e4;
  }

  return newRow.id as string;
}
