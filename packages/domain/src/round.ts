/**
 * Rounds to the nearest increment (e.g. 2.5 kg plates).
 */
export function roundToStep(value: number, step: number): number {
  if (step <= 0 || !Number.isFinite(value)) {
    return value;
  }
  return Math.round(value / step) * step;
}
