# Fit Flow

PWA de fichas de treino: **carga final** por exercício, **cálculo automático** das fases (AQ1, AQ2, AJ1, AJ2, trabalho) com arredondamento (passo 2,5 kg), **técnicas** em texto, e **exportação PDF** no navegador.

## Stack

- **Monorepo** npm workspaces: `frontend/`, `packages/domain/`
- **Frontend:** Vite, React 19, TypeScript, Tailwind CSS v4, TanStack Query, React Router, `vite-plugin-pwa`, `@react-pdf/renderer` (carregado sob demanda)
- **Domínio:** `@fit-flow/domain` — tipos, percentuais padrão e `computePhaseLoads` (testes com Vitest)
- **Backend:** Supabase (PostgreSQL + Auth + RLS)

## Pré-requisitos

- Node.js 20+
- Conta [Supabase](https://supabase.com) (plano gratuito serve)

## Configuração do Supabase

1. Crie um projeto no Supabase.
2. No **SQL Editor**, execute **na ordem** os arquivos em [`supabase/migrations/`](supabase/migrations/) (ou use `supabase db push` com o CLI):
   - `20250329000000_initial.sql` — `profiles`, `workouts`, `workout_exercises`, RLS e trigger de perfil
   - `20250413000000_preferences.sql` — coluna `preferences` (jsonb) em `profiles`
   - `20250413000002_ai_suggest_log.sql` — rate limit da Edge Function de IA
   - `20250413000003_workout_logs.sql` — histórico de treino (`workout_logs`, `exercise_log_entries`)
3. Em **Authentication → Providers**, habilite **Email** (para desenvolvimento, em **Auth → Providers → Email**, você pode desativar “Confirm email” para testar mais rápido).
4. Copie **Project URL** e **anon public key** (Settings → API).

### IA (Gemini) — Edge Function opcional

1. Crie uma chave em [Google AI Studio](https://aistudio.google.com/) e defina no Supabase: `supabase secrets set GEMINI_API_KEY=sua_chave`.
2. Faça o deploy da função: `supabase functions deploy ai-suggest` (código em [`supabase/functions/ai-suggest/`](supabase/functions/ai-suggest/)).
3. No frontend, em `frontend/.env`, defina `VITE_AI_ENABLED=true` para exibir os botões de sugestão; sem isso (ou `false`), a UI de IA fica oculta.

## Variáveis de ambiente

Na pasta `frontend/`:

```bash
cp .env.example .env
```

Edite `frontend/.env` (sem aspas nos valores, URL começando com `https://`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
# opcional — habilita botões que chamam a Edge Function ai-suggest
# VITE_AI_ENABLED=true
```

Depois de alterar o `.env`, **pare e rode de novo** `npm run dev` — o Vite só lê as variáveis na subida do servidor.

## Desenvolvimento

Na raiz do repositório:

```bash
npm install
npm run dev
```

Abra o URL exibido pelo Vite (geralmente `http://localhost:5173`).

### Scripts

| Comando        | Descrição                          |
| -------------- | ---------------------------------- |
| `npm run dev`  | Servidor de desenvolvimento (Vite) |
| `npm run build`| Build de `domain` + `frontend`     |
| `npm run test` | Testes do pacote `domain`          |
| `npm run lint` | ESLint no frontend                 |

## Deploy (ex.: Vercel)

1. Conecte o repositório à Vercel.
2. **Root directory:** `frontend` **ou** configure o comando de build na raiz: `npm run build` e **output directory:** `frontend/dist`.
3. Adicione as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` nas Environment Variables do projeto.

## Modelo de dados (resumo)

- `profiles`: `display_name`, `preferences` (jsonb).
- `workouts`: ficha por usuário (`user_id`, `title`, `notes`, …).
- `workout_exercises`: linhas com `exercise_name`, `final_load_kg`, `phases_config` (JSON com fases ligadas/desligadas e `pct` opcional), `techniques` (array de strings).
- `workout_logs` / `exercise_log_entries`: registro ao finalizar um treino no app.
- `ai_suggest_log`: contagem por usuário/hora para rate limit da IA.

A lógica de percentuais padrão (33%, 50%, 67%, 83%, 100%) está em `packages/domain` e pode evoluir sem acoplar ao React.

## Licença

Uso privado / estudo — ajuste conforme necessário.
