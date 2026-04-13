import { useCallback, useEffect, useRef, useState } from "react";

const PRESETS = [30, 60, 90, 120] as const;

function playBeep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
    void ctx.close();
  } catch {
    /* ignore */
  }
}

export function RestTimer() {
  const [targetSec, setTargetSec] = useState(60);
  const [remaining, setRemaining] = useState(60);
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState("");
  const firedRef = useRef(false);

  const applyPreset = useCallback((sec: number) => {
    setTargetSec(sec);
    setRemaining(sec);
    setRunning(false);
    firedRef.current = false;
  }, []);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (remaining === 0 && !running && targetSec > 0 && !firedRef.current) {
      firedRef.current = true;
      playBeep();
    }
  }, [remaining, running, targetSec]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <section
      className="rounded-3xl border-2 border-ink/15 bg-ink p-5 text-white shadow-lg sm:p-6"
      aria-label="Timer de descanso"
    >
      <h2 className="text-center font-display text-xl uppercase tracking-wide sm:text-2xl">
        Descanso
      </h2>
      <p
        className="mt-4 text-center font-mono text-5xl font-bold tabular-nums sm:text-6xl"
        aria-live="polite"
      >
        {fmt(remaining)}
      </p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {PRESETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applyPreset(s)}
            className="focus-ring rounded-full bg-white/15 px-3 py-2 text-xs font-semibold uppercase tracking-wider transition hover:bg-white/25"
            aria-label={`Definir descanso de ${s} segundos`}
          >
            {s}s
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-center gap-2">
        <label className="sr-only" htmlFor="rest-custom">
          Segundos personalizados
        </label>
        <input
          id="rest-custom"
          type="text"
          inputMode="numeric"
          placeholder="outro"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="focus-ring w-20 rounded-full border border-white/30 bg-white/10 px-3 py-2 text-center text-sm text-white placeholder:text-white/50"
        />
        <button
          type="button"
          onClick={() => {
            const n = Number.parseInt(custom, 10);
            if (Number.isFinite(n) && n > 0 && n <= 600) applyPreset(n);
          }}
          className="focus-ring rounded-full bg-white/20 px-3 py-2 text-xs font-semibold uppercase tracking-wider"
          aria-label="Aplicar tempo personalizado em segundos"
        >
          OK
        </button>
      </div>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            if (remaining === 0) {
              firedRef.current = false;
              setRemaining(targetSec);
              setRunning(true);
              return;
            }
            setRunning((r) => !r);
          }}
          className="focus-ring rounded-full bg-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-ink"
          aria-label={
            running
              ? "Pausar timer de descanso"
              : remaining === 0
                ? "Reiniciar e iniciar timer de descanso"
                : "Iniciar timer de descanso"
          }
        >
          {running ? "Pausar" : remaining === 0 ? "De novo" : "Iniciar"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false);
            firedRef.current = false;
            setRemaining(targetSec);
          }}
          className="focus-ring rounded-full border border-white/40 px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white"
          aria-label="Zerar timer de descanso"
        >
          Reset
        </button>
      </div>
    </section>
  );
}
