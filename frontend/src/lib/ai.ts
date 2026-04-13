export function isAiEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED === "true";
}
