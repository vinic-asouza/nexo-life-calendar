import { useEffect, useState } from 'react';
import { ChevronDown, BookText, Check, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useJournal } from '@/hooks/useJournal';

interface DayJournalProps {
  date: string; // YYYY-MM-DD
}

const STORAGE_KEY = 'nexo_journal_expanded';

export function DayJournal({ date }: DayJournalProps) {
  const [expanded, setExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, expanded ? '1' : '0');
  }, [expanded]);

  const { content, loading, saveState, updateContent } = useJournal(date);
  const hasContent = content.trim().length > 0;

  return (
    <div className="shrink-0 border-t border-border/60 bg-card/40 backdrop-blur-sm">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 md:px-8 hover:bg-accent/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Diário</span>
          {hasContent && (
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-label="Possui anotações" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {expanded && saveState === 'saving' && (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Salvando…
            </span>
          )}
          {expanded && saveState === 'saved' && (
            <span className="inline-flex items-center gap-1">
              <Check className="h-3 w-3" /> Salvo
            </span>
          )}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          />
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 md:px-8 md:pb-6">
          <Textarea
            value={content}
            onChange={(e) => updateContent(e.target.value)}
            placeholder={loading ? 'Carregando…' : 'Escreva livremente sobre o seu dia…'}
            disabled={loading}
            className="min-h-[180px] resize-y bg-background/60"
          />
        </div>
      )}
    </div>
  );
}
