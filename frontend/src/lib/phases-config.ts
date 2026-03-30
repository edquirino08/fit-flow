import {
  PHASE_ORDER,
  defaultPhasesConfig,
  type PhasesConfig,
} from "@fit-flow/domain";
import { z } from "zod";

const toggleSchema = z.object({
  enabled: z.boolean(),
  pct: z.number().min(0).max(1).optional(),
});

/** Parse JSONB from DB into a full PhasesConfig. */
export function parsePhasesConfig(raw: unknown): PhasesConfig {
  const base = defaultPhasesConfig();
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  for (const id of PHASE_ORDER) {
    const v = obj[id];
    const r = toggleSchema.safeParse(v);
    if (r.success) {
      base[id] = r.data;
    }
  }
  return base;
}

/** Store-ready JSON (same shape). */
export function toPhasesJson(config: PhasesConfig): Record<string, unknown> {
  return { ...config };
}
