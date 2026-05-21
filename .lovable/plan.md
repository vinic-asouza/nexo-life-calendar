## Feature: Diário (anotações livres por dia)

Adicionar um espaço de anotações livres vinculado a cada dia, exibido na visualização diária como painel colapsável na parte inferior.

### Comportamento

- Visível apenas no `DayView` (não aparece em semana/mês).
- Painel fixo na parte inferior da área principal, ocupando toda a largura.
- Header clicável com:
  - Ícone (`BookText` do lucide-react) + label "Diário"
  - Indicador sutil quando há conteúdo salvo (ponto colorido)
  - Chevron que rotaciona ao expandir/recolher
- Ao expandir: revela um `Textarea` simples com altura confortável (~200px), placeholder tipo "Escreva livremente sobre o seu dia...".
- Estado de expansão lembrado em `localStorage` (`nexo_journal_expanded`).
- Auto-save com debounce (~600ms) ao digitar. Indicador discreto "Salvando..." / "Salvo".
- Cada entrada é única por data (`yyyy-MM-dd`).

### Persistência

Nova tabela `journal_entries` no backend (Lovable Cloud):
- `id`, `user_id`, `entry_date` (date, único por usuário), `content` (text), `created_at`, `updated_at`
- RLS: usuário só vê/edita suas próprias entradas
- Índice único `(user_id, entry_date)` para upsert

### Estrutura técnica

```text
src/
  components/
    DayJournal.tsx          (novo — painel collapsável + textarea + auto-save)
    DayView.tsx             (renderiza <DayJournal date={date} /> ao final)
  hooks/
    useJournal.ts           (novo — fetch/upsert por data, debounce)
  repositories/
    types.ts                (novo: JournalRepository)
    supabase/journal.ts     (novo: list/getByDate/upsert)
    index.ts                (registra journal)
```

### Layout

```text
┌─ DayView ──────────────────────────────┐
│  Header data                            │
│  ScrollArea (itens do dia)              │
│  ...                                    │
├─────────────────────────────────────────┤
│  📔 Diário                          ⌄   │  ← header clicável
├─────────────────────────────────────────┤
│  [ textarea livre, altura ~200px ]      │  ← visível se expandido
│                            Salvo ✓      │
└─────────────────────────────────────────┘
```

O painel fica fora do `ScrollArea` dos itens, ancorado ao bottom da `main`, sem afetar week/month.

### Migração SQL (resumo)

- Criar `public.journal_entries` com colunas acima
- Habilitar RLS + 4 políticas (`select/insert/update/delete` próprias)
- Constraint `unique(user_id, entry_date)`
- Trigger para `updated_at`
