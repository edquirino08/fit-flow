import { AuthProvider } from "@/lib/AuthProvider";
import { useAuth } from "@/lib/useAuth";
import { LoginPage } from "@/pages/LoginPage";
import { TrainingPage } from "@/pages/TrainingPage";
import { WorkoutEditPage } from "@/pages/WorkoutEditPage";
import { WorkoutHistoryPage } from "@/pages/WorkoutHistoryPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { WorkoutsListPage } from "@/pages/WorkoutsListPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
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
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <WorkoutsListPage />
          </Protected>
        }
      />
      <Route
        path="/workouts/:id/treino"
        element={
          <Protected>
            <TrainingPage />
          </Protected>
        }
      />
      <Route
        path="/workouts/:id/historico"
        element={
          <Protected>
            <WorkoutHistoryPage />
          </Protected>
        }
      />
      <Route
        path="/workouts/:id"
        element={
          <Protected>
            <WorkoutEditPage />
          </Protected>
        }
      />
      <Route
        path="/perfil"
        element={
          <Protected>
            <ProfilePage />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
