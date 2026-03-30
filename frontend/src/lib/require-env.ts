import { getSupabaseEnv } from "./env";

/** True quando URL e chave estão definidas e a URL é HTTP(S) válida. */
export function hasSupabaseConfig(): boolean {
  return getSupabaseEnv().configured;
}
