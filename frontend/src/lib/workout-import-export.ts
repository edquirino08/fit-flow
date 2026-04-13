import { z } from "zod";

export const WORKOUT_EXPORT_VERSION = 1 as const;

const exerciseImportSchema = z.object({
  exercise_name: z.string().min(1),
  final_load_kg: z.number().finite().nullable().optional(),
  phases_config: z.record(z.string(), z.unknown()).default({}),
  techniques: z.array(z.string()).optional().default([]),
  notes: z.string().nullable().optional(),
});

export const workoutFileSchema = z.object({
  version: z.literal(1),
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  exercises: z.array(exerciseImportSchema).min(1),
});

export type WorkoutFileV1 = z.infer<typeof workoutFileSchema>;

export function parseWorkoutFileJson(text: string): WorkoutFileV1 {
  const raw = JSON.parse(text) as unknown;
  return workoutFileSchema.parse(raw);
}
