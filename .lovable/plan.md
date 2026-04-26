## Visão geral

Transformar o NEXO em um SaaS MVP multi-tenant usando **Lovable Cloud** (Supabase gerenciado), mantendo o frontend e a UX intactos. Toda a lógica de domínio existente continua funcionando — só trocamos a fonte de dados (localStorage → Postgres com RLS por `user_id`) e adicionamos auth.

**Princípio chave de portabilidade:** introduzir uma camada fina de **Repository** (`src/repositories/*`) com interfaces puras (`ItemsRepository`, `AreasRepository`, `TypesRepository`, `AuthRepository`). Os hooks (`useItems`, `useAreas`, `useTypes`) consomem essas interfaces, não o cliente Supabase diretamente. No futuro, trocar de backend = trocar uma implementação. Sem over-engineering: uma interface por entidade, uma implementação Supabase, ponto.

---

## Etapa 1 — Fundação (Lovable Cloud + schema + camada de repositório)

**Objetivo:** ligar o backend, criar o schema multi-tenant e a abstração de dados, sem ainda mexer na UI.

1. **Habilitar Lovable Cloud** no projeto (cria automaticamente `src/integrations/supabase/client.ts` e `.env`).
2. **Schema Postgres** via migration:
   - `profiles` (id = `auth.users.id`, `display_name`, `created_at`) + trigger `handle_new_user` que insere a linha no signup + seeds das `areas`/`types` default por usuário.
   - `areas` (`id uuid pk`, `user_id uuid not null references auth.users on delete cascade`, `name text`, `color text`, `created_at`).
   - `types` (`id uuid pk`, `user_id`, `name text`, `created_at`).
   - `items` (`id uuid pk`, `user_id`, `title`, `start_date date`, `end_date date null`, `area_id uuid references areas`, `type_id uuid references types`, `recurrence jsonb null`, `notes text null`, `status text check in ('pending','done')`, `completed_dates date[] default '{}'`, `checklist jsonb default '[]'`, `comments jsonb default '[]'`, `created_at`).
   - **RLS habilitada em todas** com policies `user_id = auth.uid()` para SELECT/INSERT/UPDATE/DELETE. Sem `user_roles` agora (não há admin no MVP).
   - Índices: `items(user_id, start_date)`, `areas(user_id)`, `types(user_id)`.
3. **Camada de repositório** (`src/repositories/`):
   - `types.ts` — interfaces puras (`ItemsRepository`, `AreasRepository`, `TypesRepository`, `AuthRepository`) sem dependência de Supabase.
   - `supabase/items.ts`, `supabase/areas.ts`, `supabase/types.ts`, `supabase/auth.ts` — implementações.
   - `index.ts` — factory: `getRepositories()` retorna o conjunto ativo (hoje só Supabase). Trocar provedor no futuro = nova pasta + mudar a factory.
   - Mapeadores `dbRow ↔ CalendarItem` (snake_case ↔ camelCase) ficam dentro da implementação, não vazam para o domínio.

**Entregável:** banco pronto, RLS ativa, repositórios compilam e podem ser chamados manualmente. UI ainda usa localStorage.

---

## Etapa 2 — Autenticação (email/senha + Google + recuperação)

1. **Auth Context** (`src/context/AuthContext.tsx`):
   - `useEffect` ordem obrigatória: `onAuthStateChange` PRIMEIRO, depois `getSession()`.
   - Expõe `{ user, session, loading, signUp, signIn, signInWithGoogle, signOut, resetPassword }` consumindo `AuthRepository`.
   - `signUp` com `emailRedirectTo: window.location.origin` (sem confirmação obrigatória — configurar no painel).
2. **Páginas**:
   - `/auth` — tabs Login/Cadastro, botão "Continuar com Google", link "Esqueci a senha". Validação com **zod** (email válido, senha ≥ 8 chars, trim, limites).
   - `/reset-password` — form para nova senha; detecta `type=recovery` no hash e chama `updateUser({ password })`.
3. **Rotas protegidas**:
   - `<ProtectedRoute>` em `App.tsx` envolvendo `/`. Redireciona para `/auth` se não logado, mostra loader enquanto `loading`.
   - `/auth` e `/reset-password` ficam públicas.
