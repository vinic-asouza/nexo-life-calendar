## Objetivo

Permitir associar horário (início e opcionalmente fim) aos itens, exibir em todos os lugares onde itens aparecem, e permitir ao usuário escolher entre organizar por **Tipo** (atual) ou por **Horário** (cronológico, sem separação).

---

## 1. Modelo de dados

**`src/types/index.ts` — `CalendarItem`**
- Adicionar campos opcionais:
  - `startTime?: string` — formato `"HH:mm"` (24h, hora local)
  - `endTime?: string` — formato `"HH:mm"`, opcional
- Itens sem `startTime` = "Sem horário" (dia inteiro) e vão sempre no final quando ordenados cronologicamente.

**Banco (`items`)**
- Migração: adicionar colunas `start_time time NULL` e `end_time time NULL`.
- Atualizar `src/repositories/supabase/items.ts` (`toDomain` / `toRow`) para mapear `start_time`/`end_time` ↔ `startTime`/`endTime`.

---

## 2. Preferência de organização

**`src/types/index.ts`**
- Adicionar `export type GroupingMode = 'type' | 'time';`

**`src/pages/Index.tsx`**
- Novo estado `grouping: GroupingMode`, persistido em `localStorage` (`nexo_grouping`), default `'type'`.
- Passar `grouping` para `DayView`, `WeekView`, `MonthView` e para `AppSidebar` junto com setter.

**`src/components/AppSidebar.tsx`**
- Nova seção no topo (ou abaixo de Áreas/Tipos) chamada **"Organização"** com dois radio buttons / toggle:
  - "Por tipo" (default)
  - "Por horário"
- Quando colapsada, mostrar ícone (ex: `LayoutList` / `Clock`).

---

## 3. Formulário do item (`ItemModal.tsx`)

Reorganizar campos no modo create/edit:

```
[ Título                                    ]
[ Data ]  [ Hora início ] [ Hora fim ]   ← 3 colunas
[ Área ]                  [ Tipo ]
( Mais opções ▾ )
  [ Data final ]
  [ Recorrência ]
  [ Notas ]
```

- `Hora início` e `Hora fim`: `<Input type="time">`.
- `endTime` requer `startTime`; se `startTime` for limpo, limpar `endTime`.
- No modo `view`: exibir abaixo da data → `"14:00 – 15:30"` ou `"14:00"` ou ocultar se vazio. Ícone `Clock` antes.
- Atualizar `handleSubmit` para incluir `startTime`/`endTime`.

---

## 4. Exibição do horário nos itens

**Helpers novos em `src/lib/utils.ts` (ou novo `src/lib/itemSort.ts`)**
- `formatItemTime(item): string | null` → `"14:00"`, `"14:00–15:30"`, ou `null`.
- `compareByTime(a, b)`: itens sem hora vão ao final; demais ordenados por `startTime`.
- `groupItemsByType(items, types, areas)` — extrai a lógica duplicada hoje em Day/Week/MonthView.
- `sortItemsChronologically(items)` — para modo "Por horário".

**`DayView.tsx`**
- Se `grouping === 'time'`: renderizar **uma lista única** ordenada por horário, sem header de tipo. Manter cores por área.
- Se `grouping === 'type'`: como hoje, mas dentro de cada grupo ordenar por `startTime` (depois por área como tiebreaker).
- Em cada linha de item, exibir o horário à esquerda do título (badge monoespaçado pequeno) ou após o título. Sugestão: à esquerda, largura fixa (`w-12`) para alinhar verticalmente; itens sem hora mostram `—` ou ficam vazios.

**`WeekView.tsx`**
- Mesma lógica de `grouping` aplicada por coluna de dia.
- Espaço é apertado: exibir horário inline antes do título em `text-[10px] tabular-nums text-muted-foreground` e truncar título.

**`MonthView.tsx` — modal "ver dia"**
- Mesma lógica de `grouping` aplicada à listagem do modal.
- Exibir horário antes do título no mesmo padrão do `DayView`.
- Os "dots" da célula do mês permanecem sem mudança visual (continuam por área), mas a ordem dos dots passa a respeitar horário quando `grouping === 'time'`.

---

## 5. Resumo dos arquivos a tocar

- `src/types/index.ts` — campos de horário + `GroupingMode`.
- Migração Supabase — colunas `start_time`, `end_time`.
- `src/repositories/supabase/items.ts` — mapeamento.
- `src/lib/itemSort.ts` (novo) — helpers compartilhados.
- `src/pages/Index.tsx` — estado de grouping + persistência + props.
- `src/components/AppSidebar.tsx` — seletor de organização.
- `src/components/ItemModal.tsx` — campos de hora + exibição em view.
- `src/components/DayView.tsx` — usa helpers + respeita grouping + mostra hora.
- `src/components/WeekView.tsx` — idem.
- `src/components/MonthView.tsx` — idem (modal de dia).

---

## 6. Pontos de cuidado

- **Compat com itens existentes**: `startTime`/`endTime` são opcionais; itens antigos continuam funcionando e aparecem como "sem horário".
- **Ordenação estável**: ao ordenar por horário, usar fallback por título ou ordem de área para evitar saltos.
- **Recorrência**: o horário pertence ao item e se replica em todas as ocorrências (não muda lógica de `getItemsForDate`).
- **Acessibilidade**: `<input type="time">` em pt-BR já formata 24h.
- **Sem mudanças de cor/blur dos modais** — preservar o padrão atual já alinhado.

A migração de banco será aplicada primeiro (requer aprovação), e em seguida o resto do código.
