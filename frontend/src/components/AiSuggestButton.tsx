import { isAiEnabled } from "@/lib/ai";
import { useAiSuggest } from "@/lib/useAiSuggest";
import type { AiSuggestType } from "@/lib/useAiSuggest";
import { useCallback, useId, useState } from "react";

type Props = {
  type: AiSuggestType;
  payload: Record<string, unknown>;
  /** Merge suggested text into a field */
  onApply?: (text: string) => void;
  /** Button label */
  label?: string;
  className?: string;
};

export function AiSuggestButton({
  type,
  payload,
  onApply,
  label = "IA",
  className = "",
}: Props) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [lastText, setLastText] = useState<string | null>(null);
  const m = useAiSuggest();

  const run = useCallback(() => {
    m.mutate(
      { type, payload },
      {
        onSuccess: (t) => setLastText(t),
      },
    );
  }, [m, type, payload]);

  if (!isAiEnabled()) return null;

  return (
    <div className={`relative inline-flex flex-col items-stretch ${className}`}>
      <button
        type="button"
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen && lastText == null && !m.isPending) run();
        }}
        disabled={m.isPending}
        className="focus-ring rounded-full border border-violet-300/80 bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-900 transition hover:bg-violet-100 disabled:opacity-50"
        aria-expanded={open}
        aria-controls={panelId}
      >
        {m.isPending ? "…" : `✦ ${label}`}
      </button>
      {open ? (
        <div
          id={panelId}
          role="region"
          aria-label="Sugestão da IA"
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-black/10 bg-white p-4 shadow-xl"
        >
          {m.isError ? (
            <p className="text-sm text-rose-600">
              {(m.error as Error).message}
            </p>
          ) : null}
          {lastText ? (
            <>
              <p className="whitespace-pre-wrap text-sm text-neutral-800">
                {lastText}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Sugestão gerada por IA. Não substitui orientação profissional.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {onApply ? (
                  <button
                    type="button"
                    onClick={() => {
                      onApply(lastText);
                      setOpen(false);
                    }}
                    className="focus-ring rounded-full bg-ink px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    Aplicar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => run()}
                  disabled={m.isPending}
                  className="focus-ring rounded-full border border-black/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-ink"
                >
                  Gerar de novo
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="focus-ring text-xs font-semibold uppercase tracking-wider text-neutral-500"
                >
                  Fechar
                </button>
              </div>
            </>
          ) : m.isPending ? (
            <p className="text-sm text-neutral-500">Gerando…</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