4. **Header**: avatar/email do usuário + botão "Sair".
5. **Google OAuth**: habilitar provider no painel Cloud (instrução para o usuário no fim).

**Entregável:** fluxo completo signup → login → dashboard → logout → reset de senha funcionando.

---

## Etapa 3 — Migração dos hooks para o repositório (multi-tenant real)

Conforme decisão: **localStorage é descartado**. Usuário novo começa com áreas/tipos default (criados pelo trigger no signup).

1. **Reescrever `useItems`, `useAreas`, `useTypes`** para usar **React Query** (já está no projeto):
   - `useQuery(['items', userId], () => repo.items.list())` — habilitada só com sessão.
   - Mutations (`addItem`, `updateItem`, `deleteItem`, `toggleStatus`) com **optimistic updates** para manter a UX instantânea atual.
   - `toggleStatus` para items recorrentes: continua manipulando `completed_dates` (array Postgres) com a mesma lógica.
   - Cross-tab sync via Supabase Realtime (opcional MVP) — por enquanto, `refetchOnWindowFocus` já cobre.
2. **Apagar** `src/services/storage.ts` e remover seus consumidores. `CalendarDataContext` continua exatamente como está (mesma API exposta), só a fonte muda.
3. **Helpers puros** (`isItemDoneOnDate`, `getItemsForDate`, `recurringFallsOnDate`) **não mudam** — operam sobre o tipo `CalendarItem` do domínio.
4. **Filtros**: ao carregar áreas/tipos, inicializar `FilterState` com todos os IDs do usuário (mesma lógica atual).

**Entregável:** dois usuários diferentes veem dados completamente isolados. Tudo persiste no Postgres.

---

## Etapa 4 — Polimento MVP

1. **Loading states**: skeleton no calendário enquanto `useQuery` carrega na primeira vez.
2. **Error handling**: toasts via Sonner em falhas de mutation; mensagem amigável se RLS bloquear (não deve acontecer, mas defensivo).
3. **Validação zod** nos forms de Item/Area/Type (limites de tamanho, trim).
4. **README atualizado**: como rodar local, como o multi-tenant funciona, como trocar o repositório no futuro.
5. **Build + smoke test**: `npm run build` + criar 2 contas de teste e validar isolamento.

---

## Estrutura final de pastas (mudanças)

```
src/
├── context/
│   ├── AuthContext.tsx              [novo]
│   └── CalendarDataContext.tsx      [mantém API, troca fonte]
├── repositories/                    [novo]
│   ├── types.ts                     (interfaces puras)
│   ├── index.ts                     (factory)
│   └── supabase/
│       ├── client.ts (re-export)
│       ├── auth.ts
│       ├── items.ts
│       ├── areas.ts
│       └── types.ts
├── pages/
│   ├── Auth.tsx                     [novo]
│   ├── ResetPassword.tsx            [novo]
│   ├── Index.tsx                    (protegida)
│   └── NotFound.tsx
├── components/
│   ├── ProtectedRoute.tsx           [novo]
│   └── ... (existentes inalterados)
├── hooks/
│   ├── useAuth.ts                   [novo]
│   ├── useItems.ts                  (React Query + repo)
│   ├── useAreas.ts                  (React Query + repo)
│   └── useTypes.ts                  (React Query + repo)
└── services/storage.ts              [removido]

supabase/migrations/<timestamp>_init_saas.sql   [novo]
```

---

## O que NÃO está no escopo (conforme pedido)

- Billing / planos
- Roles / permissões (admin, etc.)
- Convites / times / workspaces compartilhados
- Refatoração de UI / design system
- Realtime entre dispositivos (deixado para depois — `refetchOnWindowFocus` cobre o MVP)

---

## Após aprovação, eu vou:

1. Habilitar Lovable Cloud e rodar a migration (Etapa 1).
2. Criar repositórios e auth (Etapas 1 + 2) num bloco coeso.
3. Migrar os hooks (Etapa 3).
4. Polir, validar build e te entregar instruções para habilitar o Google OAuth no painel.