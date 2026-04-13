/** Nome canônico + grupo para autocomplete e PDF. */
export type CatalogExercise = { name: string; group: string };

export const EXERCISE_CATALOG: CatalogExercise[] = [
  { name: "Supino reto com barra", group: "Peito" },
  { name: "Supino inclinado com halteres", group: "Peito" },
  { name: "Supino declinado", group: "Peito" },
  { name: "Crucifixo reto", group: "Peito" },
  { name: "Crucifixo inclinado", group: "Peito" },
  { name: "Flexão de braços", group: "Peito" },
  { name: "Desenvolvimento com barra", group: "Ombros" },
  { name: "Desenvolvimento com halteres", group: "Ombros" },
  { name: "Elevação lateral", group: "Ombros" },
  { name: "Elevação frontal", group: "Ombros" },
  { name: "Remada alta", group: "Ombros" },
  { name: "Encolhimento com barra", group: "Trapezio" },
  { name: "Face pull", group: "Ombros" },
  { name: "Rosca direta com barra", group: "Biceps" },
  { name: "Rosca alternada com halteres", group: "Biceps" },
  { name: "Rosca martelo", group: "Biceps" },
  { name: "Rosca concentrada", group: "Biceps" },
  { name: "Rosca Scott", group: "Biceps" },
  { name: "Triceps testa", group: "Triceps" },
  { name: "Triceps corda", group: "Triceps" },
  { name: "Triceps francês", group: "Triceps" },
  { name: "Paralelas na barra", group: "Triceps" },
  { name: "Puxada frontal", group: "Costas" },
  { name: "Puxada com triângulo", group: "Costas" },
  { name: "Remada curvada com barra", group: "Costas" },
  { name: "Remada unilateral com halter", group: "Costas" },
  { name: "Pullover com halter", group: "Costas" },
  { name: "Levantamento terra", group: "Posterior" },
  { name: "Stiff com barra", group: "Posterior" },
  { name: "Mesa flexora", group: "Posterior" },
  { name: "Cadeira flexora", group: "Posterior" },
  { name: "Agachamento livre", group: "Quadriceps" },
  { name: "Agachamento frontal", group: "Quadriceps" },
  { name: "Leg press 45°", group: "Quadriceps" },
  { name: "Extensão de joelhos", group: "Quadriceps" },
  { name: "Afundo com halteres", group: "Quadriceps" },
  { name: "Passada", group: "Quadriceps" },
  { name: "Elevação pélvica", group: "Gluteos" },
  { name: "Abdução na máquina", group: "Gluteos" },
  { name: "Cadeira extensora", group: "Quadriceps" },
  { name: "Panturrilha em pé", group: "Panturrilha" },
  { name: "Panturrilha sentado", group: "Panturrilha" },
  { name: "Abdominal infra", group: "Abdomen" },
  { name: "Abdominal supra", group: "Abdomen" },
  { name: "Prancha", group: "Abdomen" },
  { name: "Prancha lateral", group: "Abdomen" },
  { name: "Woodchop na polia", group: "Core" },
  { name: "Russian twist", group: "Core" },
];

export function suggestExercises(query: string): CatalogExercise[] {
  const q = query.trim().toLowerCase();
  if (!q) return EXERCISE_CATALOG.slice(0, 14);
  return EXERCISE_CATALOG.filter((e) =>
    e.name.toLowerCase().includes(q),
  ).slice(0, 24);
}

export function getMuscleGroupForName(name: string): string | undefined {
  const n = name.trim().toLowerCase();
  const hit = EXERCISE_CATALOG.find((e) => e.name.toLowerCase() === n);
  return hit?.group;
}
