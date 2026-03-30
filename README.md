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
2. No **SQL Editor**, execute o conteúdo de [`supabase/migrations/20250329000000_initial.sql`](supabase/migrations/20250329000000_initial.sql) (tabelas `profiles`, `workouts`, `workout_exercises`, RLS e trigger de perfil).
3. Em **Authentication → Providers**, habilite **Email** (para desenvolvimento, em **Auth → Providers → Email**, você pode desativar “Confirm email” para testar mais rápido).
4. Copie **Project URL** e **anon public key** (Settings → API).

## Variáveis de ambiente

Na pasta `frontend/`:

```bash
cp .env.example .env
```

Edite `frontend/.env` (sem aspas nos valores, URL começando com `https://`):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
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

- `workouts`: ficha por usuário (`user_id`, `title`, …).
- `workout_exercises`: linhas com `exercise_name`, `final_load_kg`, `phases_config` (JSON com fases ligadas/desligadas e `pct` opcional), `techniques` (array de strings).

A lógica de percentuais padrão (33%, 50%, 67%, 83%, 100%) está em `packages/domain` e pode evoluir sem acoplar ao React.

## Licença

Uso privado / estudo — ajuste conforme necessário.
