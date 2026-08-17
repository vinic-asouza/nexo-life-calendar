# NEXO — Life Calendar

Calendário unificado (SPA) para organizar tarefas, eventos, hábitos e lembretes em uma única
entidade ("Item"), com visualizações de Dia, Semana e Mês, filtros por Área/Tipo e diário diário.

## Stack

- React 18 + TypeScript + Vite 5
- Tailwind CSS 3 + shadcn/ui (Radix UI)
- TanStack Query (cache e estado de servidor)
- React Router 6
- Supabase (auth, banco Postgres com RLS)
- Vitest + Testing Library

## Pré-requisitos

- Node.js 18+ (recomendado 20+)
- npm, pnpm ou bun (o repositório versiona `bun.lock`; com npm o lockfile será recriado)
- Um projeto Supabase (existente ou novo)

## Instalação

```sh
git clone <URL_DO_REPOSITORIO>
cd <PASTA_DO_PROJETO>
bun install     # ou: npm install
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável                        | Descrição                                            |
| ------------------------------- | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL do projeto Supabase                              |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Chave anon/publishable (pública, protegida por RLS)  |
| `VITE_SUPABASE_PROJECT_ID`      | ID do projeto (usado pela CLI do Supabase)           |

Sem essas variáveis o cliente Supabase inicializa com `undefined` e a aplicação não carrega dados.
A `service_role key` e a senha do banco **não** devem existir no frontend.

## Banco de dados

As migrações versionadas ficam em `supabase/migrations`. Para aplicar em um projeto novo:

```sh
npx supabase link --project-ref <PROJECT_ID>
npx supabase db push
```

Autenticação: e-mail/senha e Google OAuth. O provedor Google precisa ser configurado no painel do
Supabase (Authentication → Providers), com as URLs de redirect apontando para a origem da aplicação
(`http://localhost:8080` em desenvolvimento).

## Comandos

| Comando             | Descrição                                     |
| ------------------- | --------------------------------------------- |
| `bun run dev`       | Servidor de desenvolvimento em `:8080`        |
| `bun run build`     | Build de produção em `dist/`                  |
| `bun run build:dev` | Build com `mode=development`                  |
| `bun run preview`   | Serve o build gerado                          |
| `bun run lint`      | ESLint                                        |
| `bun run test`      | Testes (Vitest, execução única)               |
| `bun run test:watch`| Testes em modo watch                          |

## Estrutura

```
src/
  components/        Componentes de domínio (calendário, modais, sidebar, header)
    ui/              Primitivos shadcn/ui usados pelo app
  context/           AuthContext (sessão) e CalendarDataContext (dados do calendário)
  hooks/             Hooks de dados/UI (useItems, useCollection, useJournal, ...)
  integrations/
    supabase/        Cliente e tipos gerados (não editar manualmente)
  lib/               Utilitários puros (ordenação/agrupamento de itens, cn)
  pages/             Rotas (Index, Auth, ResetPassword, NotFound)
  repositories/      Contratos de acesso a dados + implementação Supabase
  types/             Tipos de domínio compartilhados
supabase/migrations/ Migrações SQL
```

O acesso a dados é isolado em `src/repositories`: os hooks consomem apenas as interfaces em
`src/repositories/types.ts`, e a implementação Supabase é selecionada em `src/repositories/index.ts`.

## Observações sobre o ambiente Lovable

O projeto foi iniciado na Lovable. Itens ainda relacionados a esse ambiente:

- `lovable-tagger` (devDependency) é usado apenas em `vite.config.ts` no modo desenvolvimento para
  marcar componentes no editor visual. Pode ser removido localmente sem impacto funcional
  (remover o plugin do `vite.config.ts` junto).
- `.lovable/` e `src/tailwind.config.lov.json` são metadados do editor; não afetam o build.
- Os plugins `@lovable.dev/vite-plugin-*` são injetados pelo ambiente hospedado e não são
  referenciados pelo `vite.config.ts` deste repositório.
