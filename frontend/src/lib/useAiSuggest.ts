import { supabase } from "@/lib/supabase";
import { useMutation } from "@tanstack/react-query";

export type AiSuggestType = "techniques" | "title" | "phase" | "tip";

export function useAiSuggest() {
  return useMutation({
    mutationFn: async (input: {
      type: AiSuggestType;
      payload: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase.functions.invoke<{
        text?: string;
        error?: string;
      }>("ai-suggest", { body: input });
      if (error) throw new Error(error.message);
      if (data && typeof data === "object" && data.error) {
        throw new Error(String(data.error));
      }
      const text = data?.text;
      if (!text?.trim()) throw new Error("Resposta vazia");
      return text.trim();
    },
  });
}
