import { isAiEnabled } from "@/lib/ai";
import { useAiSuggest } from "@/lib/useAiSuggest";
import { useState } from "react";

type Props = {
  phaseLabel: string;
};

export function PhaseExplainButton({ phaseLabel }: Props) {
  const [open, setOpen] = useState(false);
  const m = useAiSuggest();

  if (!isAiEnabled()) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          m.reset();
          m.mutate({ type: "phase", payload: { phaseLabel } });
        }}
        className="focus-ring ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-700 hover:bg-neutral-300"
        aria-label={`Explicar fase ${phaseLabel} com IA`}
      >
        ?
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phase-ai-title"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
          }}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="phase-ai-title"
              className="font-display text-xl uppercase tracking-wide text-ink"
            >
              Fase {phaseLabel}
            </h2>
            {m.isPending ? (
              <p className="mt-4 text-sm text-neutral-500">Gerando…</p>
            ) : null}
            {m.isError ? (
              <p className="mt-4 text-sm text-rose-600">
                {(m.error as Error).message}
              </p>
            ) : null}
            {m.isSuccess ? (
              <>
                <p className="mt-4 whitespace-pre-wrap text-sm text-neutral-800">
                  {m.data}
                </p>
                <p className="mt-3 text-xs text-neutral-500">
                  Sugestão gerada por IA. Não substitui orientação profissional.
                </p>
              </>
            ) : null}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="focus-ring mt-6 rounded-full bg-ink px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
