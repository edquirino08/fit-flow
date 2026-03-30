export function trimEnv(name: string): string {
  const v = import.meta.env[name] as string | undefined;
  return typeof v === "string" ? v.trim() : "";
}

export function isValidHttpUrl(s: string): boolean {
  if (!s) return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function getSupabaseEnv(): { url: string; anon: string; configured: boolean } {
  const url = trimEnv("VITE_SUPABASE_URL");
  const anon = trimEnv("VITE_SUPABASE_ANON_KEY");
  const configured = isValidHttpUrl(url) && anon.length > 0;
  return { url, anon, configured };
}
