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
      <div className="flex min-h-screen items-center justify-center text-slate-500">
        Carregando…
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
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <h1 className="text-center text-2xl font-semibold tracking-tight text-white">
          Fit Flow
        </h1>
        <p className="mt-1 text-center text-sm text-slate-400">
          Fichas de treino com cargas por fase e PDF
        </p>

        {!ready ? (
          <p className="mt-6 rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 text-sm text-amber-100">
            Configure <code className="rounded bg-black/30 px-1">VITE_SUPABASE_URL</code>{" "}
            e <code className="rounded bg-black/30 px-1">VITE_SUPABASE_ANON_KEY</code>{" "}
            no arquivo <code className="rounded bg-black/30 px-1">frontend/.env</code>{" "}
            e rode a migration no Supabase. Veja o README.
          </p>
        ) : null}

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">E-mail</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Senha</label>
            <input
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-emerald-500/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {error ? (
            <p className="text-sm text-rose-400">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={!ready || pending}
            className="w-full rounded-xl bg-emerald-600 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500">
          {mode === "signin" ? (
            <>
              Novo por aqui?{" "}
              <button
                type="button"
                className="text-emerald-400 hover:underline"
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
                className="text-emerald-400 hover:underline"
                onClick={() => setMode("signin")}
              >
                Entrar
              </button>
            </>
          )}
        </p>
        <p className="mt-6 text-center text-xs text-slate-600">
          <Link to="/" className="hover:text-slate-400">
            Voltar
          </Link>
        </p>
      </div>
    </div>
  );
}
