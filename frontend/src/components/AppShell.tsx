import type { ReactNode } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { ProfileHeaderLink } from "@/components/ProfileHeaderLink";

type Props = {
  children: ReactNode;
  /** Conteúdo à direita no header (botões, etc.) */
  actions?: ReactNode;
  /** Navegação central (desktop) */
  nav?: ReactNode;
};

export function AppShell({ children, actions, nav }: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-surface text-ink">
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-surface/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-4 sm:py-4">
          <div className="flex min-w-0 shrink-0 items-center gap-1">
            <BrandLogo size="sm" to="/" />
            <ProfileHeaderLink />
          </div>
          {nav ? (
            <div className="hidden flex-1 justify-center md:flex">{nav}</div>
          ) : (
            <div className="hidden flex-1 md:block" aria-hidden />
          )}
          <div className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-ink px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-3xl text-center">
          <p className="font-display text-2xl uppercase tracking-wide text-white sm:text-3xl md:text-4xl">
            Seu corpo é seu templo.
          </p>
          <p className="mt-3 text-sm text-white/55">
            Fit Flow — fichas de treino, cargas por fase e PDF.
          </p>
        </div>
      </footer>
    </div>
  );
}
