#!/usr/bin/env node
/**
 * Seed script — imports the 4 workouts (A/B/C/D) from
 * "TREINO ABCD intermediários" PDF into the logged-in user's account.
 *
 * Usage:
 *   node scripts/seed-abcd.mjs <email> <password>
 *   node scripts/seed-abcd.mjs --session-file ./sb-session.json
 *
 * Sessão do navegador (GitHub/OAuth ou se não lembrar da senha):
 *   1. Entre no Fit Flow no Chrome (localhost ou deploy).
 *   2. F12 → Application → Local Storage → origem do site.
 *   3. Chave: sb-hvxlqfxajxowrcwoqkiy-auth-token (copie o VALOR = JSON).
 *   4. Salve num arquivo, ex.: sb-session.json
 *   5. node scripts/seed-abcd.mjs --session-file sb-session.json
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hvxlqfxajxowrcwoqkiy.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eGxxZnhhanhvd3Jjd29xa2l5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4MjYzNTgsImV4cCI6MjA5MDQwMjM1OH0.8hI-_A06A4gy7COigCAD6Mc5oe1LFsEmdyNRqKTNJRE";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

function phases({ aq1 = false, aq2 = false, aj1 = false, aj2 = false, work = false } = {}) {
  return {
    aq1: { enabled: aq1 },
    aq2: { enabled: aq2 },
    aj1: { enabled: aj1 },
    aj2: { enabled: aj2 },
    work: { enabled: work },
  };
}

const WORKOUTS = [
  {
    title: "Treino A — Peito + Bíceps",
    exercises: [
      {
        exercise_name: "Supino inclinado com halteres ou máquina",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Supino reto com halteres ou máquina",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["rest-pause 2×10s"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s última série",
      },
      {
        exercise_name: "Supino declinado barra ou máquina",
        phases_config: phases({ aj1: true, work: true }),
        techniques: [],
        notes: "AJ: 1×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Voador (pico 2s contração)",
        phases_config: {
          aq1: { enabled: false },
          aq2: { enabled: false },
          aj1: { enabled: true },
          aj2: { enabled: false },
          work: { enabled: true, reps: "10-15" },
        },
        techniques: ["pico 2s", "drop set"],
        notes: "AJ: 1-2×4-6 · Trab: 1×10-15 + 1 drop set",
      },
      {
        exercise_name: "Rosca direta barra livre ou cabo com barra",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Rosca Scott máquina",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["rest-pause 2×10s"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s última série",
      },
      {
        exercise_name: "Rosca direta corda",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["drop set"],
        notes: "AJ: 1×4-6 · Trab: 1×6-10 + 1 drop set",
      },
      {
        exercise_name: "Abdominal supra na prancha declinada",
        phases_config: {
          aq1: { enabled: false },
          aq2: { enabled: false },
          aj1: { enabled: false },
          aj2: { enabled: false },
          work: { enabled: true, reps: "15-20", sets: 3 },
        },
        techniques: [],
        notes: "3×15-20 · Intervalo 1 min",
      },
    ],
  },
  {
    title: "Treino B — Costas + Panturrilha",
    exercises: [
      {
        exercise_name: "Remada curvada com barra (pico 2s contração)",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: ["pico 2s"],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Remada baixa triângulo (pico 2s contração)",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["pico 2s", "rest-pause 2×10s"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s",
      },
      {
        exercise_name: "Remada baixa pegada aberta ou máquina (pico 2s contração)",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["pico 2s"],
        notes: "AJ: 1×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Pulley frente triângulo (pico 2s contração)",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["pico 2s", "drop set"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 1 drop set",
      },
      {
        exercise_name: "Meio Terra",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Panturrilha máquina ou em pé no smith",
        phases_config: phases({ aq1: true, aj1: true }),
        techniques: [],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6",
      },
    ],
  },
  {
    title: "Treino C — Ombro + Tríceps",
    exercises: [
      {
        exercise_name: "Desenvolvimento halteres ou máquina",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Elevação frontal corda ou halteres",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["rest-pause 2×10s"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s",
      },
      {
        exercise_name: "Elevação lateral",
        phases_config: phases({ aj1: true, work: true }),
        techniques: [],
        notes: "AJ: 1×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Elevação unilateral cabo",
        phases_config: {
          aq1: { enabled: false },
          aq2: { enabled: false },
          aj1: { enabled: true },
          aj2: { enabled: false },
          work: { enabled: true, reps: "10-15" },
        },
        techniques: ["drop set"],
        notes: "AJ: 1-2×4-6 · Trab: 1×10-15 + 1 drop set",
      },
      {
        exercise_name: "Tríceps testa corda",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Tríceps corda",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["rest-pause 2×10s"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s",
      },
      {
        exercise_name: "Tríceps francês",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["drop set"],
        notes: "AJ: 1×4-6 · Trab: 1×6-10 + 1 drop set",
      },
      {
        exercise_name: "Abdominal infra na torre",
        phases_config: {
          aq1: { enabled: false },
          aq2: { enabled: false },
          aj1: { enabled: false },
          aj2: { enabled: false },
          work: { enabled: true, reps: "15-20", sets: 3 },
        },
        techniques: [],
        notes: "3×15-20 · Intervalo 1 min",
      },
    ],
  },
  {
    title: "Treino D — Perna",
    exercises: [
      {
        exercise_name: "Panturrilha sentada",
        phases_config: {
          aq1: { enabled: true },
          aq2: { enabled: false },
          aj1: { enabled: true },
          aj2: { enabled: false },
          work: { enabled: true, sets: 3 },
        },
        techniques: [],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 3×6-10",
      },
      {
        exercise_name: "Agachamento livre",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1-2×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Leg 45",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: ["rest-pause 2×10s"],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s última série",
      },
      {
        exercise_name: "Extensor",
        phases_config: phases({ aj1: true, work: true }),
        techniques: ["drop set"],
        notes: "AJ: 1-2×4-6 · Trab: 1×6-10 + drop set",
      },
      {
        exercise_name: "Flexor deitado (pico 2s contração)",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: ["pico 2s", "rest-pause 2×10s"],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10 + 2 rest pause 10s última série",
      },
      {
        exercise_name: "Stiff",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: [],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
      {
        exercise_name: "Elevação de quadril (pico 2s contração)",
        phases_config: phases({ aq1: true, aj1: true, work: true }),
        techniques: ["pico 2s"],
        notes: "AQ: 1×10-15 · AJ: 1-2×4-6 · Trab: 1×6-10",
      },
    ],
  },
];

async function seedWorkouts(userId) {
  for (const w of WORKOUTS) {
    console.log(`\nCriando "${w.title}"...`);
    const { data: row, error: e1 } = await supabase
      .from("workouts")
      .insert({ title: w.title, user_id: userId })
      .select("id")
      .single();
    if (e1) {
      console.error("  Erro ao criar workout:", e1.message);
      continue;
    }
    const workoutId = row.id;
    console.log(`  workout_id = ${workoutId}`);

    for (let i = 0; i < w.exercises.length; i++) {
      const ex = w.exercises[i];
      const { error: e2 } = await supabase.from("workout_exercises").insert({
        workout_id: workoutId,
        sort_order: i,
        exercise_name: ex.exercise_name,
        final_load_kg: null,
        phases_config: ex.phases_config,
        techniques: ex.techniques,
        notes: ex.notes,
      });
      if (e2) {
        console.error(`  Erro no exercício "${ex.exercise_name}":`, e2.message);
      } else {
        console.log(`  ✓ ${ex.exercise_name}`);
      }
    }
  }

  console.log("\n✅ Seed concluído! Abra o app para ver as fichas.");
}

function printUsage() {
  console.error(`Uso:
  node scripts/seed-abcd.mjs <email> <senha>
  node scripts/seed-abcd.mjs --session-file ./sb-session.json

Sem senha (sessão do navegador — vale para login OAuth):
  1. Entre no Fit Flow no Chrome.
  2. F12 → Application → Local Storage → URL do app.
  3. Copie o valor da chave: sb-hvxlqfxajxowrcwoqkiy-auth-token
  4. Cole num arquivo sb-session.json (só o JSON, uma linha).
  5. node scripts/seed-abcd.mjs --session-file sb-session.json
`);
}

async function main() {
  const argv = process.argv.slice(2);
  let userId;

  if (argv[0] === "--session-file") {
    const sessionPath = argv[1] || process.env.FITFLOW_SESSION_FILE;
    if (!sessionPath) {
      console.error(
        "Use: node scripts/seed-abcd.mjs --session-file ./sb-session.json",
      );
      process.exit(1);
    }
    const absSession = resolve(process.cwd(), sessionPath);
    let parsed;
    try {
      parsed = JSON.parse(readFileSync(absSession, "utf8"));
    } catch (e) {
      if (e && e.code === "ENOENT") {
        console.error(`Arquivo não existe: ${absSession}`);
        console.error(`
Você precisa CRIAR esse arquivo antes de rodar o comando:

  1. No Chrome, com o Fit Flow aberto e você logado:
     F12 → Application → Local Storage → clique na URL do app
  2. Encontre a chave: sb-hvxlqfxajxowrcwoqkiy-auth-token
  3. Copie o VALOR (é um JSON com "access_token" e "refresh_token")
  4. No VS Code/Cursor: New File → salve como sb-session.json
     na pasta do projeto: ${process.cwd()}
     e cole o JSON inteiro.

Depois rode de novo (na pasta fit-flow):
  node scripts/seed-abcd.mjs --session-file ./sb-session.json
`);
      } else {
        console.error("Não consegui ler o JSON:", e.message);
        printUsage();
      }
      process.exit(1);
    }
    const access_token = parsed.access_token;
    const refresh_token = parsed.refresh_token;
    if (!access_token || !refresh_token) {
      console.error(
        "O JSON precisa conter access_token e refresh_token (formato Supabase).",
      );
      process.exit(1);
    }
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error || !data.session?.user) {
      console.error(
        "Sessão inválida ou expirada. Entre de novo no app e copie o token de novo.",
        error?.message ?? "",
      );
      process.exit(1);
    }
    userId = data.session.user.id;
    console.log(`Sessão do navegador OK — usuário ${userId}`);
  } else {
    const [email, password] = argv;
    if (!email || !password) {
      printUsage();
      process.exit(1);
    }

    console.log(`Autenticando ${email}...`);
    const { data: auth, error: authErr } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });
    if (authErr) {
      console.error("Erro de autenticação:", authErr.message);
      process.exit(1);
    }
    userId = auth.user.id;
    console.log(`Logado como ${userId}`);
  }

  await seedWorkouts(userId);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
