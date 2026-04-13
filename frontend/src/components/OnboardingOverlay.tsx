import { writeOnboardingDone } from "@/lib/onboarding-storage";
import { useCallback, useState } from "react";

const SLIDES = [
  {
    title: "Crie sua ficha",
    body: "Use Nova ficha para começar. Você pode duplicar fichas depois e ajustar no seu ritmo.",
  },
  {
    title: "Carga final e fases",
    body: "Informe a carga de trabalho. O Fit Flow calcula AQ1, AQ2, AJ1, AJ2 e arredonda para anilhas (passo 2,5 kg nas fases de aquecimento).",
  },
  {
    title: "PDF e modo treino",
    body: "Exporte PDF para imprimir ou treine no celular com Iniciar treino — timer de descanso e checklists locais.",
  },
] as const;

export function OnboardingOverlay({ onDismiss }: { onDismiss?: () => void }) {
  const [step, setStep] = useState(0);
  const finish = useCallback(() => {
    writeOnboardingDone();
    onDismiss?.();
  }, [onDismiss]);

  const s = SLIDES[step];
  const last = step === SLIDES.length - 1;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onb-title"
      aria-describedby="onb-desc"
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
          Bem-vindo
        </p>
        <h2
          id="onb-title"
          className="mt-2 font-display text-3xl uppercase tracking-wide text-ink"
        >
          {s.title}
        </h2>
        <p
          id="onb-desc"
          className="mt-4 text-sm leading-relaxed text-neutral-700"
        >
          {s.body}
        </p>
        <div
          className="mt-6 flex gap-2"
          role="tablist"
          aria-label="Passo do tour"
        >
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${
                i === step ? "bg-ink" : "bg-black/10"
              }`}
            />
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-end gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((x) => x - 1)}
              className="focus-ring rounded-full px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-neutral-600"
            >
              Voltar
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => (last ? finish() : setStep((x) => x + 1))}
            className="focus-ring rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white"
          >
            {last ? "Concluir" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
