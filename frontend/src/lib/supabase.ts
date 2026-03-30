import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

const { url, anon, configured } = getSupabaseEnv();

if (!configured) {
  console.warn(
    "Fit Flow: defina VITE_SUPABASE_URL (https://...) e VITE_SUPABASE_ANON_KEY em frontend/.env e reinicie o servidor (npm run dev).",
  );
}

/**
 * Placeholder só para o cliente não quebrar na importação quando o .env ainda
 * não está preenchido. A tela de login usa hasSupabaseConfig() para avisar.
 */
const safeUrl = configured ? url : "https://example.supabase.co";
const safeAnon = configured
  ? anon
  : "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiJ9.invalid-placeholder";

export const supabase = createClient(safeUrl, safeAnon);
