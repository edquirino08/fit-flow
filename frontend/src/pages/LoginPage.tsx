import { BrandLogo } from "@/components/BrandLogo";
import { StarMark } from "@/components/StarMark";
import { useAuth } from "@/lib/useAuth";
import { hasSupabaseConfig } from "@/lib/require-env";
import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

export function LoginPage() {
  const { signIn, signUp, user, loading } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const ready = hasSupabaseConfig();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface text-ink">
        <img
          src="/fit-flow-mark.svg"
          alt=""
          className="h-12 w-12 animate-pulse rounded-2xl"
        />
        <p className="text-sm font-medium uppercase tracking-widest text-neutral-500">
          Carregando…
        </p>
      </div>
    );
  }
  if (user) {
    return <Navigate to="/" replace />;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const fn = mode === "signin" ? signIn : signUp;
      const { error: err } = await fn(email, password);
      if (err) {
        setError(err.message);
        return;
      }
      nav("/", { replace: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:pt-12 md:pt-16">
        <div className="mb-10 flex flex-col items-center text-center sm:mb-14">
          <StarMark className="mb-6 h-5 w-5 text-ink opacity-90" />
          <h1 className="font-display text-[clamp(2.75rem,8vw,5.5rem)] leading-[0.95] tracking-wide text-ink uppercase">
            Encontre sua força
          </h1>
          <p className="mt-4 max-w-md text-sm font-medium leading-relaxed text-neutral-600 sm:text-base">
            Treino deve ser claro e acessível. Fichas com fases, cargas
            calculadas e PDF na hora.
          </p>
        </div>

        <div className="relative mx-auto mb-10 max-w-3xl overflow-hidden rounded-[2rem] bg-ink px-6 py-14 text-center shadow-xl sm:px-10 sm:py-16">
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl"
            aria-hidden
          />
          <p className="font-display relative text-3xl tracking-wide text-white uppercase sm:text-4xl md:text-5xl">
            Dentro e fora.
          </p>
          <p className="relative mt-3 text-sm text-white/60">
            Organize séries, reps e evolução em um só lugar.
          </p>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center">
            <BrandLogo size="md" to={null} />
          </div>

          <div className="rounded-[2rem] border border-black/[0.08] bg-white p-6 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-8">
            {!ready ? (
              <p className="rounded-2xl border border-amber-200/80 bg-amber-50 p-4 text-sm text-amber-950">
                Configure{" "}
                <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-xs">
                  VITE_SUPABASE_URL
                </code>{" "}
                e{" "}
                <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-xs">
                  VITE_SUPABASE_ANON_KEY
                </code>{" "}
                em{" "}
                <code className="rounded-md bg-amber-100/90 px-1.5 py-0.5 text-xs">
                  frontend/.env
                </code>{" "}
                e rode a migration no Supabase. Veja o README.
              </p>
            ) : null}

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  E-mail
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-surface px-4 py-3.5 text-ink placeholder:text-neutral-400"
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Senha
                </label>
                <input
                  type="password"
                  autoComplete={
                    mode === "signin" ? "current-password" : "new-password"
                  }
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus-ring mt-2 w-full rounded-2xl border border-black/10 bg-surface px-4 py-3.5 text-ink placeholder:text-neutral-400"
                />
              </div>
              {error ? (
                <p className="text-sm font-medium text-rose-600">{error}</p>
              ) : null}
              <button
                type="submit"
                disabled={!ready || pending}
                className="focus-ring w-full rounded-full bg-ink py-3.5 text-sm font-semibold uppercase tracking-widest text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {pending ? "…" : mode === "signin" ? "Entrar" : "Criar conta"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-neutral-500">
              {mode === "signin" ? (
                <>
                  Novo por aqui?{" "}
                  <button
                    type="button"
                    className="font-semibold text-ink underline-offset-4 hover:underline"
                    onClick={() => setMode("signup")}
                  >
                    Criar conta
                  </button>
                </>
              ) : (
                <>
                  Já tem conta?{" "}
                  <button
                    type="button"
                    className="font-semibold text-ink underline-offset-4 hover:underline"
                    onClick={() => setMode("signin")}
                  >
                    Entrar
                  </button>
                </>
              )}
            </p>
          </div>

          <p className="mt-8 text-center">
            <Link
              to="/"
              className="text-xs font-semibold uppercase tracking-widest text-neutral-400 transition hover:text-ink"
            >
              Voltar
            </Link>
          </p>
        </div>
      </div>

      <footer className="bg-ink px-4 py-10">
        <p className="text-center font-display text-xl uppercase tracking-wide text-white sm:text-2xl">
          Seu corpo é seu templo.
        </p>
        <p className="mt-2 text-center text-xs text-white/50">
          © Fit Flow
        </p>
      </footer>
    </div>
  );
}
