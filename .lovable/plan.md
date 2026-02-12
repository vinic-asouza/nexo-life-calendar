

# NEXO — Calendário Unificado MVP

## Visão Geral
Um calendário único onde tudo na vida do usuário se organiza no tempo. Sem módulos separados, sem complexidade — apenas itens com propriedades, organizados por Áreas e Tipos. O objetivo é alívio mental.

---

## 1. Design System & Identidade Visual
- Paleta baseada em amarelo (#f7b23b) como acento, backgrounds quentes (#f7f2e9 / #ffffff), texto escuro (#0d0f16)
- Tipografia moderna e leve, espaçamentos generosos
- Componentes com personalidade sutil — fugindo do visual corporativo sem exagerar
- Dark mode não incluído no MVP (foco na identidade clara e acolhedora)

## 2. Layout Principal (Página Única)
**Header fixo:**
- Logo NEXO à esquerda
- Navegação de datas (anterior/hoje/próximo) ao centro
- Seletor de visão (Dia / Semana / Mês)
- Botão principal "+" para criar item

**Sidebar colapsável:**
- Lista de Áreas com checkbox colorido para filtro rápido
- Lista de Tipos com checkbox para filtro rápido
- Botão de gerenciar conta (placeholder para futuro)
- Colapsa para versão mini com ícones no desktop, drawer no mobile

## 3. Visão de Dia
- Exibe dia da semana e data em destaque
- Cards compactos dos itens do dia com: título, flag colorida da área, badge de tipo, status (pendente/concluído), horário se aplicável
- Observações visíveis de forma sutil no card
- Click no card → modal de visualização com botão para alternar para edição
- Botão "+" para adicionar item naquele dia

## 4. Visão de Semana
- 7 colunas horizontais (Segunda a Sexta individuais, Sábado e Domingo dividindo a última coluna verticalmente)
- Cards resumidos nos dias (flag de área + título apenas)
- Hover sobre um dia revela botão "+" para criar item
- Click no card → modal de visualização/edição

## 5. Visão de Mês
- Grade de calendário mensal completa
- Itens aparecem como flags coloridas (cor da área) apenas com o título
- Hover sobre um dia revela botão "+" para criar item
- Click na flag → modal de visualização/edição
- Indicador visual quando há mais itens do que cabem no dia

## 6. Criação de Item (UX crítico)
- Modal/drawer rápido e progressivo
- Campos: Título (obrigatório), Data/intervalo, Área (select), Tipo (select), Recorrência (opcional), Observações (opcional)
- Título como primeiro campo com foco automático
- Campos secundários colapsáveis ou revelados progressivamente
- Recorrência com opções: Diariamente, Semanalmente, Mensalmente, Dias Úteis, Personalizado (seleção de dias da semana)
- Criar com Enter rápido (apenas título + data pré-preenchida)

## 7. Gerenciamento de Áreas
- Criar/editar/excluir áreas diretamente na sidebar
- Cada área tem: nome + cor
- Interface inline simples (sem página separada)

## 8. Gerenciamento de Tipos
- Criar/editar/excluir tipos diretamente na sidebar
- Cada tipo tem apenas: nome (texto simples)
- Interface inline simples

## 9. Filtros
- Checkboxes nas Áreas da sidebar filtram o calendário em tempo real
- Checkboxes nos Tipos da sidebar filtram em tempo real
- Filtros combinam (área + tipo)
- Estado visual claro de quais filtros estão ativos

## 10. Persistência de Dados
- localStorage como camada de persistência inicial
- Arquitetura com camada de serviço/repositório abstraída, facilitando futura migração para API/Supabase
- Hooks customizados para CRUD de itens, áreas e tipos

## 11. Responsividade
- Desktop: layout completo com sidebar + calendário
- Tablet: sidebar colapsável, visões adaptadas
- Mobile: sidebar como drawer, visão de dia como padrão, navegação simplificada

## 12. Aspectos Técnicos
- TypeScript com tipagem rigorosa
- Componentes bem separados e reutilizáveis
- Camada de dados abstraída (hooks + services) pronta para backend futuro
- Performance otimizada (React.memo, virtualização se necessário)
- Sem dependências pesadas desnecessárias

