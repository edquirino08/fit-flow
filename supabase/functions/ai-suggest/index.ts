import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Body = {
  type: "techniques" | "title" | "phase" | "tip";
  payload: Record<string, unknown>;
};

const MAX_PER_HOUR = 10;

function buildPrompt(type: Body["type"], payload: Record<string, unknown>): string {
  const disclaimer =
    "Responda em português do Brasil. Seja breve. Não prescreva tratamento médico nem substitua profissional de educação física.";

  switch (type) {
    case "techniques": {
      const name = String(payload.exerciseName ?? "").trim() || "exercício";
      const ctx = String(payload.context ?? "").trim();
      return `${disclaimer}\n\nPara o exercício "${name}"${ctx ? ` (${ctx})` : ""}, sugira 2 ou 3 técnicas de intensificação comuns na musculação (ex.: rest-pause, drop set), uma frase curta cada. Formato: lista com hífens.`;
    }
    case "title": {
      const names = Array.isArray(payload.exerciseNames)
        ? (payload.exerciseNames as string[]).filter(Boolean).join(", ")
        : "";
      return `${disclaimer}\n\nDados estes exercícios de uma ficha: ${names || "(vazio)"}.\nSugira um título curto e motivador para a ficha (máx. 6 palavras). Apenas o título, sem aspas.`;
    }
    case "phase": {
      const label = String(payload.phaseLabel ?? "AQ1");
      return `${disclaimer}\n\nExplique em 2 frases simples o que costuma ser a fase "${label}" num aquecimento progressivo até a carga de trabalho na musculação.`;
    }
    case "tip": {
      const n = Number(payload.exerciseCount) || 0;
      const title = String(payload.workoutTitle ?? "").trim();
      return `${disclaimer}\n\nFicha de treino com ${n} exercício(s)${title ? `, título: "${title}"` : ""}.\nDê uma dica prática de organização ou execução no treino (2 frases).`;
    }
    default:
      return `${disclaimer}\n\nOlá.`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiKey) {
      return new Response(
        JSON.stringify({ error: "IA não configurada no servidor" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userClient = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await admin
      .from("ai_suggest_log")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", oneHourAgo);

    if (countErr) {
      console.error(countErr);
      return new Response(JSON.stringify({ error: "Erro ao verificar limite" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if ((count ?? 0) >= MAX_PER_HOUR) {
      return new Response(
        JSON.stringify({
          error: `Limite de ${MAX_PER_HOUR} sugestões por hora. Tente mais tarde.`,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = (await req.json()) as Body;
    if (!body?.type || !body.payload) {
      return new Response(JSON.stringify({ error: "Corpo inválido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = buildPrompt(body.type, body.payload);
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(geminiKey)}`;

    const gRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 512,
        },
      }),
    });

    if (!gRes.ok) {
      const t = await gRes.text();
      console.error("Gemini error", gRes.status, t);
      return new Response(
        JSON.stringify({ error: "Falha ao gerar sugestão. Tente de novo." }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const gJson = (await gRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text =
      gJson.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ??
      "";

    const trimmed = text.trim();
    if (!trimmed) {
      return new Response(JSON.stringify({ error: "Resposta vazia do modelo" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("ai_suggest_log").insert({ user_id: user.id });

    return new Response(JSON.stringify({ text: trimmed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
